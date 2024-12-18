import { z } from "zod";
import { ROLES } from "./roles/roles";

export type userCreateProps = z.infer<typeof userCreateSchema>;

const userCreateSchema = z.object({
  email: z.string().email({ message: "Invalid email" }).describe("user email"),
  first_name: z
    .string()
    .regex(/^[a-zA-Z]+$/, { message: "First name must only contain letters" })
    .min(3, { message: "First name is required" })
    .describe("user first name"),
  last_name: z
    .string()
    .regex(/^[a-zA-Z]+$/, { message: "Last name must only contain letters" })
    .min(3, { message: "Last name is required" })
    .describe("user last name"),
  profile_image_url: z
    .string()
    .url({ message: "Invalid URL" })
    .optional()
    .describe("user profile image URL"),
  user_id: z.string().describe("user ID"),
  role: z.enum([ROLES.REALTOR, ROLES.COACH, ROLES.ADMIN]).describe("user role"),
});

export type userUpdateProps = z.infer<typeof userUpdateSchema>;

const userUpdateSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email" })
    .nonempty({ message: "Email is required" })
    .describe("user email"),
  first_name: z
    .string()
    .regex(/^[a-zA-Z]+$/, { message: "First name must only contain letters" })
    .describe("user first name"),
  last_name: z
    .string()
    .regex(/^[a-zA-Z]+$/, { message: "Last name must only contain letters" })
    .describe("user last name"),
  profile_image_url: z
    .string()
    .url({ message: "Invalid URL" })
    .optional()
    .describe("user profile image URL"),
  user_id: z.string().describe("user ID"),
});

export const realtorProfileSchema = z.object({
  userId: z.number(),
  companyName: z.string().nullable(),
  licenseNumber: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  bio: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  gender: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  userId: z.string(),
  subscription: z.string().nullable(),
  role: z.enum(["realtor", "coach", "admin"]),
  status: z.string(),
  brokerId: z.number().nullable(),
  teamId: z.number().nullable(),
  realtorProfile: realtorProfileSchema.nullable(),
});

export type User = z.infer<typeof userSchema>;