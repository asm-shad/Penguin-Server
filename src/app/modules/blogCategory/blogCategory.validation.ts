import { z } from "zod";

const createBlogCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
});

const updateBlogCategorySchema = createBlogCategorySchema.partial();

const blogCategoryFilterSchema = z.object({
  searchTerm: z.string().optional(),
});

export const blogCategoryValidation = {
  createBlogCategorySchema,
  updateBlogCategorySchema,
  blogCategoryFilterSchema,
};
