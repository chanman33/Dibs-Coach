import { z } from "zod"
import { CoachApplicationStatus } from "./coach"

// Coach Application Schema
export const CoachApplicationSchema = z.object({
  id: z.number(),
  applicantDbId: z.number(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DRAFT']),
  experience: z.string(),
  specialties: z.array(z.string()),
  industrySpecialties: z.array(z.string()).default([]),
  notes: z.string().nullable(),
  reviewerDbId: z.number().nullable(),
  reviewDate: z.string().datetime().nullable(),
  resumeUrl: z.string().nullable(),
  linkedIn: z.string().nullable(),
  primarySocialMedia: z.string().nullable(),
  additionalInfo: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  applicant: z.object({
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    email: z.string(),
  }).nullable(),
});

export type CoachApplication = z.infer<typeof CoachApplicationSchema>;

// Review Application Input Schema
export const ReviewApplicationInputSchema = z.object({
  applicationUlid: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DRAFT']),
  notes: z.string().optional(),
});

export type ReviewApplicationInput = z.infer<typeof ReviewApplicationInputSchema>;

export type ApplicationData = {
  ulid: string;
  status: CoachApplicationStatus;
  experience: string;
  specialties: string[];
  industrySpecialties: string[];
  notes: string | null;
  applicationDate: string;
  reviewDate: string | null;
  createdAt: string;
  updatedAt: string;
  resumeUrl: string | null;
  linkedIn: string | null;
  primarySocialMedia: string | null;
  additionalInfo: string | null;
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