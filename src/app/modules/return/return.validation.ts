import { ReturnReason, ReturnStatus, ItemCondition } from "@prisma/client";
import { z } from "zod";

// Create enum arrays from Prisma enums
const ReturnReasonEnum = z.enum([
  ReturnReason.DEFECTIVE,
  ReturnReason.WRONG_ITEM,
  ReturnReason.SIZE_ISSUE,
  ReturnReason.QUALITY_ISSUE,
  ReturnReason.NOT_AS_DESCRIBED,
  ReturnReason.CHANGE_OF_MIND,
  ReturnReason.OTHER,
]);

const ReturnStatusEnum = z.enum([
  ReturnStatus.REQUESTED,
  ReturnStatus.APPROVED,
  ReturnStatus.REJECTED,
  ReturnStatus.PICKUP_SCHEDULED,
  ReturnStatus.PICKUP_COMPLETED,
  ReturnStatus.REFUND_PROCESSED,
  ReturnStatus.COMPLETED,
]);

const ItemConditionEnum = z.enum([
  ItemCondition.UNOPENED,
  ItemCondition.LIKE_NEW,
  ItemCondition.USED,
  ItemCondition.DAMAGED,
  ItemCondition.DEFECTIVE,
]);

// Return item validation schema
const returnItemSchema = z.object({
  orderItemId: z.string().uuid("Invalid order item ID"),
  quantity: z.number().int().positive("Quantity must be positive"),
  returnReason: z.string().optional(),
  condition: ItemConditionEnum,
});

// Create return request schema
const createReturnRequest = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  returnReason: ReturnReasonEnum,
  additionalNotes: z.string().optional(),
  returnItems: z
    .array(returnItemSchema)
    .min(1, "At least one item is required"),
});

// Update return status schema
const updateReturnStatus = z.object({
  body: z.object({
    status: ReturnStatusEnum,
    refundAmount: z
      .number()
      .positive("Refund amount must be positive")
      .optional(),
    additionalNotes: z.string().optional(),
  }),
});

// Approve return request schema
const approveReturnRequest = z.object({
  refundAmount: z.number().positive("Refund amount must be positive"),
  pickupDate: z.date().optional(),
  notes: z.string().optional(),
});

// Process refund schema
const processRefundSchema = z.object({
  refundAmount: z.number().positive("Refund amount must be positive"),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

export const returnValidation = {
  createReturnRequest,
  updateReturnStatus,
  approveReturnRequest,
  processRefundSchema,
  ReturnReasonEnum,
  ReturnStatusEnum,
  ItemConditionEnum,
};
