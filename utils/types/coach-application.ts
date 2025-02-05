import { z } from "zod"
import { CoachApplicationStatus } from "./coach"

// Coach Application Schema
export const CoachApplicationSchema = z.object({
  id: z.number(),
  applicantDbId: z.number(),
  status: z.nativeEnum(CoachApplicationStatus),
  experience: z.string(),
  specialties: z.array(z.string()),
  notes: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.string().datetime().nullable(),
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
  status: z.nativeEnum(CoachApplicationStatus),
  notes: z.string().optional(),
});

export type ReviewApplicationInput = z.infer<typeof ReviewApplicationInputSchema>; 