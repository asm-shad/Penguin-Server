import {
  Prisma,
  ReturnReason,
  ReturnStatus,
  ItemCondition,
  UserRole,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { Request } from "express";
import { IAuthUser } from "../../interfaces/common";
import { IPaginationOptions } from "../../interfaces/pagination";
import { returnSearchAbleFields } from "./return.constant";
import prisma from "../../shared/prisma";
import { paginationHelper } from "../../helper/paginationHelper";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiErrors";

// Create return request
const createReturnRequest = async (user: IAuthUser, payload: any) => {
  const { orderId, returnReason, additionalNotes, returnItems } = payload;

  // Check if user owns the order
  const order = await prisma.order.findUnique({
    where: { id: orderId, userId: user.id },
    include: {
      orderItems: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Order not found or you don't have permission"
    );
  }

  // Check if order is eligible for return (not cancelled, delivered within return period, etc.)
  const isEligibleForReturn = checkReturnEligibility(order);
  if (!isEligibleForReturn) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This order is not eligible for return"
    );
  }

  // Check if return already exists for this order
  const existingReturn = await prisma.returnRequest.findFirst({
    where: { orderId, userId: user.id },
  });

  if (existingReturn) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "A return request already exists for this order"
    );
  }

  const result = await prisma.$transaction(async (transactionClient) => {
    // Step 1: Create return request
    const returnRequest = await transactionClient.returnRequest.create({
      data: {
        orderId,
        userId: user.id,
        returnReason,
        additionalNotes,
        status: ReturnStatus.REQUESTED,
      },
    });

    // Step 2: Create return items
    for (const item of returnItems) {
      const orderItem = order.orderItems.find(
        (oi) => oi.id === item.orderItemId
      );

      if (!orderItem) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Order item ${item.orderItemId} not found in order`
        );
      }

      if (item.quantity > orderItem.quantity) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Return quantity cannot exceed purchased quantity for item ${orderItem.productName}`
        );
      }

      await transactionClient.returnItem.create({
        data: {
          returnId: returnRequest.id,
          orderItemId: item.orderItemId,
          productId: orderItem.productId,
          quantity: item.quantity,
          returnReason: item.returnReason,
          condition: item.condition,
          refundAmount: calculateRefundAmount(
            orderItem,
            item.quantity,
            item.condition
          ),
        },
      });
    }

    // Step 3: Update order status if needed
    await transactionClient.order.update({
      where: { id: orderId },
      data: {
        updatedAt: new Date(),
      },
    });

    // Step 4: Get the complete return request with items
    const completeReturnRequest =
      await transactionClient.returnRequest.findUnique({
        where: { id: returnRequest.id },
        include: {
          order: {
            select: {
              orderNumber: true,
              totalPrice: true,
              orderDate: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          returnItems: {
            include: {
              orderItem: {
                select: {
                  productName: true,
                  variantInfo: true,
                  unitPrice: true,
                },
              },
              product: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

    return completeReturnRequest;
  });

  return result;
};

// Helper function to check return eligibility
const checkReturnEligibility = (order: any) => {
  // Check if order is delivered
  if (order.status !== "DELIVERED") {
    return false;
  }

  // Check if within return period (e.g., 30 days from delivery)
  const deliveryDate = new Date(order.orderDate);
  const returnDeadline = new Date(deliveryDate);
  returnDeadline.setDate(returnDeadline.getDate() + 30); // 30-day return policy
  const now = new Date();

  return now <= returnDeadline;
};

// Helper function to calculate refund amount
const calculateRefundAmount = (
  orderItem: any,
  quantity: number,
  condition: ItemCondition
) => {
  let refundAmount = orderItem.unitPrice * quantity;

  // Apply deductions based on item condition
  switch (condition) {
    case ItemCondition.USED:
      refundAmount *= 0.5; // 50% refund for used items
      break;
    case ItemCondition.DAMAGED:
      refundAmount *= 0.3; // 30% refund for damaged items
      break;
    case ItemCondition.DEFECTIVE:
      // Full refund for defective items
      break;
    default:
      // Full refund for UNOPENED and LIKE_NEW
      break;
  }

  return Math.round(refundAmount * 100) / 100; // Round to 2 decimal places
};

// Get all return requests (for admin/staff)
const getAllFromDB = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.ReturnRequestWhereInput[] = [];

  if (params.searchTerm) {
    andConditions.push({
      OR: returnSearchAbleFields.map((field) => ({
        [field]: {
          contains: params.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.ReturnRequestWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.returnRequest.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
    include: {
      order: {
        select: {
          orderNumber: true,
          totalPrice: true,
          customerName: true,
          customerEmail: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      returnItems: {
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.returnRequest.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// Get return request by ID
const getById = async (id: string, user: IAuthUser) => {
  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          totalPrice: true,
          customerName: true,
          customerEmail: true,
          orderDate: true,
          status: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      returnItems: {
        include: {
          orderItem: {
            select: {
              productName: true,
              variantInfo: true,
              unitPrice: true,
              quantity: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              sku: true,
            },
          },
        },
      },
    },
  });

  if (!returnRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, "Return request not found");
  }

  // Check permissions
  if (user.role === UserRole.USER && returnRequest.userId !== user.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You don't have permission to view this return request"
    );
  }

  return returnRequest;
};

// Get my return requests
const getMyReturns = async (
  user: IAuthUser,
  params: any,
  options: IPaginationOptions
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { status, searchTerm } = params;

  const whereConditions: Prisma.ReturnRequestWhereInput = {
    userId: user.id,
  };

  if (status) {
    whereConditions.status = status as ReturnStatus;
  }

  if (searchTerm) {
    whereConditions.OR = [
      {
        order: {
          orderNumber: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      },
      {
        additionalNotes: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
    ];
  }

  const result = await prisma.returnRequest.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
    include: {
      order: {
        select: {
          orderNumber: true,
          totalPrice: true,
          orderDate: true,
          status: true,
        },
      },
      returnItems: {
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.returnRequest.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// Update return status (for admin/staff)
const updateReturnStatus = async (
  id: string,
  payload: any,
  user: IAuthUser
) => {
  const { status, refundAmount, additionalNotes } = payload;

  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id },
    include: {
      returnItems: true,
    },
  });

  if (!returnRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, "Return request not found");
  }

  const result = await prisma.$transaction(async (transactionClient) => {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (refundAmount) {
      updateData.refundAmount = refundAmount;
    }

    if (additionalNotes) {
      updateData.additionalNotes = additionalNotes;
    }

    if (status === ReturnStatus.APPROVED) {
      updateData.approvedAt = new Date();
      updateData.approvedBy = user.id;
    }

    if (status === ReturnStatus.REFUND_PROCESSED) {
      updateData.processedAt = new Date();
    }

    const updatedReturn = await transactionClient.returnRequest.update({
      where: { id },
      data: updateData,
    });

    // If return is approved, update product inventory
    if (status === ReturnStatus.APPROVED) {
      for (const item of returnRequest.returnItems) {
        await transactionClient.productInventory.create({
          data: {
            productId: item.productId,
            changeType: "RETURN",
            previousStock: 0, // This would need to be fetched from current stock
            newStock: 0, // This would need to be calculated
            changeQuantity: item.quantity,
            reason: `Return approved for order #${returnRequest.orderId}`,
            referenceId: returnRequest.id,
            notes: `Item condition: ${item.condition}`,
            userId: user.id,
          },
        });
      }
    }

    return updatedReturn;
  });

  return result;
};

// Cancel return request (by user)
const cancelReturnRequest = async (id: string, user: IAuthUser) => {
  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id },
  });

  if (!returnRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, "Return request not found");
  }

  if (returnRequest.userId !== user.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You don't have permission to cancel this return"
    );
  }

  if (returnRequest.status !== ReturnStatus.REQUESTED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Only requested returns can be cancelled"
    );
  }

  const cancelledReturn = await prisma.returnRequest.update({
    where: { id },
    data: {
      status: ReturnStatus.REJECTED,
      additionalNotes: `Cancelled by user on ${new Date().toISOString()}`,
      updatedAt: new Date(),
    },
  });

  return cancelledReturn;
};

export const returnService = {
  createReturnRequest,
  getAllFromDB,
  getById,
  getMyReturns,
  updateReturnStatus,
  cancelReturnRequest,
};
