import { DiscountType } from "@prisma/client";
import { z } from "zod";

const discountTypeEnum = Object.values(DiscountType) as [string, ...string[]];

const createCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  description: z.string().optional(),
  discountType: z.enum(discountTypeEnum),
  discountValue: z.number().positive("Discount value must be positive"),
  maxUses: z.number().int().positive().optional(),
  minOrderAmount: z.number().min(0).default(0),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

const updateCouponSchema = createCouponSchema.partial();

const updateStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean(),
  }),
});

const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  orderAmount: z.number().min(0, "Order amount must be positive"),
});

export const couponValidation = {
  createCouponSchema,
  updateCouponSchema,
  updateStatusSchema,
  validateCouponSchema,
};
