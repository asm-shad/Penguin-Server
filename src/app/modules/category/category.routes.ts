import { UserRole } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { categoryController } from "./category.controller";
import { categoryValidation } from "./category.validation";
import { fileUploader } from "../../helper/fileUploader";

const router = express.Router();

// Helper function to parse request data
const parseCategoryData = (validationSchema: any) => {
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

// Public routes
router.get("/", categoryController.getAllFromDB);
router.get("/featured", categoryController.getFeaturedCategories);
router.get("/slug/:slug", categoryController.getBySlug);
router.get("/:id", categoryController.getById);

// Protected routes (Admin/Product Manager)
router.post(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  fileUploader.upload.single("file"),
  parseCategoryData(categoryValidation.createCategoryValidationSchema),
  categoryController.createCategory
);

router.patch(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  fileUploader.upload.single("file"),
  parseCategoryData(categoryValidation.updateCategoryValidationSchema),
  categoryController.updateCategory
);

router.patch(
  "/:id/featured",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  parseCategoryData(categoryValidation.updateCategoryFeaturedSchema),
  categoryController.updateCategoryFeatured
);

router.delete(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  categoryController.deleteCategory
);

export const categoryRoutes = router;
