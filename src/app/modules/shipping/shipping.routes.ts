import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { shippingController } from "./shipping.controller";
import { shippingValidation } from "./shipping.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

// Public route for tracking
router.get("/track/:trackingNumber", shippingController.trackShipping);

// Admin routes
router.post(
  "/order/:orderId",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  validateRequest(shippingValidation.createShippingValidationSchema),
  shippingController.addShipping
);

router.patch(
  "/order/:orderId",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  validateRequest(shippingValidation.updateShippingValidationSchema),
  shippingController.updateShipping
);

export const shippingRoutes = router;
