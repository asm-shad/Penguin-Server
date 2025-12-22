import { Prisma, OrderStatus } from "@prisma/client";
import { Request } from "express";
import { IAuthUser } from "../../interfaces/common";
import { IPaginationOptions } from "../../interfaces/pagination";
import { orderSearchAbleFields } from "./order.constant";
import prisma from "../../shared/prisma";
import { paginationHelper } from "../../helper/paginationHelper";

// Generate unique order number
const generateOrderNumber = (): string => {
  const prefix = "ORD";
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
};

// Helper to create tracking record
const createOrderTrackingRecord = async (
  orderId: string,
  status: OrderStatus,
  notes: string,
  userId?: string
) => {
  try {
    // First verify the order exists
    const orderExists = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!orderExists) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    return await prisma.orderTracking.create({
      data: {
        orderId,
        status,
        notes,
        userId,
      },
    });
  } catch (error) {
    console.error(`Error creating order tracking for order ${orderId}:`, error);
    throw error;
  }
};

// Create order
const createOrder = async (req: Request & { user?: IAuthUser }) => {
  const user = req.user;
  const {
    shippingName,
    shippingAddress,
    shippingCity,
    shippingState,
    shippingZipCode,
    couponCode,
    orderItems,
  } = req.body;

  const result = await prisma.$transaction(async (transactionClient) => {
    // Track both original and discounted prices
    let subtotalWithoutDiscounts = 0; // Original prices total
    let subtotalWithProductDiscounts = 0; // After product discounts
    let totalProductDiscount = 0; // Total of all product discounts
    const orderItemsWithDetails = [];

    for (const item of orderItems) {
      if (item.variantId) {
        const product = await transactionClient.product.findUnique({
          where: { id: item.productId },
          include: {
            productVariants: {
              where: { id: item.variantId },
            },
          },
        });

        if (!product || product.productVariants.length === 0) {
          throw new Error(
            `Product variant not found: ${item.productId}/${item.variantId}`
          );
        }

        const variant = product.productVariants[0];

        if (variant.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for product: ${product.name} (${variant.name}: ${variant.value})`
          );
        }

        // Calculate product discount
        const basePrice = variant.price || product.price;
        const productDiscountPercent = product.discount || 0;
        const productDiscountAmount =
          (basePrice * productDiscountPercent) / 100;
        const discountedPrice = basePrice - productDiscountAmount;

        // Track totals
        const originalItemTotal = basePrice * item.quantity;
        const discountedItemTotal = discountedPrice * item.quantity;
        const itemProductDiscount = productDiscountAmount * item.quantity;

        subtotalWithoutDiscounts += originalItemTotal;
        subtotalWithProductDiscounts += discountedItemTotal;
        totalProductDiscount += itemProductDiscount;

        orderItemsWithDetails.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: discountedPrice, // Store the discounted price
          discount: itemProductDiscount, // Store total discount for this item
          productName: product.name,
          productSlug: product.slug,
          variantInfo: `${variant.name}: ${variant.value}`,
        });

        // Update variant stock
        await transactionClient.productVariant.update({
          where: { id: item.variantId },
          data: { stock: variant.stock - item.quantity },
        });
      } else {
        const product = await transactionClient.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}`);
        }

        // Calculate product discount
        const basePrice = product.price;
        const productDiscountPercent = product.discount || 0;
        const productDiscountAmount =
          (basePrice * productDiscountPercent) / 100;
        const discountedPrice = basePrice - productDiscountAmount;

        // Track totals
        const originalItemTotal = basePrice * item.quantity;
        const discountedItemTotal = discountedPrice * item.quantity;
        const itemProductDiscount = productDiscountAmount * item.quantity;

        subtotalWithoutDiscounts += originalItemTotal;
        subtotalWithProductDiscounts += discountedItemTotal;
        totalProductDiscount += itemProductDiscount;

        orderItemsWithDetails.push({
          productId: item.productId,
          variantId: null,
          quantity: item.quantity,
          unitPrice: discountedPrice, // Store the discounted price
          discount: itemProductDiscount, // Store total discount for this item
          productName: product.name,
          productSlug: product.slug,
          variantInfo: null,
        });

        // Update product stock
        await transactionClient.product.update({
          where: { id: item.productId },
          data: { stock: product.stock - item.quantity },
        });
      }
    }

    // Apply coupon if provided
    let couponDiscountAmount = 0;
    let coupon = null;

    // Use discounted subtotal for coupon validation
    const subtotalForCoupon = subtotalWithProductDiscounts;

    if (couponCode) {
      coupon = await transactionClient.coupon.findFirst({
        where: {
          code: couponCode,
          isActive: true,
          validFrom: { lte: new Date() },
          OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
        },
      });

      if (!coupon) {
        throw new Error("Invalid or expired coupon code");
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        throw new Error("Coupon usage limit reached");
      }

      if (coupon.minOrderAmount && subtotalForCoupon < coupon.minOrderAmount) {
        throw new Error(
          `Minimum order amount of $${coupon.minOrderAmount} required for this coupon`
        );
      }

      if (coupon.discountType === "PERCENTAGE") {
        couponDiscountAmount = (subtotalForCoupon * coupon.discountValue) / 100;
      } else {
        couponDiscountAmount = coupon.discountValue;
      }

      await transactionClient.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Calculate final totals
    const totalDiscountAmount = totalProductDiscount + couponDiscountAmount;
    const totalPrice = subtotalForCoupon - couponDiscountAmount;

    // Create order
    const order = await transactionClient.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName: shippingName,
        customerEmail: user?.email || "",
        // Store the original subtotal (without any discounts)
        subtotal: subtotalWithoutDiscounts,
        // Store total discount (product + coupon)
        discountAmount: totalDiscountAmount,
        // Store final price
        totalPrice,
        shippingName,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingZipCode,
        status: "PENDING",
        userId: user?.id || "",
        couponId: coupon?.id,
      },
    });

    console.log("✅ Order created with ID:", order.id);

    // Create order items
    await transactionClient.orderItem.createMany({
      data: orderItemsWithDetails.map((item) => ({
        ...item,
        orderId: order.id,
      })),
    });

    // Create initial tracking
    await transactionClient.orderTracking.create({
      data: {
        orderId: order.id,
        status: "PENDING",
        notes: "Order created",
        userId: user?.id,
      },
    });

    // Return full order
    const fullOrder = await transactionClient.order.findUnique({
      where: { id: order.id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        coupon: true,
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                discount: true,
              },
            },
            variant: {
              select: { id: true, name: true, value: true, price: true },
            },
          },
        },
        payments: true,
        orderTrackings: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        shipping: true,
      },
    });

    // Log for debugging
    console.log("Order totals:", {
      originalSubtotal: subtotalWithoutDiscounts,
      afterProductDiscounts: subtotalWithProductDiscounts,
      productDiscount: totalProductDiscount,
      couponDiscount: couponDiscountAmount,
      totalDiscount: totalDiscountAmount,
      finalTotal: totalPrice,
    });

    return fullOrder;
  });

  return result;
};

