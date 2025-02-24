import { z } from "zod";
import { USER_CAPABILITIES } from '@/utils/roles/roles'

export interface BrowseCoachData {
  ulid: string;
  userId: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  bio: string | null;
  coachingSpecialties: string[];
  hourlyRate: number | null;
  calendlyUrl: string | null;
  eventTypeUrl: string | null;
  isActive: boolean;
  yearsCoaching: number | null;
  totalSessions: number;
  averageRating: number | null;
  defaultDuration: number;
  minimumDuration: number;
  maximumDuration: number;
  allowCustomDuration: boolean;
}

export interface BrowseCoachesProps {
  role: keyof typeof USER_CAPABILITIES;
}

export interface SessionConfig {
  durations: number[];
  rates: Record<string, number>;
  currency: string;
  defaultDuration: number;
  allowCustomDuration: boolean;
  minimumDuration: number;
  maximumDuration: number;
  isActive: boolean;
}

export const browseCoachSchema = z.object({
  ulid: z.string().length(26),
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  profileImageUrl: z.string().nullable(),
  bio: z.string().nullable(),
  coachingSpecialties: z.array(z.string()),
  hourlyRate: z.number().nullable(),
  calendlyUrl: z.string().nullable(),
  eventTypeUrl: z.string().nullable(),
  isActive: z.boolean(),
  yearsCoaching: z.number().nullable(),
  totalSessions: z.number(),
  averageRating: z.number().nullable(),
  defaultDuration: z.number(),
  minimumDuration: z.number(),
  maximumDuration: z.number(),
  allowCustomDuration: z.boolean()
}); 