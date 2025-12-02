import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { returnController } from "./return.controller";
import { returnValidation } from "./return.validation";

const router = express.Router();

// User routes
router.post(
  "/",
  auth(UserRole.USER),
  validateRequest(returnValidation.createReturnRequest),
  returnController.createReturnRequest
);

router.get("/my-returns", auth(UserRole.USER), returnController.getMyReturns);

router.get(
  "/:id",
  auth(UserRole.USER, UserRole.ADMIN, UserRole.CUSTOMER_SUPPORT),
  returnController.getById
);

router.patch(
  "/:id/cancel",
  auth(UserRole.USER),
  returnController.cancelReturnRequest
);

// Admin/Staff routes
router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.CUSTOMER_SUPPORT),
  returnController.getAllFromDB
);

router.patch(
  "/:id/status",
  auth(UserRole.ADMIN, UserRole.CUSTOMER_SUPPORT),
  validateRequest(returnValidation.updateReturnStatus),
  returnController.updateReturnStatus
);

export const returnRoutes = router;
