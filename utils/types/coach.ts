import { z } from "zod";

export const CoachProfileSchema = z.object({
  id: z.number().optional(),
  bio: z.string().min(1, "Bio is required").max(1000, "Bio must be less than 1000 characters"),
  specialties: z.array(z.string()).min(1, "At least one specialty is required"),
  yearsCoaching: z.number().min(0, "Years of coaching must be 0 or greater").optional(),
  certifications: z.array(z.string()).optional(),
  hourlyRate: z.number().min(0, "Hourly rate must be 0 or greater"),
  calendlyUrl: z.string().url("Invalid Calendly URL").optional().nullable(),
  eventTypeUrl: z.string().url("Invalid event type URL").optional().nullable(),
  isActive: z.boolean().default(true),
  defaultDuration: z.number().min(15).max(240).default(60),
  allowCustomDuration: z.boolean().default(false),
  minimumDuration: z.number().min(15).max(240).default(30),
  maximumDuration: z.number().min(15).max(240).default(120),
});

export type CoachProfile = z.infer<typeof CoachProfileSchema> & {
  id: number;
  totalSessions: number;
  averageRating: number | null;
};

export const UpdateCoachProfileSchema = CoachProfileSchema.partial().extend({
  id: z.number(),
});

export type UpdateCoachProfile = z.infer<typeof UpdateCoachProfileSchema>;

// Specialties and certifications options
export const COACH_SPECIALTIES = [
  "Real Estate Sales",
  "Residential Properties",
  "Commercial Properties",
  "Property Management",
  "Investment Properties",
  "Luxury Real Estate",
  "First-Time Buyers",
  "Marketing Strategy",
  "Business Development",
  "Team Leadership",
] as const;

export const COACH_CERTIFICATIONS = [
  "Licensed Real Estate Broker",
  "Certified Residential Specialist (CRS)",
  "Graduate, REALTOR® Institute (GRI)",
  "Accredited Buyer's Representative (ABR)",
  "Seller Representative Specialist (SRS)",
  "Certified International Property Specialist (CIPS)",
  "Certified Property Manager (CPM)",
  "Certified Commercial Investment Member (CCIM)",
  "Short Sales and Foreclosure Resource (SFR)",
  "NAR's Green Designation",
] as const;

export const CoachMetricsSchema = z.object({
  totalSessions: z.number(),
  completedSessions: z.number(),
  averageRating: z.number().nullable(),
  completionRate: z.number(),
  ratings: z.number(),
});

export enum CoachApplicationStatus {
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected'
}

export const COACH_APPLICATION_STATUS = {
  PENDING: CoachApplicationStatus.pending,
  APPROVED: CoachApplicationStatus.approved,
  REJECTED: CoachApplicationStatus.rejected,
} as const;

export type CoachApplicationStatusType = typeof COACH_APPLICATION_STATUS[keyof typeof COACH_APPLICATION_STATUS];

export type CoachMetrics = z.infer<typeof CoachMetricsSchema>; 