import { UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../../config";
import emailSender from "./emailSender";
import prisma from "../../shared/prisma";
import { jwtHelper } from "../../helper/jwtHelper";
import ApiError from "../../errors/ApiErrors";

const loginUser = async (payload: { email: string; password: string }) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
      userStatus: UserStatus.ACTIVE,
      isDeleted: false,
    },
  });

  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new Error("Password incorrect!");
  }

  const accessToken = jwtHelper.generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelper.generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
    needPasswordReset: userData.needPasswordReset,
  };
};

const refreshToken = async (token: string) => {
  let decodedData;
  try {
    decodedData = jwtHelper.verifyToken(
      token,
      config.jwt.refresh_token_secret as Secret
    );
  } catch (err) {
    throw new Error("You are not authorized!");
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: decodedData.email,
      userStatus: UserStatus.ACTIVE,
      isDeleted: false,
    },
  });

  const accessToken = jwtHelper.generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelper.generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
    needPasswordReset: userData.needPasswordReset,
  };
};

const changePassword = async (
  user: any,
  payload: { oldPassword: string; newPassword: string }
) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: user.email,
      userStatus: UserStatus.ACTIVE,
      isDeleted: false,
    },
  });

  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.oldPassword,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new Error("Password incorrect!");
  }

  const hashedPassword: string = await bcrypt.hash(
    payload.newPassword,
    Number(config.salt_round)
  );

  await prisma.user.update({
    where: {
      email: userData.email,
    },
    data: {
      password: hashedPassword,
      needPasswordReset: false,
    },
  });

  return {
    message: "Password changed successfully!",
  };
};

const forgotPassword = async (payload: { email: string }) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
      userStatus: UserStatus.ACTIVE,
      isDeleted: false,
    },
  });

  const resetPassToken = jwtHelper.generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.reset_pass_secret as Secret,
    config.jwt.reset_pass_token_expires_in as string
  );

  const resetPassLink = `${config.reset_pass_link}?userId=${userData.id}&token=${resetPassToken}`;

  await emailSender(
    userData.email,
    `
        <div>
            <p>Dear User,</p>
            <p>Your password reset link:</p>
            <a href="${resetPassLink}">
                <button style="padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Reset Password
                </button>
            </a>
            <p>This link will expire in 1 hour.</p>
        </div>
        `
  );
};

const resetPassword = async (
  token: string,
  payload: { id: string; password: string }
) => {
  // Verify token
  const isValidToken = jwtHelper.verifyToken(
    token,
    config.jwt.reset_pass_secret as Secret
  );

  if (!isValidToken) {
    throw new ApiError(httpStatus.FORBIDDEN, "Invalid or expired token!");
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      id: payload.id,
      userStatus: UserStatus.ACTIVE,
      isDeleted: false,
    },
  });

  // Hash new password
  const password = await bcrypt.hash(
    payload.password,
    Number(config.salt_round)
  );

  // Update password in database
  await prisma.user.update({
    where: {
      id: payload.id,
    },
    data: {
      password,
      needPasswordReset: false,
    },
  });
};

const getMe = async (user: any) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: user.email,
      userStatus: UserStatus.ACTIVE,
      isDeleted: false,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      gender: true,
      phone: true,
      profileImageUrl: true,
      userStatus: true,
      needPasswordReset: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
      userAddresses: {
        select: {
          id: true,
          addressName: true,
          isDefault: true,
          address: true,
          createdAt: true,
          updatedAt: true,
        }
      },
      // ADD ORDERS HERE (as you initially wanted)
      orders: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerEmail: true,
          orderDate: true,
          subtotal: true,
          discountAmount: true,
          totalPrice: true,
          status: true,
          shippingName: true,
          shippingAddress: true,
          shippingCity: true,
          shippingState: true,
          shippingZipCode: true,
          createdAt: true,
          updatedAt: true,
          // Include related data
          orderItems: {
            select: {
              id: true,
              productName: true,
              productId: true,
              variantInfo: true,
              quantity: true,
              unitPrice: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  productImages: {
                    select: {
                      id: true,
                      imageUrl: true,
                      isPrimary: true,
                    }
                  }
                }
              }
            }
          },
          payments: {
            select: {
              id: true,
              paymentMethod: true,
              paymentStatus: true,
              amount: true,
              paidAt: true,
            }
          },
          shipping: {
            select: {
              id: true,
              shippingMethod: true,
              shippingCost: true,
            }
          },
          orderTrackings: {
            select: {
              id: true,
              status: true,
              notes: true,
              createdAt: true,
            }
          },
          invoice: {
            select: {
              id: true,
              hostedInvoiceUrl: true,
              invoiceNumber: true,
            }
          }
        },
        orderBy: {
          orderDate: 'desc' // Order by most recent first
        }
      }
    },
  });

  return userData;
};

export const AuthServices = {
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
};
