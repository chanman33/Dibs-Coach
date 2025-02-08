import { z } from "zod";

export enum UserRole {
  MENTEE = "MENTEE",
  COACH = "COACH",
  ADMIN = "ADMIN"
}

export enum UserStatus {
  active = "active",
  inactive = "inactive",
  suspended = "suspended"
}

export const userSchema = z.object({
  id: z.number().describe("Internal database ID"),
  userId: z.string().describe("Clerk user ID"),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  role: z.nativeEnum(UserRole).default(UserRole.MENTEE),
  status: z.nativeEnum(UserStatus).default(UserStatus.active),
  profileImageUrl: z.string().nullable(),
  stripeCustomerId: z.string().nullable(),
  stripeConnectAccountId: z.string().nullable(),
  
  // RESO Member fields
  memberKey: z.string().nullable(),
  memberStatus: z.string(),
  designations: z.array(z.string()),
  licenseNumber: z.string().nullable(),
  companyName: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  
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
  role: z.nativeEnum(UserRole).default(UserRole.MENTEE),
  profileImageUrl: z.string().url().nullable(),
});

export const userUpdateSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().regex(/^[a-zA-Z]+$/).optional(),
  lastName: z.string().regex(/^[a-zA-Z]+$/).optional(),
  profileImageUrl: z.string().url().optional(),
  phoneNumber: z.string().optional(),
  companyName: z.string().optional(),
  licenseNumber: z.string().optional(),
});

// Type exports
export type User = z.infer<typeof userSchema>;
export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>; 