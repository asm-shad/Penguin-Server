import express from "express";
import { MetaController } from "./meta.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

// Dashboard meta data for all authenticated users
router.get(
  "/dashboard",
  auth(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PRODUCT_MANAGER,
    UserRole.CUSTOMER_SUPPORT,
    UserRole.USER
  ),
  MetaController.fetchDashboardMetaData
);

// Advanced analytics (for admin roles only)
router.get(
  "/analytics",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  MetaController.getAnalytics
);

export const MetaRoutes = router;
