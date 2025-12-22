import { UserRole } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { orderController } from "./order.controller";
import { orderValidation } from "./order.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

// Helper function to parse request data
const parseOrderData = (validationSchema: any) => {
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

// Protected routes for all authenticated users
router.post(
  "/",
  auth(UserRole.USER),
  validateRequest(orderValidation.createOrderValidationSchema),
  orderController.createOrder
);

router.get("/my-orders", auth(UserRole.USER), orderController.getMyOrders);

router.get(
  "/my-orders/statistics",
  auth(UserRole.USER),
  orderController.getOrderStatistics
);

router.get("/my-orders/:id", auth(UserRole.USER), orderController.getById);

router.get(
  "/my-orders/number/:orderNumber",
  auth(UserRole.USER),
  orderController.getByOrderNumber
);

router.patch(
  "/my-orders/:id/cancel",
  auth(UserRole.USER),
  orderController.cancelOrder
);

// Protected routes for admin/staff
router.get(
  "/",
  auth(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PRODUCT_MANAGER,
    UserRole.CUSTOMER_SUPPORT
  ),
  orderController.getAllFromDB
);

router.get(
  "/statistics",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  orderController.getOrderStatistics
);

router.get(
  "/:id",
  auth(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PRODUCT_MANAGER,
    UserRole.CUSTOMER_SUPPORT
  ),
  orderController.getById
);

router.patch(
  "/:id/status",
  auth(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PRODUCT_MANAGER,
    UserRole.CUSTOMER_SUPPORT
  ),
  validateRequest(orderValidation.updateOrderStatusValidationSchema),
  orderController.updateOrderStatus
);

export const orderRoutes = router;
