import { Request, Response } from "express";
import { wishlistService } from "./wishlist.service";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";
import sendResponse from "../../shared/sendResponse";
import catchAsync from "../../shared/catchAsync";

const addToWishlist = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const result = await wishlistService.addToWishlist(req.body, user!);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Product added to wishlist successfully!",
      data: result,
    });
  }
);

const removeFromWishlist = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { productId } = req.params;
    const user = req.user;
    const result = await wishlistService.removeFromWishlist(productId, user!);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Product removed from wishlist successfully!",
      data: result,
    });
  }
);

const getMyWishlist = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const result = await wishlistService.getMyWishlist(user!);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Wishlist retrieved successfully!",
      data: result,
    });
  }
);

const getWishlistCount = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const result = await wishlistService.getWishlistCount(user!);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Wishlist count retrieved successfully!",
      data: result,
    });
  }
);

const checkInWishlist = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { productId } = req.params;
    const user = req.user;
    const result = await wishlistService.checkInWishlist(productId, user!);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Wishlist status checked successfully!",
      data: result,
    });
  }
);

const clearWishlist = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const result = await wishlistService.clearWishlist(user!);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Wishlist cleared successfully!",
      data: result,
    });
  }
);

export const wishlistController = {
  addToWishlist,
  removeFromWishlist,
  getMyWishlist,
  getWishlistCount,
  checkInWishlist,
  clearWishlist,
};
