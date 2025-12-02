import { Request, Response } from "express";
import { orderService } from "./order.service";
import httpStatus from "http-status";
import { orderFilterableFields } from "./order.constant";
import { IAuthUser } from "../../interfaces/common";
import sendResponse from "../../shared/sendResponse";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";

const createOrder = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const result = await orderService.createOrder(req);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Order created successfully!",
      data: result,
    });
  }
);

const getAllFromDB = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const filters = pick(req.query, orderFilterableFields);
    const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
    const user = req.user;

    const result = await orderService.getAllFromDB(filters, options, user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Orders retrieved successfully!",
      meta: result.meta,
      data: result.data,
    });
  }
);

const getById = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const result = await orderService.getById(id, user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Order retrieved successfully!",
      data: result,
    });
  }
);

const getByOrderNumber = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { orderNumber } = req.params;
    const user = req.user;
    const result = await orderService.getByOrderNumber(orderNumber, user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Order retrieved successfully!",
      data: result,
    });
  }
);

const updateOrderStatus = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const result = await orderService.updateOrderStatus(id, req.body, user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Order status updated successfully!",
      data: result,
    });
  }
);

const getMyOrders = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const filters = pick(req.query, orderFilterableFields);
    const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
    const user = req.user;

    const result = await orderService.getMyOrders(
      user as IAuthUser,
      filters,
      options
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My orders retrieved successfully!",
      meta: result.meta,
      data: result.data,
    });
  }
);

const getOrderStatistics = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const result = await orderService.getOrderStatistics(user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Order statistics retrieved successfully!",
      data: result,
    });
  }
);

const cancelOrder = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const result = await orderService.cancelOrder(id, user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Order cancelled successfully!",
      data: result,
    });
  }
);

export const orderController = {
  createOrder,
  getAllFromDB,
  getById,
  getByOrderNumber,
  updateOrderStatus,
  getMyOrders,
  getOrderStatistics,
  cancelOrder,
};
