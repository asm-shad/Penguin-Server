import { ShippingCarrier, ShippingMethod, OrderStatus } from "@prisma/client";
import { IAuthUser } from "../../interfaces/common";
import prisma from "../../shared/prisma";

// Helper function
const createOrderTrackingRecord = async (
  orderId: string,
  status: OrderStatus,
  notes: string,
  userId?: string
) => {
  return await prisma.orderTracking.create({
    data: { orderId, status, notes, userId },
  });
};

// Add shipping to order
const addShipping = async (
  orderId: string,
  shippingData: any,
  user?: IAuthUser
) => {
  const {
    carrier,
    trackingNumber,
    shippingMethod,
    shippingCost,
    estimatedDays,
    notes,
  } = shippingData;

  // Validate order exists
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      shipping: true,
    },
  });

  // Check if shipping already exists
  if (order.shipping) {
    throw new Error("Shipping already exists for this order");
  }

  // Check if order is in a shippable status
  if (!["PAID", "PROCESSING"].includes(order.status)) {
    throw new Error(
      `Order must be in PAID or PROCESSING status to ship. Current status: ${order.status}`
    );
  }

  const result = await prisma.$transaction(async (transactionClient) => {
    // Create shipping record
    const shipping = await transactionClient.shipping.create({
      data: {
        orderId,
        carrier: carrier as ShippingCarrier,
        trackingNumber,
        shippingMethod: shippingMethod as ShippingMethod,
        shippingCost,
        estimatedDays,
        notes,
        shippedAt: new Date(),
      },
    });

    // Update order status to SHIPPED
    await transactionClient.order.update({
      where: { id: orderId },
      data: { status: "SHIPPED" },
    });

    // Create order tracking record
    await createOrderTrackingRecord(
      orderId,
      "SHIPPED",
      `Order shipped via ${carrier}${
        trackingNumber ? ` with tracking #${trackingNumber}` : ""
      }`,
      user?.id
    );

    return shipping;
  });

  return result;
};

// Update shipping information
const updateShipping = async (
  orderId: string,
  shippingData: any,
  user?: IAuthUser
) => {
  const {
    carrier,
    trackingNumber,
    shippingMethod,
    shippingCost,
    estimatedDays,
    shippedAt,
    deliveredAt,
    notes,
  } = shippingData;

  // Validate shipping exists
  const shipping = await prisma.shipping.findUniqueOrThrow({
    where: { orderId },
    include: {
      order: true,
    },
  });

  const updateShippingData: any = {};

  if (carrier) updateShippingData.carrier = carrier as ShippingCarrier;
  if (shippingMethod)
    updateShippingData.shippingMethod = shippingMethod as ShippingMethod;
  if (trackingNumber) updateShippingData.trackingNumber = trackingNumber;
  if (shippingCost !== undefined)
    updateShippingData.shippingCost = shippingCost;
  if (estimatedDays !== undefined)
    updateShippingData.estimatedDays = estimatedDays;
  if (shippedAt) updateShippingData.shippedAt = new Date(shippedAt);
  if (deliveredAt) updateShippingData.deliveredAt = new Date(deliveredAt);
  if (notes) updateShippingData.notes = notes;

  const result = await prisma.$transaction(async (transactionClient) => {
    // Update shipping
    const updatedShipping = await transactionClient.shipping.update({
      where: { orderId },
      data: updateShippingData,
    });

    // If marked as delivered, update order status
    if (deliveredAt && !shipping.deliveredAt) {
      await transactionClient.order.update({
        where: { id: orderId },
        data: { status: "DELIVERED" },
      });

      // Create order tracking record
      await createOrderTrackingRecord(
        orderId,
        "DELIVERED",
        "Order delivered successfully",
        user?.id
      );
    }

    return updatedShipping;
  });

  return result;
};

// Track shipping by tracking number (public)
const trackShipping = async (trackingNumber: string) => {
  const result = await prisma.shipping.findFirst({
    where: {
      trackingNumber: {
        equals: trackingNumber,
        mode: "insensitive",
      },
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          customerName: true,
          shippingCity: true,
          shippingState: true,
          orderTrackings: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      },
    },
  });

  if (!result) {
    throw new Error("Shipping not found with this tracking number");
  }

  // Calculate estimated delivery date
  let estimatedDelivery = null;
  if (!result.deliveredAt && result.shippedAt && result.estimatedDays) {
    const shippedDate = new Date(result.shippedAt);
    shippedDate.setDate(shippedDate.getDate() + result.estimatedDays);
    estimatedDelivery = shippedDate;
  }

  return {
    trackingNumber: result.trackingNumber,
    carrier: result.carrier,
    shippingMethod: result.shippingMethod,
    shippedAt: result.shippedAt,
    deliveredAt: result.deliveredAt,
    estimatedDelivery,
    order: {
      ...result.order,
      trackingHistory: result.order.orderTrackings,
    },
  };
};

export const shippingService = {
  addShipping,
  updateShipping,
  trackShipping,
};
