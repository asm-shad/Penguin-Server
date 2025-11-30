import { UserRole } from "@prisma/client";

export type IAuthUser = {
  id: string; // Add user ID for better reference
  email: string;
  role: UserRole;
  iat?: number; // JWT issued at
  exp?: number; // JWT expiration
} | null;
