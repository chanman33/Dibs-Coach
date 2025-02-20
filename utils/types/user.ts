import { z } from "zod";

// System Role Enum
export enum UserRole {
  SYSTEM_OWNER = "SYSTEM_OWNER",
  SYSTEM_MODERATOR = "SYSTEM_MODERATOR",
  USER = "USER"
}

// User Capabilities Enum
export enum UserCapability {
  COACH = "COACH",
  MENTEE = "MENTEE"
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED"
}

export const userSchema = z.object({
  ulid: z.string().length(26),
  userId: z.string().describe("Clerk user ID"),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  displayName: z.string().nullable(),
  bio: z.string().nullable(),
  systemRole: z.nativeEnum(UserRole).default(UserRole.USER),
  capabilities: z.array(z.nativeEnum(UserCapability)),
  isCoach: z.boolean().default(false),
  isMentee: z.boolean().default(false),
  status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
  profileImageUrl: z.string().nullable(),
  stripeCustomerId: z.string().nullable(),
  stripeConnectAccountId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const userCreateSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  firstName: z.string()
    .min(1, { message: "First name is required" })
    .regex(/^[a-zA-Z]+$/, { message: "First name must only contain letters" }),
  lastName: z.string()
    .min(1, { message: "Last name is required" })
    .regex(/^[a-zA-Z]+$/, { message: "Last name must only contain letters" }),
  userId: z.string().describe("Clerk user ID"),
  systemRole: z.nativeEnum(UserRole).default(UserRole.USER),
  capabilities: z.array(z.nativeEnum(UserCapability)).default([]),
  profileImageUrl: z.string().url().nullable(),
  phoneNumber: z.string().nullable(),
  displayName: z.string().nullable(),
  bio: z.string().nullable(),
});

export const userUpdateSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().regex(/^[a-zA-Z]+$/).optional(),
  lastName: z.string().regex(/^[a-zA-Z]+$/).optional(),
  profileImageUrl: z.string().url().optional(),
  phoneNumber: z.string().optional(),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  capabilities: z.array(z.nativeEnum(UserCapability)).optional(),
});

// Type exports
export type User = z.infer<typeof userSchema>;
export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>; 