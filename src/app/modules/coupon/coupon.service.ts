import { Prisma, DiscountType } from "@prisma/client";
import { IPaginationOptions } from "../../interfaces/pagination";
import prisma from "../../shared/prisma";
import { paginationHelper } from "../../helper/paginationHelper";
import { couponSearchAbleFields } from "./coupon.constant";

const createCoupon = async (couponData: any) => {
  // Check if coupon code already exists
  const existingCoupon = await prisma.coupon.findUnique({
    where: { code: couponData.code },
  });

  if (existingCoupon) {
    throw new Error("Coupon code already exists");
  }

  const result = await prisma.coupon.create({
    data: {
      ...couponData,
      discountType: couponData.discountType as DiscountType,
      validFrom: couponData.validFrom
        ? new Date(couponData.validFrom)
        : new Date(),
      validUntil: couponData.validUntil
        ? new Date(couponData.validUntil)
        : null,
    },
  });

  return result;
};

const getAllFromDB = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.CouponWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: couponSearchAbleFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Filter by active status
  if (filterData.isActive !== undefined) {
    andConditions.push({
      isActive: filterData.isActive === "true",
    });
  }

  // Filter by validity
  if (filterData.valid === "true") {
    const now = new Date();
    andConditions.push({
      isActive: true,
      validFrom: { lte: now },
      OR: [{ validUntil: null }, { validUntil: { gte: now } }],
    });
  }

  const whereConditions: Prisma.CouponWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.coupon.findMany({
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
  });

  const total = await prisma.coupon.count({
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

const getById = async (id: string) => {
  const result = await prisma.coupon.findUniqueOrThrow({
    where: { id },
    include: {
      orders: {
        select: {
          id: true,
          orderNumber: true,
          totalPrice: true,
          createdAt: true,
        },
        take: 10, // Get last 10 orders that used this coupon
      },
    },
  });

  return result;
};

const updateCoupon = async (id: string, updateData: any) => {
  // Check if coupon exists
  await prisma.coupon.findUniqueOrThrow({
    where: { id },
  });

  // If updating code, check for duplicates
  if (updateData.code) {
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        code: updateData.code,
        id: { not: id },
      },
    });

    if (existingCoupon) {
      throw new Error("Coupon code already exists");
    }
  }

  const result = await prisma.coupon.update({
    where: { id },
    data: {
      ...updateData,
      discountType: updateData.discountType as DiscountType,
      validFrom: updateData.validFrom
        ? new Date(updateData.validFrom)
        : undefined,
      validUntil: updateData.validUntil
        ? new Date(updateData.validUntil)
        : undefined,
    },
  });

  return result;
};

const deleteCoupon = async (id: string) => {
  // Check if coupon is used in any order
  const ordersWithCoupon = await prisma.order.count({
    where: { couponId: id },
  });

  if (ordersWithCoupon > 0) {
    throw new Error("Cannot delete coupon that has been used in orders");
  }

  const result = await prisma.coupon.delete({
    where: { id },
  });

  return result;
};

const toggleCouponStatus = async (id: string, statusData: any) => {
  await prisma.coupon.findUniqueOrThrow({
    where: { id },
  });

  const result = await prisma.coupon.update({
    where: { id },
    data: { isActive: statusData.isActive },
  });

  return result;
};

const validateCoupon = async (validationData: any) => {
  const { code, orderAmount } = validationData;

  const coupon = await prisma.coupon.findUnique({
    where: { code },
  });

  if (!coupon) {
    throw new Error("Invalid coupon code");
  }

  if (!coupon.isActive) {
    throw new Error("Coupon is not active");
  }

  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom) {
    throw new Error("Coupon is not yet valid");
  }

  if (coupon.validUntil && now > coupon.validUntil) {
    throw new Error("Coupon has expired");
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw new Error("Coupon usage limit reached");
  }

  if (orderAmount < coupon.minOrderAmount) {
    throw new Error(`Minimum order amount required: $${coupon.minOrderAmount}`);
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discountAmount = (orderAmount * coupon.discountValue) / 100;
  } else {
    discountAmount = coupon.discountValue;
  }

  return {
    isValid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      maxUses: coupon.maxUses,
      usedCount: coupon.usedCount,
      minOrderAmount: coupon.minOrderAmount,
    },
  };
};

export const couponService = {
  createCoupon,
  getAllFromDB,
  getById,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  validateCoupon,
};
