import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { paymentController } from "./payment.controller";
import { paymentValidation } from "./payment.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

// Public route for webhooks/callbacks
router.patch(
  "/:paymentId/status",
  validateRequest(paymentValidation.updatePaymentStatusValidationSchema),
  paymentController.updatePaymentStatus
);

// Admin routes
router.post(
  "/order/:orderId",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER_SUPPORT),
  validateRequest(paymentValidation.createPaymentValidationSchema),
  paymentController.createPayment
);

router.patch(
  "/:paymentId/refund",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER_SUPPORT),
  validateRequest(paymentValidation.initiateRefundValidationSchema),
  paymentController.initiateRefund
);

export const paymentRoutes = router;
