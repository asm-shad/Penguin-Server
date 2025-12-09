// user.controller.ts
import { Request, Response } from "express";
import { userService } from "./user.service";
import httpStatus from "http-status";
import { userFilterableFields } from "./user.constant";
import { IAuthUser } from "../../interfaces/common";
import sendResponse from "../../shared/sendResponse";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createAdmin(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin Created successfully!",
    data: result,
  });
});

const createProductManager = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createProductManager(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product Manager Created successfully!",
    data: result,
  });
});

const createCustomerSupport = catchAsync(
  async (req: Request, res: Response) => {
    const result = await userService.createCustomerSupport(req);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Customer Support Created successfully!",
      data: result,
    });
  }
);

const createRegularUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createRegularUser(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User Registered successfully!",
    data: result,
  });
});

const updateUserProfile = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { id } = req.params;
    const result = await userService.updateUserProfile(id, req);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User profile updated!",
      data: result,
    });
  }
);

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await userService.getAllFromDB(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users data fetched!",
    meta: result.meta,
    data: result.data,
  });
});

const changeProfileStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await userService.changeProfileStatus(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile status changed!",
    data: result,
  });
});

const getMyProfile = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const result = await userService.getMyProfile(user as IAuthUser);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My profile data fetched!",
      data: result,
    });
  }
);

const updateMyProfie = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const result = await userService.updateMyProfie(user as IAuthUser, req);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My profile updated!",
      data: result,
    });
  }
);

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await userService.deleteUser(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User deleted successfully!",
    data: result,
  });
});

export const userController = {
  createAdmin,
  createProductManager,
  createCustomerSupport,
  createRegularUser,
  getAllFromDB,
  changeProfileStatus,
  getMyProfile,
  updateMyProfie,
  updateUserProfile,
  deleteUser,
};
