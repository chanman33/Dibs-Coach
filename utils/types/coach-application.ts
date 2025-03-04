import { z } from "zod"
import { CoachApplicationStatus, REAL_ESTATE_DOMAINS, type RealEstateDomain } from "./coach"

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

// Schema for database
export const CoachApplicationSchema = z.object({
  ulid: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DRAFT']),
  yearsOfExperience: z.number(),
  superPower: z.string(),
  realEstateDomains: z.array(z.enum(Object.values(REAL_ESTATE_DOMAINS) as [string, ...string[]])),
  primaryDomain: z.enum(Object.values(REAL_ESTATE_DOMAINS) as [string, ...string[]]),
  notes: z.string().nullable(),
  reviewerUlid: z.string().nullable(),
  reviewDate: z.string().datetime().nullable(),
  resumeUrl: z.string().nullable(),
  linkedIn: z.string().nullable(),
  primarySocialMedia: z.string().nullable(),
  aboutYou: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  applicant: z.object({
    ulid: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    email: z.string(),
    phoneNumber: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
  }).nullable(),
  reviewer: z.object({
    ulid: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
  }).nullable(),
});

export type CoachApplication = z.infer<typeof CoachApplicationSchema>;

// Review Application Input Schema
export const ReviewApplicationInputSchema = z.object({
  applicationUlid: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DRAFT']),
  notes: z.string().optional()
});

export type ReviewApplicationInput = z.infer<typeof ReviewApplicationInputSchema>;

export type ApplicationData = {
  ulid: string;
  status: CoachApplicationStatus;
  yearsOfExperience: number;
  superPower: string;
  realEstateDomains: RealEstateDomain[];
  primaryDomain: RealEstateDomain;
  notes: string | null;
  reviewDate: string | null;
  createdAt: string;
  updatedAt: string;
  resumeUrl: string | null;
  linkedIn: string | null;
  primarySocialMedia: string | null;
  aboutYou: string | null;
  applicant: {
    ulid: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNumber: string | null;
    profileImageUrl: string | null;
  } | null;
  reviewer: {
    ulid: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

export type ApiResponse<T> = {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  } | null;
};

export type ReviewStatusType = CoachApplicationStatus; 