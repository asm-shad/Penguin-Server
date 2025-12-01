import { Prisma, UserRole, UserStatus, Gender } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { Request } from "express";
import config from "../../../config";
import { IAuthUser } from "../../interfaces/common";
import { IPaginationOptions } from "../../interfaces/pagination";
import { userSearchAbleFields } from "./user.constant";
import { fileUploader } from "../../helper/fileUploader";
import prisma from "../../shared/prisma";
import { paginationHelper } from "../../helper/paginationHelper";

// user.service.ts
const createUser = async (
  req: Request,
  role: UserRole,
  needPasswordReset: boolean = false
) => {
  const file = req.file;
  let profileImageUrl: string | undefined;

  // Handle file upload
  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    profileImageUrl = uploadToCloudinary?.secure_url;
  }

  const { email, password, name, phone, gender } = req.body;

  const hashedPassword: string = await bcrypt.hash(
    password,
    Number(config.salt_round)
  );

  const result = await prisma.$transaction(async (transactionClient) => {
    const createdUser = await transactionClient.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        gender: gender as Gender,
        profileImageUrl,
        role,
        needPasswordReset,
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
      },
    });

    return createdUser;
  });

  return result;
};

// Staff creation functions (no address required)
const createAdmin = async (req: Request) => {
  return createUser(req, UserRole.ADMIN, true);
};

const createProductManager = async (req: Request) => {
  return createUser(req, UserRole.PRODUCT_MANAGER, true);
};

const createCustomerSupport = async (req: Request) => {
  return createUser(req, UserRole.CUSTOMER_SUPPORT, true);
};

// Regular user creation with address
const createRegularUser = async (req: Request) => {
  const file = req.file;
  let profileImageUrl: string | undefined;

  // Handle file upload
  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    profileImageUrl = uploadToCloudinary?.secure_url;
  }

  const { email, password, name, phone, gender, address, userAddress } =
    req.body;

  const hashedPassword: string = await bcrypt.hash(
    password,
    Number(config.salt_round)
  );

  const result = await prisma.$transaction(async (transactionClient) => {
    // Step 1: Create the user
    const createdUser = await transactionClient.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        gender: gender as Gender,
        profileImageUrl,
        role: UserRole.USER,
        needPasswordReset: false,
        userStatus: UserStatus.ACTIVE,
        isDeleted: false,
      },
    });

    // Step 2: Create the address
    const createdAddress = await transactionClient.address.create({
      data: {
        addressLine: address.addressLine,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country || "US",
      },
    });

    // Step 3: Create the user-address relationship
    await transactionClient.userAddress.create({
      data: {
        addressName: userAddress.addressName,
        email: userAddress.email || email,
        isDefault: userAddress.isDefault || true, // First address is default
        userId: createdUser.id,
        addressId: createdAddress.id,
      },
    });

    // Step 4: Return user with address information
    const userWithAddress = await transactionClient.user.findUnique({
      where: { id: createdUser.id },
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
          include: {
            address: true,
          },
        },
      },
    });

    return userWithAddress;
  });

  return result;
};

// Keep the other functions as they are (they're already good)
const getAllFromDB = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.UserWhereInput[] = [];

  if (params.searchTerm) {
    andConditions.push({
      OR: userSearchAbleFields.map((field) => ({
        [field]: {
          contains: params.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
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
    },
  });

  const total = await prisma.user.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const changeProfileStatus = async (
  id: string,
  status: { userStatus: UserStatus }
) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: { id },
  });

  const updateUserStatus = await prisma.user.update({
    where: { id },
    data: { userStatus: status.userStatus },
  });

  return updateUserStatus;
};

const getMyProfile = async (user: IAuthUser) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      email: user?.email,
      userStatus: UserStatus.ACTIVE,
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
    },
  });

  return userInfo;
};

const updateMyProfie = async (user: IAuthUser, req: Request) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      email: user?.email,
      userStatus: UserStatus.ACTIVE,
    },
  });

  const file = req.file;
  let updateData = { ...req.body };

  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    updateData.profileImageUrl = uploadToCloudinary?.secure_url;
  }

  const updatedProfile = await prisma.user.update({
    where: {
      email: userInfo.email,
    },
    data: updateData,
  });

  return updatedProfile;
};

export const userService = {
  createAdmin,
  createProductManager,
  createCustomerSupport,
  createRegularUser,
  getAllFromDB,
  changeProfileStatus,
  getMyProfile,
  updateMyProfie,
};
