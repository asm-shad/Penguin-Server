import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { paymentController } from "./payment.controller";
import { paymentValidation } from "./payment.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

// PUBLIC ROUTES (No authentication required)

// SSL IPN Listener (MUST be before body parser in app.ts)
router.get(
  "/ipn",
  paymentController.handleSSLIPN
);

// Payment initiation (public for customers)
router.post(
  "/:orderId/initiate",
  validateRequest(paymentValidation.initPaymentValidationSchema),
  paymentController.initPayment
);

router.post(
  "/:orderId/initiate-ssl",
  paymentController.initSSLPayment
);

// ADMIN ROUTES (Authentication required)

router.post(
  "/order/:orderId",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER_SUPPORT),
  validateRequest(paymentValidation.createPaymentValidationSchema),
  paymentController.createPayment
);

router.patch(
  "/:paymentId/status",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER_SUPPORT),
  validateRequest(paymentValidation.updatePaymentStatusValidationSchema),
  paymentController.updatePaymentStatus
);

router.patch(
  "/:paymentId/refund",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER_SUPPORT),
  validateRequest(paymentValidation.initiateRefundValidationSchema),
  paymentController.initiateRefund
);

export const paymentRoutes = router;