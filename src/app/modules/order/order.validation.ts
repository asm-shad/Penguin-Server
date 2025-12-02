import { OrderStatus } from "@prisma/client";
import { z } from "zod";

const orderStatusEnum = Object.values(OrderStatus) as [string, ...string[]];

const createOrderValidationSchema = z.object({
  shippingName: z.string().min(1, "Shipping name is required"),
  shippingAddress: z.string().min(1, "Shipping address is required"),
  shippingCity: z.string().min(1, "Shipping city is required"),
  shippingState: z.string().min(1, "Shipping state is required"),
  shippingZipCode: z.string().min(1, "Shipping zip code is required"),
  couponCode: z.string().optional(),
  orderItems: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        variantId: z.string().optional(),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "At least one order item is required"),
});

const updateOrderStatusValidationSchema = z.object({
  status: z.enum(orderStatusEnum),
  notes: z.string().optional(),
});

const orderFilterValidationSchema = z.object({
  searchTerm: z.string().optional(),
  status: z.enum(orderStatusEnum).optional(),
  paymentStatus: z.string().optional(),
  customerEmail: z.string().email().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
});

export const orderValidation = {
  createOrderValidationSchema,
  updateOrderStatusValidationSchema,
  orderFilterValidationSchema,
};
