import { z } from "zod";
import slugify from "slugify";

const createBlogPostSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().optional(), // Make slug optional
    excerpt: z.string().optional(),
    content: z.any(),
    featuredImageUrl: z
      .string()
      .url({ message: "Invalid image URL" })
      .optional(),
    isLatest: z.boolean().default(true),
    publishedAt: z.coerce.date().optional(),
    categoryIds: z.array(z.string()).optional(),
  })
  .transform((data) => {
    // Auto-generate slug from title if not provided
    if (!data.slug) {
      return {
        ...data,
        slug: slugify(data.title, {
          lower: true,
          strict: true,
          trim: true,
        }),
      };
    }
    return data;
  });

const updateBlogPostSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  excerpt: z.string().optional(),
  content: z.any().optional(),
  featuredImageUrl: z.string().url({ message: "Invalid image URL" }).optional(),
  isLatest: z.boolean().optional(),
  publishedAt: z.coerce.date().optional(),
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