// Get all orders
const getAllFromDB = async (
  params: any,
  options: IPaginationOptions,
  user?: IAuthUser
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const {
    searchTerm,
    status,
    paymentStatus,
    customerEmail,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    ...filterData
  } = params;

  const andConditions: Prisma.OrderWhereInput[] = [];

  if (user && user.role === "USER") {
    andConditions.push({ userId: user.id });
  }

  if (searchTerm) {
    andConditions.push({
      OR: orderSearchAbleFields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  if (status) andConditions.push({ status: status as OrderStatus });
  if (customerEmail) {
    andConditions.push({
      customerEmail: { contains: customerEmail, mode: "insensitive" },
    });
  }
  if (startDate || endDate) {
    const dateCondition: any = {};
    if (startDate) dateCondition.gte = new Date(startDate);
    if (endDate) dateCondition.lte = new Date(endDate);
    andConditions.push({ orderDate: dateCondition });
  }
  if (minAmount !== undefined || maxAmount !== undefined) {
    const amountCondition: any = {};
    if (minAmount !== undefined) amountCondition.gte = parseFloat(minAmount);
    if (maxAmount !== undefined) amountCondition.lte = parseFloat(maxAmount);
    andConditions.push({ totalPrice: amountCondition });
  }

  // Payment status filter
  if (paymentStatus) {
    andConditions.push({
      payments: { some: { paymentStatus } },
    });
  }

  const whereConditions: Prisma.OrderWhereInput = {
    AND: andConditions.length > 0 ? andConditions : undefined,
  };

  const result = await prisma.order.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      coupon: true,
      orderItems: {
        include: {
          product: { select: { id: true, name: true, price: true } },
        },
      },
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      orderTrackings: { orderBy: { createdAt: "desc" }, take: 1 },
      shipping: true,
      _count: { select: { orderItems: true, returnRequests: true } },
    },
  });

  const total = await prisma.order.count({ where: whereConditions });

  return {
    meta: { page, limit, total },
    data: result,
  };
};

// Get order by ID
const getById = async (id: string, user?: IAuthUser) => {
  const whereCondition: Prisma.OrderWhereUniqueInput = { id };

  if (user && user.role === "USER") {
    whereCondition.userId = user.id;
  }

  const result = await prisma.order.findUniqueOrThrow({
    where: whereCondition,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      coupon: true,
      orderItems: {
        include: {
          product: {
            include: {
              productImages: { where: { isPrimary: true }, take: 1 },
            },
          },
          variant: true,
        },
      },
      payments: { orderBy: { createdAt: "desc" } },
      orderTrackings: { orderBy: { createdAt: "asc" } },
      shipping: true,
      invoice: true,
      returnRequests: { include: { returnItems: true } },
    },
  });

  return result;
};

