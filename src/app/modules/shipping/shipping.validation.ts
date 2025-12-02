import { ShippingCarrier, ShippingMethod } from "@prisma/client";
import { z } from "zod";

// Convert Prisma enums to Zod enums
const shippingCarrierEnum = Object.values(ShippingCarrier) as [
  string,
  ...string[]
];
const shippingMethodEnum = Object.values(ShippingMethod) as [
  string,
  ...string[]
];

const createShippingValidationSchema = z.object({
  carrier: z.enum(shippingCarrierEnum),
  trackingNumber: z.string().optional(),
  shippingMethod: z.enum(shippingMethodEnum),
  shippingCost: z.number().min(0, "Shipping cost cannot be negative"),
  estimatedDays: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

const updateShippingValidationSchema = z.object({
  carrier: z.enum(shippingCarrierEnum).optional(),
  trackingNumber: z.string().optional(),
  shippingMethod: z.enum(shippingMethodEnum).optional(),
  shippingCost: z
    .number()
    .min(0, "Shipping cost cannot be negative")
    .optional(),
  estimatedDays: z.number().int().positive().optional(),
  shippedAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const shippingValidation = {
  createShippingValidationSchema,
  updateShippingValidationSchema,
};
