import { UserRole } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { wishlistController } from "./wishlist.controller";
import { wishlistValidation } from "./wishlist.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

// Helper function to parse request data
const parseWishlistData = (validationSchema: any) => {
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

// ========== PROTECTED USER ROUTES ==========
router.post(
  "/",
  auth(UserRole.USER),
  parseWishlistData(wishlistValidation.addToWishlistSchema),
  wishlistController.addToWishlist
);

router.get(
  "/my-wishlist",
  auth(UserRole.USER),
  wishlistController.getMyWishlist
);

router.get("/count", auth(UserRole.USER), wishlistController.getWishlistCount);

router.get(
  "/check/:productId",
  auth(UserRole.USER),
  wishlistController.checkInWishlist
);

router.delete(
  "/:productId",
  auth(UserRole.USER),
  wishlistController.removeFromWishlist
);

router.delete(
  "/clear/all",
  auth(UserRole.USER),
  wishlistController.clearWishlist
);

export const wishlistRoutes = router;
