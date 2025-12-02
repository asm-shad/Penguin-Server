import { z } from "zod";

const createBrandValidationSchema = z.object({
  name: z
    .string()
    .min(1, "Brand name is required")
    .min(2, "Brand name must be at least 2 characters"),
  slug: z.string().optional(),
  description: z.string().optional(),
});

const updateBrandValidationSchema = z.object({
  name: z
    .string()
    .min(1, "Brand name is required")
    .min(2, "Brand name must be at least 2 characters")
    .optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

const brandFilterValidationSchema = z.object({
  searchTerm: z.string().optional(),
  hasProducts: z.boolean().optional(),
});

export const brandValidation = {
  createBrandValidationSchema,
  updateBrandValidationSchema,
  brandFilterValidationSchema,
};
