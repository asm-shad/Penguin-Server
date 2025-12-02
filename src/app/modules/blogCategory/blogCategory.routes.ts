import { UserRole } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { blogCategoryController } from "./blogCategory.controller";
import { blogCategoryValidation } from "./blogCategory.validation";

const router = express.Router();

// Helper function to parse request data
const parseBlogCategoryData = (validationSchema: any) => {
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
router.get("/", blogCategoryController.getAllBlogCategories);
router.get("/slug/:slug", blogCategoryController.getBlogCategoryBySlug);
router.get("/:id", blogCategoryController.getBlogCategoryById);

// ========== PROTECTED ADMIN ROUTES ==========
router.post(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  parseBlogCategoryData(blogCategoryValidation.createBlogCategorySchema),
  blogCategoryController.createBlogCategory
);

router.patch(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  parseBlogCategoryData(blogCategoryValidation.updateBlogCategorySchema),
  blogCategoryController.updateBlogCategory
);

router.delete(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  blogCategoryController.deleteBlogCategory
);

export const blogCategoryRoutes = router;
