import { Request, Response } from "express";
import { shippingService } from "./shipping.service";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";
import sendResponse from "../../shared/sendResponse";
import catchAsync from "../../shared/catchAsync";

const addShipping = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { orderId } = req.params;
    const user = req.user;
    const result = await shippingService.addShipping(orderId, req.body, user);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Shipping information added successfully!",
      data: result,
    });
  }
);

const updateShipping = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { orderId } = req.params;
    const user = req.user;
    const result = await shippingService.updateShipping(
      orderId,
      req.body,
      user
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Shipping information updated successfully!",
      data: result,
    });
  }
);

const trackShipping = catchAsync(async (req: Request, res: Response) => {
  const { trackingNumber } = req.params;
  const result = await shippingService.trackShipping(trackingNumber);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shipping tracking information retrieved successfully!",
    data: result,
  });
});

export const shippingController = {
  addShipping,
  updateShipping,
  trackShipping,
};
