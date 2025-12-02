import { Request, Response } from "express";
import { returnService } from "./return.service";
import httpStatus from "http-status";
import { returnFilterableFields } from "./return.constant";
import { IAuthUser } from "../../interfaces/common";
import sendResponse from "../../shared/sendResponse";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";

// Create return request
const createReturnRequest = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const result = await returnService.createReturnRequest(
      user as IAuthUser,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Return request created successfully!",
      data: result,
    });
  }
);

// Get all return requests (admin/staff)
const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, returnFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await returnService.getAllFromDB(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Return requests fetched successfully!",
    meta: result.meta,
    data: result.data,
  });
});

// Get return request by ID
const getById = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const result = await returnService.getById(id, user as IAuthUser);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Return request fetched successfully!",
      data: result,
    });
  }
);

// Get my return requests
const getMyReturns = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const filters = pick(req.query, ["status", "searchTerm"]);
    const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

    const result = await returnService.getMyReturns(
      user as IAuthUser,
      filters,
      options
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My return requests fetched successfully!",
      meta: result.meta,
      data: result.data,
    });
  }
);

// Update return status (admin/staff)
const updateReturnStatus = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const result = await returnService.updateReturnStatus(
      id,
      req.body,
      user as IAuthUser
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Return status updated successfully!",
      data: result,
    });
  }
);

// Cancel return request (user)
const cancelReturnRequest = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const result = await returnService.cancelReturnRequest(
      id,
      user as IAuthUser
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Return request cancelled successfully!",
      data: result,
    });
  }
);

export const returnController = {
  createReturnRequest,
  getAllFromDB,
  getById,
  getMyReturns,
  updateReturnStatus,
  cancelReturnRequest,
};
