import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { MetaService } from "./meta.service";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";
import { UserRole } from "@prisma/client";

const fetchDashboardMetaData = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const result = await MetaService.fetchDashboardMetaData(user as IAuthUser);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Dashboard meta data retrieved successfully!",
      data: result,
    });
  }
);

// Optional: Analytics endpoint for custom date ranges
const getAnalytics = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const { startDate, endDate } = req.query;

    // Check permissions first
    const allowedRoles = [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.PRODUCT_MANAGER,
    ];

    // Type-safe permission check
    if (!user?.role || !allowedRoles.includes(user.role as any)) {
      // Return error response without using sendResponse
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: "You don't have permission to access analytics",
        data: null,
      });
    }

    // Validate dates or use default (last 30 days)
    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const result = await MetaService.getAnalyticsData(start, end);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Analytics data retrieved successfully!",
      data: result,
    });
  }
);

export const MetaController = {
  fetchDashboardMetaData,
  getAnalytics,
};
