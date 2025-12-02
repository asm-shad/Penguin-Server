import { UserRole } from "@prisma/client";

// Remove the null union type - auth middleware ensures user is not null
export type IAuthUser = {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
};

// If you need nullable user for some endpoints, create a separate type
export type INullableAuthUser = IAuthUser | null;
