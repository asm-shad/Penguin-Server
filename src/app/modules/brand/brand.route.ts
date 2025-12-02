import { UserRole } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { brandController } from "./brand.controller";
import { brandValidation } from "./brand.validation";
import { fileUploader } from "../../helper/fileUploader";

const router = express.Router();

// Helper function to parse request data
const parseBrandData = (validationSchema: any) => {
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
router.get("/", brandController.getAllFromDB);
router.get("/popular", brandController.getPopularBrands);
router.get("/dropdown", brandController.getAllBrandsForDropdown);
router.get("/slug/:slug", brandController.getBySlug);
router.get("/:id", brandController.getById);

// Protected routes (Admin/Product Manager)
router.post(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  fileUploader.upload.single("file"),
  parseBrandData(brandValidation.createBrandValidationSchema),
  brandController.createBrand
);

router.patch(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  fileUploader.upload.single("file"),
  parseBrandData(brandValidation.updateBrandValidationSchema),
  brandController.updateBrand
);

router.delete(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  brandController.deleteBrand
);

export const brandRoutes = router;
