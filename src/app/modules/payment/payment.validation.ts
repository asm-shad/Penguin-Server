import { PaymentMethod, PaymentGateway, PaymentStatus } from "@prisma/client";
import { z } from "zod";

// Convert Prisma enums to Zod enums
const paymentMethodEnum = Object.values(PaymentMethod) as [string, ...string[]];
const paymentGatewayEnum = Object.values(PaymentGateway) as [
  string,
  ...string[]
];
const paymentStatusEnum = Object.values(PaymentStatus) as [string, ...string[]];

const createPaymentValidationSchema = z.object({
  paymentMethod: z.enum(paymentMethodEnum),
  paymentGateway: z.enum(paymentGatewayEnum),
  amount: z.number().positive("Amount must be positive"),
  transactionId: z.string().optional(),
  gatewayResponse: z.any().optional(),
});

const initPaymentValidationSchema = z.object({
  gateway: z.enum(paymentGatewayEnum).optional().default("STRIPE"),
  successUrl: z.url("Valid URL required").optional(),
  cancelUrl: z.url("Valid URL required").optional(),
});

const updatePaymentStatusValidationSchema = z.object({
  paymentStatus: z.enum(paymentStatusEnum),
  transactionId: z.string().optional(),
  failureReason: z.string().optional(),
  gatewayResponse: z.any().optional(),
  refundedAmount: z.number().min(0).optional(),
});

const initiateRefundValidationSchema = z.object({
  refundAmount: z.number().positive("Refund amount must be positive"),
  reason: z.string().min(1, "Refund reason is required"),
});

export const paymentValidation = {
  createPaymentValidationSchema,
  initPaymentValidationSchema,
  updatePaymentStatusValidationSchema,
  initiateRefundValidationSchema,
};