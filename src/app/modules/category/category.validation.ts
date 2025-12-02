import { z } from "zod";

const createCategoryValidationSchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .min(2, "Category name must be at least 2 characters"),
  slug: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isFeatured: z.boolean().default(false),
});

const updateCategoryValidationSchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .min(2, "Category name must be at least 2 characters")
    .optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isFeatured: z.boolean().optional(),
});

const categoryFilterValidationSchema = z.object({
  searchTerm: z.string().optional(),
  isFeatured: z.boolean().optional(),
  hasProducts: z.boolean().optional(),
});

const updateCategoryFeaturedSchema = z.object({
  isFeatured: z.boolean(),
});

export const categoryValidation = {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
  categoryFilterValidationSchema,
  updateCategoryFeaturedSchema,
};
