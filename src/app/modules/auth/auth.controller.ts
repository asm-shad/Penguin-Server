import { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../../config";
import { AuthServices } from "./auth.service";
import catchAsync from "../../shared/catchAsync";
import { convertToMilliseconds } from "../../helper/timeConverter";
import sendResponse from "../../shared/sendResponse";

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginUser(req.body);
  const { refreshToken, accessToken, needPasswordReset } = result;

  const accessTokenMaxAge = convertToMilliseconds(
    config.jwt.expires_in as string,
    60 * 60 * 1000
  );
  const refreshTokenMaxAge = convertToMilliseconds(
    config.jwt.refresh_token_expires_in as string,
    30 * 24 * 60 * 60 * 1000
  );

  res.cookie("accessToken", accessToken, {
    secure: config.node_env === "production",
    httpOnly: true,
    sameSite: config.node_env === "production" ? "none" : "lax",
    maxAge: accessTokenMaxAge,
  });

  res.cookie("refreshToken", refreshToken, {
    secure: config.node_env === "production",
    httpOnly: true,
    sameSite: config.node_env === "production" ? "none" : "lax",
    maxAge: refreshTokenMaxAge,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully!",
    data: {
      needPasswordReset,
    },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  const accessTokenMaxAge = convertToMilliseconds(
    config.jwt.expires_in as string,
    60 * 60 * 1000
  );
  const refreshTokenMaxAge = convertToMilliseconds(
    config.jwt.refresh_token_expires_in as string,
    30 * 24 * 60 * 60 * 1000
  );

  const result = await AuthServices.refreshToken(refreshToken);

  res.cookie("accessToken", result.accessToken, {
    secure: config.node_env === "production",
    httpOnly: true,
    sameSite: config.node_env === "production" ? "none" : "lax",
    maxAge: accessTokenMaxAge,
  });

  res.cookie("refreshToken", result.refreshToken, {
    secure: config.node_env === "production",
    httpOnly: true,
    sameSite: config.node_env === "production" ? "none" : "lax",
    maxAge: refreshTokenMaxAge,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Access token generated successfully!",
    data: {
      needPasswordReset: result.needPasswordReset,
    },
  });
});

const changePassword = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const user = req.user;

    const result = await AuthServices.changePassword(user, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Password changed successfully!",
      data: result,
    });
  }
);

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthServices.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Check your email for password reset instructions!",
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization || "";

  await AuthServices.resetPassword(token, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully!",
    data: null,
  });
});

const getMe = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const user = req.user;

    const result = await AuthServices.getMe(user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User retrieved successfully!",
      data: result,
    });
  }
);

export const AuthController = {
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
};
