import { z } from "zod";
import { ROLES } from "./roles/roles";

export type userCreateProps = z.infer<typeof userCreateSchema>;

const userCreateSchema = z.object({
  email: z.string().email({ message: "Invalid email" }).describe("user email"),
  firstName: z
    .string()
    .regex(/^[a-zA-Z]+$/, { message: "First name must only contain letters" })
    .min(3, { message: "First name is required" })
    .describe("user first name"),
  lastName: z
    .string()
    .regex(/^[a-zA-Z]+$/, { message: "Last name must only contain letters" })
    .min(3, { message: "Last name is required" })
    .describe("user last name"),
  profileImageUrl: z
    .string()
    .url({ message: "Invalid URL" })
    .optional()
    .describe("user profile image URL"),
  userId: z.string().describe("user ID"),
  role: z.enum([
    ROLES.REALTOR, 
    ROLES.LOAN_OFFICER, 
    ROLES.REALTOR_COACH, 
    ROLES.LOAN_OFFICER_COACH,
    ROLES.ADMIN
  ]).describe("user role"),
});

export type userUpdateProps = z.infer<typeof userUpdateSchema>;

const userUpdateSchema = z.object({
  email: z.string().email({ message: "Invalid email" }).nonempty({ message: "Email is required" }),
  firstName: z.string().regex(/^[a-zA-Z]+$/, { message: "First name must only contain letters" }),
  lastName: z.string().regex(/^[a-zA-Z]+$/, { message: "Last name must only contain letters" }),
  profileImageUrl: z.string().url({ message: "Invalid URL" }).optional(),
  userId: z.string(),
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
  role: z.enum([
    "realtor", 
    "loan_officer", 
    "realtor_coach", 
    "loan_officer_coach",
    "admin"
  ]),
  status: z.string(),
  brokerId: z.number().nullable(),
  teamId: z.number().nullable(),
  realtorProfile: realtorProfileSchema.nullable(),
});

export type User = z.infer<typeof userSchema>;

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
});

export const COACH_APPLICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export const coachApplicationSchema = z.object({
  userId: z.number(),
  status: z.enum([
    COACH_APPLICATION_STATUS.PENDING,
    COACH_APPLICATION_STATUS.APPROVED,
    COACH_APPLICATION_STATUS.REJECTED
  ]),
  experience: z.string(),
  specialties: z.array(z.string()),
  applicationDate: z.string(),
  reviewedBy: z.number().nullable(),
  reviewDate: z.string().nullable(),
  notes: z.string().nullable(),
});

export type CoachApplication = z.infer<typeof coachApplicationSchema>;