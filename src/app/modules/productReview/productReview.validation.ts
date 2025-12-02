import { z } from "zod";

const createReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters")
    .max(1000, "Comment is too long"),
});

const updateReviewSchema = createReviewSchema.partial();

const toggleApprovalSchema = z.object({
  isApproved: z.boolean(),
});

const bulkApproveSchema = z.object({
  reviewIds: z.array(z.string()).min(1, "At least one review ID is required"),
  isApproved: z.boolean(),
});

const reviewFilterSchema = z.object({
  searchTerm: z.string().optional(),
  rating: z.string().optional(),
  productId: z.string().optional(),
  userId: z.string().optional(),
  isApproved: z.string().optional(),
  productName: z.string().optional(),
  userName: z.string().optional(),
});

export const productReviewValidation = {
  createReviewSchema,
  updateReviewSchema,
  toggleApprovalSchema,
  bulkApproveSchema,
  reviewFilterSchema,
};
