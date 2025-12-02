import { UserRole } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { couponController } from "./coupon.controller";
import { couponValidation } from "./coupon.validation";

const router = express.Router();

// Helper function to parse request data
const parseCouponData = (validationSchema: any) => {
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

// Public route to validate coupon
router.post("/validate", couponController.validateCoupon);

// Protected admin routes
router.post(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  parseCouponData(couponValidation.createCouponSchema),
  couponController.createCoupon
);

router.get(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  couponController.getAllFromDB
);

router.get(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  couponController.getById
);

router.patch(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  parseCouponData(couponValidation.updateCouponSchema),
  couponController.updateCoupon
);

router.delete(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  couponController.deleteCoupon
);

router.patch(
  "/:id/status",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  validateRequest(couponValidation.updateStatusSchema),
  couponController.toggleCouponStatus
);

export const couponRoutes = router;
