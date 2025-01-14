import { z } from "zod";
import { ROLES } from "./roles/roles";

// Profile schemas
export const realtorProfileSchema = z.object({
  userId: z.number(),
  companyName: z.string().nullable(),
  licenseNumber: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  bio: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Base user types
export const userCreateSchema = z.object({
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
  userId: z.string().describe("Clerk user ID"),
  role: z.enum([
    ROLES.REALTOR, 
    ROLES.LOAN_OFFICER, 
    ROLES.REALTOR_COACH, 
    ROLES.LOAN_OFFICER_COACH,
    ROLES.ADMIN
  ]).describe("user role"),
});

export const userSchema = z.object({
  id: z.number().describe("Internal database ID"),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  gender: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  userId: z.string().describe("Clerk user ID"),
  subscription: z.string().nullable(),
  role: z.enum([
    ROLES.REALTOR, 
    ROLES.LOAN_OFFICER, 
    ROLES.REALTOR_COACH, 
    ROLES.LOAN_OFFICER_COACH,
    ROLES.ADMIN
  ]),
  status: z.string(),
  brokerId: z.number().nullable(),
  teamId: z.number().nullable(),
  realtorProfile: realtorProfileSchema.nullable(),
});

// Calendly integration types
export const calendlyIntegrationSchema = z.object({
  id: z.number().describe("Internal database ID"),
  userDbId: z.number().describe("Reference to internal User.id"),
  accessToken: z.string(),
  refreshToken: z.string(),
  organizationUrl: z.string().url(),
  scope: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  owner: z.string().describe("Calendly owner URL"),
  webhook: z.object({
    uri: z.string().url(),
    retries: z.number(),
    created: z.boolean(),
  }).nullable(),
});

export const calendlyEventSchema = z.object({
  id: z.number().describe("Internal database ID"),
  userDbId: z.number().describe("Reference to internal User.id"),
  eventId: z.string().describe("Calendly event ID"),
  eventUrl: z.string().url(),
  status: z.enum(["active", "canceled"]),
  startTime: z.string(),
  endTime: z.string(),
  eventType: z.string(),
  location: z.object({
    type: z.string(),
    data: z.record(z.any()),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Type exports
export type User = z.infer<typeof userSchema>;
export type UserCreate = z.infer<typeof userCreateSchema>;
export type CalendlyIntegration = z.infer<typeof calendlyIntegrationSchema>;
export type CalendlyEvent = z.infer<typeof calendlyEventSchema>;

export type userUpdateProps = z.infer<typeof userUpdateSchema>;

const userUpdateSchema = z.object({
  email: z.string().email({ message: "Invalid email" }).nonempty({ message: "Email is required" }),
  firstName: z.string().regex(/^[a-zA-Z]+$/, { message: "First name must only contain letters" }),
  lastName: z.string().regex(/^[a-zA-Z]+$/, { message: "Last name must only contain letters" }),
  profileImageUrl: z.string().url({ message: "Invalid URL" }).optional(),
  userId: z.string(),
});

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