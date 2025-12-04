import { UserRole } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { productController } from "./product.controller";
import { productValidation } from "./product.validation";
import { fileUploader } from "../../helper/fileUploader";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

// Helper function to parse request data (for form-data with files)
const parseProductData = (validationSchema: any) => {
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
router.get("/", productController.getAllFromDB);
router.get("/featured", productController.getFeaturedProducts);
router.get("/status/:status", productController.getProductsByStatus);
router.get("/category/:slug", productController.getProductsByCategorySlug);
router.get("/slug/:slug", productController.getBySlug);
router.get("/:id", productController.getById);

// Protected routes (Admin/Product Manager)
router.post(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  fileUploader.upload.array("files", 10), // Allow up to 10 images
  parseProductData(productValidation.createProductValidationSchema),
  productController.createProduct
);

router.patch(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  fileUploader.upload.array("files", 10),
  parseProductData(productValidation.updateProductValidationSchema),
  productController.updateProduct
);

router.patch(
  "/:id/status",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  validateRequest(productValidation.updateProductStatusSchema),
  productController.updateProductStatus
);

router.patch(
  "/:id/featured",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  validateRequest(productValidation.updateProductFeaturedSchema),
  productController.updateProductFeatured
);

router.patch(
  "/:id/active",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  validateRequest(productValidation.updateProductActiveSchema),
  productController.updateProductActive
);

router.patch(
  "/:id/stock",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  validateRequest(productValidation.updateStockSchema),
  productController.updateStock
);

router.delete(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  productController.deleteProduct
);

export const productRoutes = router;
