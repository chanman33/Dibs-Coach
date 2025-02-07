import { z } from "zod"
import { CoachApplicationStatus } from "./coach"

// Update CoachApplicationStatus to include draft
export const COACH_APPLICATION_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

// Coach Application Schema
export const CoachApplicationSchema = z.object({
  id: z.number(),
  applicantDbId: z.number(),
  status: z.enum([
    COACH_APPLICATION_STATUS.DRAFT,
    COACH_APPLICATION_STATUS.PENDING,
    COACH_APPLICATION_STATUS.APPROVED,
    COACH_APPLICATION_STATUS.REJECTED
  ]),
  experience: z.string(),
  specialties: z.array(z.string()),
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
  applicationId: z.number(),
  status: z.enum([
    COACH_APPLICATION_STATUS.PENDING,
    COACH_APPLICATION_STATUS.APPROVED,
    COACH_APPLICATION_STATUS.REJECTED
  ]),
  notes: z.string().optional(),
});

export type ReviewApplicationInput = z.infer<typeof ReviewApplicationInputSchema>; 