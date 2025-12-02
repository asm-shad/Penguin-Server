import { UserRole } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { blogPostController } from "./blogPost.controller";
import { blogPostValidation } from "./blogPost.validation";

const router = express.Router();

// Helper function to parse request data
const parseBlogPostData = (validationSchema: any) => {
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

// ========== PUBLIC ROUTES (No Authentication Required) ==========
router.get("/", blogPostController.getAllBlogPosts);
router.get("/latest", blogPostController.getLatestBlogPosts);
router.get("/slug/:slug", blogPostController.getBlogPostBySlug);
router.get("/:id", blogPostController.getBlogPostById);

// ========== PROTECTED USER ROUTES ==========
router.get(
  "/my-posts",
  auth(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PRODUCT_MANAGER,
    UserRole.CUSTOMER_SUPPORT,
    UserRole.USER
  ),
  blogPostController.getMyBlogPosts
);

// ========== PROTECTED ADMIN ROUTES ==========
router.post(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  parseBlogPostData(blogPostValidation.createBlogPostSchema),
  blogPostController.createBlogPost
);

router.patch(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCT_MANAGER),
  parseBlogPostData(blogPostValidation.updateBlogPostSchema),
  blogPostController.updateBlogPost
);

router.delete(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  blogPostController.deleteBlogPost
);

export const blogPostRoutes = router;
