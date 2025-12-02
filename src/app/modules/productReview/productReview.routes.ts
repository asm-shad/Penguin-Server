import { UserRole } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { productReviewController } from "./productReview.controller";
import { productReviewValidation } from "./productReview.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

// Helper function to parse request data
const parseReviewData = (validationSchema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.data) {
        req.body = validationSchema.parse(JSON.parse(req.body.data));
      } else {
        req.body = validationSchema.parse(req.body);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

// ========== PUBLIC ROUTES ==========
router.get("/", productReviewController.getAllReviews);
router.get("/recent", productReviewController.getRecentReviews);
router.get("/:id", productReviewController.getReviewById);
router.get("/product/:productId", productReviewController.getProductReviews);
router.get(
  "/product/:productId/statistics",
  productReviewController.getReviewStatistics
);

// ========== PROTECTED USER ROUTES ==========
router.post(
  "/",
  auth(UserRole.USER),
  parseReviewData(productReviewValidation.createReviewSchema),
  productReviewController.createReview
);

router.get(
  "/my-reviews",
  auth(UserRole.USER),
  productReviewController.getMyReviews
);

router.patch(
  "/:id",
  auth(UserRole.USER),
  parseReviewData(productReviewValidation.updateReviewSchema),
  productReviewController.updateReview
);

router.delete(
  "/:id",
  auth(UserRole.USER),
  productReviewController.deleteReview
);

// ========== PROTECTED ADMIN ROUTES ==========
router.get(
  "/pending",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  productReviewController.getPendingReviews
);

router.patch(
  "/:id/approval",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  validateRequest(productReviewValidation.toggleApprovalSchema),
  productReviewController.toggleReviewApproval
);

router.post(
  "/bulk-approve",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  validateRequest(productReviewValidation.bulkApproveSchema),
  productReviewController.bulkApproveReviews
);

export const productReviewRoutes = router;
