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

// Base schema for all user creation
const createUserBaseSchema = z.object({
  email: z.string().min(1, "Email is required!").email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required!"),
  lastName: z.string().min(1, "Last name is required!"),
  phone: z.string().optional(),
  gender: GenderEnum.optional(),
});

// Specific schemas for different roles
const createAdmin = createUserBaseSchema.extend({
  role: z.literal(UserRole.ADMIN).default(UserRole.ADMIN),
});

const createProductManager = createUserBaseSchema.extend({
  role: z.literal(UserRole.PRODUCT_MANAGER).default(UserRole.PRODUCT_MANAGER),
});

const createCustomerSupport = createUserBaseSchema.extend({
  role: z.literal(UserRole.CUSTOMER_SUPPORT).default(UserRole.CUSTOMER_SUPPORT),
});

const createRegularUser = createUserBaseSchema.extend({
  role: z.literal(UserRole.USER).default(UserRole.USER),
});

const updateStatus = z.object({
  body: z.object({
    userStatus: UserStatusEnum,
  }),
});

// Update profile schema
const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required!").optional(),
  lastName: z.string().min(1, "Last name is required!").optional(),
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

export const userSearchAbleFields: string[] = [
  "email",
  "firstName",
  "lastName",
];

export const userFilterableFields: string[] = [
  "email",
  "role",
  "userStatus",
  "searchTerm",
  "gender",
];
