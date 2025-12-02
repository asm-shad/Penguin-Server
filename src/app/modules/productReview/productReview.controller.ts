import { Request, Response } from "express";
import { productReviewService } from "./productReview.service";
import httpStatus from "http-status";
import { productReviewFilterableFields } from "./productReview.constant";
import { IAuthUser } from "../../interfaces/common";
import sendResponse from "../../shared/sendResponse";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";

const createReview = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const result = await productReviewService.createReview(req.body, user!);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Review created successfully!",
      data: result,
    });
  }
);

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, productReviewFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await productReviewService.getAllReviews(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviews retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await productReviewService.getReviewById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review retrieved successfully!",
    data: result,
  });
});

const getProductReviews = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const filters = pick(req.query, ["rating", "isApproved", "searchTerm"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await productReviewService.getProductReviews(
    productId,
    filters,
    options
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product reviews retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getMyReviews = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const filters = pick(req.query, ["rating", "isApproved", "searchTerm"]);
    const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

    const result = await productReviewService.getMyReviews(
      user!,
      filters,
      options
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My reviews retrieved successfully!",
      meta: result.meta,
      data: result.data,
    });
  }
);

const updateReview = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const result = await productReviewService.updateReview(id, req.body, user!);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Review updated successfully!",
      data: result,
    });
  }
);

const deleteReview = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const result = await productReviewService.deleteReview(id, user!);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Review deleted successfully!",
      data: result,
    });
  }
);

const toggleReviewApproval = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await productReviewService.toggleReviewApproval(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review approval status updated successfully!",
    data: result,
  });
});

const getReviewStatistics = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const result = await productReviewService.getReviewStatistics(productId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review statistics retrieved successfully!",
    data: result,
  });
});

const getRecentReviews = catchAsync(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await productReviewService.getRecentReviews(limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Recent reviews retrieved successfully!",
    data: result,
  });
});

const getPendingReviews = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "rating"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await productReviewService.getPendingReviews(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Pending reviews retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const bulkApproveReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await productReviewService.bulkApproveReviews(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviews approved successfully!",
    data: result,
  });
});

export const productReviewController = {
  createReview,
  getAllReviews,
  getReviewById,
  getProductReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  toggleReviewApproval,
  getReviewStatistics,
  getRecentReviews,
  getPendingReviews,
  bulkApproveReviews,
};
