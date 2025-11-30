import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { AuthController } from "./auth.controller";
import { authLimiter } from "../../middlewares/rateLimiter";

const router = express.Router();

// router.post("/login", authLimiter, AuthController.loginUser);
router.post("/login", AuthController.loginUser);

router.post("/refresh-token", AuthController.refreshToken);

router.post(
  "/change-password",
  auth(
    UserRole.ADMIN,
    UserRole.PRODUCT_MANAGER,
    UserRole.CUSTOMER_SUPPORT,
    UserRole.USER
  ),
  AuthController.changePassword
);

router.post("/forgot-password", AuthController.forgotPassword);

router.post("/reset-password", AuthController.resetPassword);

router.get(
  "/me",
  auth(
    UserRole.ADMIN,
    UserRole.PRODUCT_MANAGER,
    UserRole.CUSTOMER_SUPPORT,
    UserRole.USER
  ),
  AuthController.getMe
);

export const AuthRoutes = router;
