import { Request, Response } from "express";
import { paymentService } from "./payment.service";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";
import sendResponse from "../../shared/sendResponse";
import catchAsync from "../../shared/catchAsync";

const createPayment = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { orderId } = req.params;
    const user = req.user;
    const result = await paymentService.createPayment(
      orderId,
      req.body,
      user as IAuthUser
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Payment created successfully!",
      data: result,
    });
  }
);

const updatePaymentStatus = catchAsync(async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const result = await paymentService.updatePaymentStatus(paymentId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment status updated successfully!",
    data: result,
  });
});

const initiateRefund = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { paymentId } = req.params;
    const user = req.user;
    const result = await paymentService.initiateRefund(
      paymentId,
      req.body,
      user as IAuthUser
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Refund initiated successfully!",
      data: result,
    });
  }
);

export const paymentController = {
  createPayment,
  updatePaymentStatus,
  initiateRefund,
};
