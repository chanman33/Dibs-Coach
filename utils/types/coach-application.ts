import { z } from "zod"
import { REAL_ESTATE_DOMAINS, type RealEstateDomain } from "./coach"

// Define the status enum to match Prisma
export const COACH_APPLICATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DRAFT: 'DRAFT'
} as const;

export type CoachApplicationStatus = typeof COACH_APPLICATION_STATUS[keyof typeof COACH_APPLICATION_STATUS];

// Base schema for form submission
export const coachApplicationFormSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phoneNumber: z.string().min(1, "Phone number is required"),
  resume: z.instanceof(File).nullable(),
  linkedIn: z.string().url().optional().nullable(),
  primarySocialMedia: z.string().optional().nullable(),
  yearsOfExperience: z.coerce.number().min(0, "Years must be 0 or greater"),
  superPower: z.string().min(1, "Super power is required"),
  aboutYou: z.string().min(1, "Additional information is required"),
  realEstateDomains: z.array(z.enum(Object.values(REAL_ESTATE_DOMAINS) as [string, ...string[]]))
    .min(1, "Please select at least one real estate domain"),
  primaryDomain: z.enum(Object.values(REAL_ESTATE_DOMAINS) as [string, ...string[]])
});

// Type for form data
export type CoachApplicationFormData = z.infer<typeof coachApplicationFormSchema>;

// Schema for database operations
export const CoachApplicationSchema = z.object({
  ulid: z.string().length(26),
  status: z.enum(Object.values(COACH_APPLICATION_STATUS) as [string, ...string[]]),
  yearsOfExperience: z.number(),
  superPower: z.string(),
  realEstateDomains: z.array(z.enum(Object.values(REAL_ESTATE_DOMAINS) as [string, ...string[]])),
  primaryDomain: z.enum(Object.values(REAL_ESTATE_DOMAINS) as [string, ...string[]]),
  notes: z.string().nullable(),
  reviewerUlid: z.string().length(26).nullable(),
  reviewDate: z.string().datetime().nullable(),
  resumeUrl: z.string().nullable(),
  linkedIn: z.string().nullable(),
  primarySocialMedia: z.string().nullable(),
  aboutYou: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  applicant: z.object({
    ulid: z.string().length(26),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    email: z.string(),
    phoneNumber: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
  }).nullable(),
  reviewer: z.object({
    ulid: z.string().length(26),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
  }).nullable(),
});

export type CoachApplication = z.infer<typeof CoachApplicationSchema>;

// Review Application Input Schema
export const ReviewApplicationInputSchema = z.object({
  applicationUlid: z.string().length(26),
  status: z.enum(Object.values(COACH_APPLICATION_STATUS) as [string, ...string[]]),
  notes: z.string().optional()
});

export type ReviewApplicationInput = z.infer<typeof ReviewApplicationInputSchema>;

// Response type for API
export type ApplicationResponse = {
  ulid: string;
  status: CoachApplicationStatus;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  yearsOfExperience: number;
  superPower: string;
  aboutYou: string | null;
  realEstateDomains: RealEstateDomain[];
  primaryDomain: RealEstateDomain;
  resumeUrl: string | null;
  linkedIn: string | null;
  primarySocialMedia: string | null;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  applicant?: {
    ulid: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNumber: string | null;
    profileImageUrl: string | null;
  };
  reviewer?: {
    ulid: string;
    firstName: string | null;
    lastName: string | null;
  };
};

export type ApiResponse<T> = {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  } | null;
}; 