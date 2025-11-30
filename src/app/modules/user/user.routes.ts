// user.route.ts
import { UserRole } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { userController } from "./user.controller";
import { userValidation } from "./user.validation";
import { fileUploader } from "../../helper/fileUploader";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

router.get(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  userController.getAllFromDB
);

router.get(
  "/me",
  auth(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PRODUCT_MANAGER,
    UserRole.CUSTOMER_SUPPORT,
    UserRole.USER
  ),
  userController.getMyProfile
);

// Helper function to parse request data
const parseUserData = (validationSchema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Handle both form-data and JSON requests
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

router.post(
  "/create-admin",
  auth(UserRole.SUPER_ADMIN),
  fileUploader.upload.single("file"),
  parseUserData(userValidation.createAdmin),
  userController.createAdmin
);

router.post(
  "/create-product-manager",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  fileUploader.upload.single("file"),
  parseUserData(userValidation.createProductManager),
  userController.createProductManager
);

router.post(
  "/create-customer-support",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  fileUploader.upload.single("file"),
  parseUserData(userValidation.createCustomerSupport),
  userController.createCustomerSupport
);

router.post(
  "/create-user",
  fileUploader.upload.single("file"),
  parseUserData(userValidation.createRegularUser),
  userController.createRegularUser
);

router.patch(
  "/:id/status",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(userValidation.updateStatus),
  userController.changeProfileStatus
);

router.patch(
  "/update-my-profile",
  auth(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PRODUCT_MANAGER,
    UserRole.CUSTOMER_SUPPORT,
    UserRole.USER
  ),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse the data field if it exists (for form-data)
      if (req.body.data) {
        req.body = userValidation.updateProfileSchema.parse(
          JSON.parse(req.body.data)
        );
      } else {
        req.body = userValidation.updateProfileSchema.parse(req.body);
      }
      return userController.updateMyProfie(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

export const userRoutes = router;
