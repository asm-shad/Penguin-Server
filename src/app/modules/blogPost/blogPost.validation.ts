import { z } from "zod";

const createBlogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().optional(),
  content: z.any(), // JSON content
  featuredImageUrl: z.string().url().optional(),
  isLatest: z.boolean().default(true),
  publishedAt: z.string().datetime().optional(),
  categoryIds: z.array(z.string()).optional(), // Array of category IDs
});

const updateBlogPostSchema = createBlogPostSchema.partial().extend({
  categoryIds: z.array(z.string()).optional(),
});

const blogPostFilterSchema = z.object({
  searchTerm: z.string().optional(),
  userId: z.string().optional(),
  categoryId: z.string().optional(),
  isLatest: z.string().optional(),
  categorySlug: z.string().optional(),
});

export const blogPostValidation = {
  createBlogPostSchema,
  updateBlogPostSchema,
  blogPostFilterSchema,
};
