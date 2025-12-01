import { z } from "zod";

const createBrandValidationSchema = z.object({
  name: z
    .string({
      required_error: "Brand name is required",
      invalid_type_error: "Brand name must be a string",
    })
    .min(2, "Brand name must be at least 2 characters"),
  slug: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
});

const updateBrandValidationSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
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
