// user.validation.ts
import { Gender, UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";

// Create enum arrays from Prisma enums
const GenderEnum = z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]);
const UserRoleEnum = z.enum([
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PRODUCT_MANAGER,
  UserRole.CUSTOMER_SUPPORT,
  UserRole.USER,
]);
const UserStatusEnum = z.enum([
  UserStatus.ACTIVE,
  UserStatus.INACTIVE,
  UserStatus.DELETED,
]);

// Address validation schema (only for regular users)
const addressSchema = z.object({
  addressLine: z.string().min(1, "Address line is required!"),
  city: z.string().min(1, "City is required!"),
  state: z.string().min(1, "State is required!"),
  zipCode: z.string().min(1, "Zip code is required!"),
  country: z.string().optional().default("US"),
});

// User address validation schema (only for regular users)
const userAddressSchema = z.object({
  addressName: z.string().min(1, "Address name is required!"),
  email: z.string().email("Invalid email format").optional(),
  isDefault: z.boolean().default(false),
});

// Base schema for admin/staff creation (no address required)
const createStaffBaseSchema = z.object({
  email: z.string().min(1, "Email is required!").email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required!"),
  phone: z.string().optional(),
  gender: GenderEnum.optional(),
});

// Base schema for regular user creation (with address required)
const createRegularUserBaseSchema = z.object({
  email: z.string().min(1, "Email is required!").email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required!"),
  phone: z.string().optional(),
  gender: GenderEnum.optional(),
  address: addressSchema, // Required for regular users
  userAddress: userAddressSchema, // Required for regular users
});

// Specific schemas for different roles
const createAdmin = createStaffBaseSchema.extend({
  role: z.literal(UserRole.ADMIN).default(UserRole.ADMIN),
});

const createProductManager = createStaffBaseSchema.extend({
  role: z.literal(UserRole.PRODUCT_MANAGER).default(UserRole.PRODUCT_MANAGER),
});

const createCustomerSupport = createStaffBaseSchema.extend({
  role: z.literal(UserRole.CUSTOMER_SUPPORT).default(UserRole.CUSTOMER_SUPPORT),
});

const createRegularUser = createRegularUserBaseSchema.extend({
  role: z.literal(UserRole.USER).default(UserRole.USER),
});

const updateStatus = z.object({
  body: z.object({
    userStatus: UserStatusEnum,
  }),
});

// Update profile schema
const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required!"),
  phone: z.string().optional(),
  gender: GenderEnum.optional(),
  profileImageUrl: z.string().optional(),
});

export const userValidation = {
  createAdmin,
  createProductManager,
  createCustomerSupport,
  createRegularUser,
  updateStatus,
  updateProfileSchema,
  GenderEnum,
  UserRoleEnum,
  UserStatusEnum,
};

export const userSearchAbleFields: string[] = ["email", "name"];

export const userFilterableFields: string[] = [
  "email",
  "role",
  "userStatus",
  "searchTerm",
  "gender",
];
