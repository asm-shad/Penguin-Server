import { Request, Response } from "express";
import httpStatus from "http-status";
import sendResponse from "../../shared/sendResponse";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";
import { couponFilterableFields } from "./coupon.constant";
import { couponService } from "./coupon.service";

const createCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.createCoupon(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Coupon created successfully!",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, couponFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await couponService.getAllFromDB(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupons retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await couponService.getById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupon retrieved successfully!",
    data: result,
  });
});

const updateCoupon = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await couponService.updateCoupon(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupon updated successfully!",
    data: result,
  });
});

const deleteCoupon = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await couponService.deleteCoupon(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupon deleted successfully!",
    data: result,
  });
});

const toggleCouponStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await couponService.toggleCouponStatus(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupon status updated successfully!",
    data: result,
  });
});

const validateCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.validateCoupon(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupon validated successfully!",
    data: result,
  });
});

export const couponController = {
  createCoupon,
  getAllFromDB,
  getById,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  validateCoupon,
};