// Get order by order number
const getByOrderNumber = async (orderNumber: string, user?: IAuthUser) => {
  const whereCondition: Prisma.OrderWhereUniqueInput = { orderNumber };

  if (user && user.role === "USER") {
    whereCondition.userId = user.id;
  }

  const result = await prisma.order.findUniqueOrThrow({
    where: whereCondition,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      coupon: true,
      orderItems: {
        include: {
          product: {
            include: {
              productImages: { where: { isPrimary: true }, take: 1 },
            },
          },
          variant: true,
        },
      },
      payments: { orderBy: { createdAt: "desc" } },
      orderTrackings: { orderBy: { createdAt: "asc" } },
      shipping: true,
      invoice: true,
    },
  });

  return result;
};

// Update order status
const updateOrderStatus = async (
  id: string,
  statusData: { status: OrderStatus; notes?: string },
  user?: IAuthUser
) => {
  const { status, notes } = statusData;

  const result = await prisma.$transaction(async (transactionClient) => {
    const updatedOrder = await transactionClient.order.update({
      where: { id },
      data: { status },
    });

    await createOrderTrackingRecord(
      id,
      status,
      notes || `Order status changed to ${status}`,
      user?.id
    );

    return updatedOrder;
  });

  return result;
};

// Get my orders
const getMyOrders = async (
  user: IAuthUser,
  params: any,
  options: IPaginationOptions
) => {
  // Always filter by the authenticated user's ID, regardless of role
  const modifiedParams = {
    ...params,
    userId: user.id, // Explicitly add userId to params
  };

  // Override the user parameter to ensure USER role for filtering
  const modifiedUser = {
    ...user,
    role: "USER" as const, // Force USER role to trigger filtering
  };

  return getAllFromDB(modifiedParams, options, modifiedUser);
};

// Get order statistics
const getOrderStatistics = async (user?: IAuthUser) => {
  const whereCondition: Prisma.OrderWhereInput = {};

  if (user && user.role === "USER") {
    whereCondition.userId = user.id;
  }

  const [
    totalOrders,
    pendingOrders,
    processingOrders,
    paidOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue,
  ] = await Promise.all([
    prisma.order.count({ where: whereCondition }),
    prisma.order.count({ where: { ...whereCondition, status: "PENDING" } }),
    prisma.order.count({ where: { ...whereCondition, status: "PROCESSING" } }),
    prisma.order.count({ where: { ...whereCondition, status: "PAID" } }),
    prisma.order.count({ where: { ...whereCondition, status: "SHIPPED" } }),
    prisma.order.count({ where: { ...whereCondition, status: "DELIVERED" } }),
    prisma.order.count({ where: { ...whereCondition, status: "CANCELLED" } }),
    prisma.order.aggregate({
      where: { ...whereCondition, status: { not: "CANCELLED" } },
      _sum: { totalPrice: true },
    }),
  ]);

  return {
    totalOrders,
    pendingOrders,
    processingOrders,
    paidOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue: totalRevenue._sum.totalPrice || 0,
  };
};

// Cancel order
const cancelOrder = async (id: string, user?: IAuthUser) => {
  const whereCondition: Prisma.OrderWhereUniqueInput = { id };

  if (user && user.role === "USER") {
    whereCondition.userId = user.id;
  }

  const order = await prisma.order.findUniqueOrThrow({
    where: whereCondition,
    include: {
      orderItems: true,
      payments: { where: { paymentStatus: "COMPLETED" } },
    },
  });

  if (order.payments.length > 0) {
    throw new Error(
      "Order cannot be cancelled because payment has been completed. Please request a refund instead."
    );
  }

  if (!["PENDING", "PROCESSING"].includes(order.status)) {
    throw new Error(`Order cannot be cancelled in ${order.status} status`);
  }

  const result = await prisma.$transaction(async (transactionClient) => {
    // Restore stock
    for (const item of order.orderItems) {
      if (item.variantId) {
        await transactionClient.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      } else {
        await transactionClient.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    const cancelledOrder = await transactionClient.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    await createOrderTrackingRecord(
      id,
      "CANCELLED",
      "Order cancelled",
      user?.id
    );

    // Cancel pending payments
    await transactionClient.payment.updateMany({
      where: { orderId: id, paymentStatus: "PENDING" },
      data: { paymentStatus: "CANCELLED" },
    });

    return cancelledOrder;
  });

  return result;
};

export const orderService = {
  createOrder,
  getAllFromDB,
  getById,
  getByOrderNumber,
  updateOrderStatus,
  getMyOrders,
  getOrderStatistics,
  cancelOrder,
};
