import { z } from "zod";

export interface BrowseCoachData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl: string | null;
  bio: string | null;
  specialties: string[] | null;
  hourlyRate: number | null;
  rating: number | null;
  totalSessions: number;
  isAvailable: boolean;
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

export interface BrowseCoachProps {
  role: 'COACH' | 'MENTEE';
  isBooked?: boolean;
}

export const browseCoachSchema = z.object({
  id: z.number(),
  userId: z.string(),
  name: z.string(),
  strength: z.string(),
  imageUrl: z.string().nullable(),
  bio: z.string().nullable(),
  experience: z.string().nullable(),
  certifications: z.array(z.string()).nullable(),
  availability: z.string().nullable(),
  sessionLength: z.string().nullable(),
  specialties: z.array(z.string()),
  calendlyUrl: z.string().nullable(),
  eventTypeUrl: z.string().nullable(),
  rate: z.number().nullable()
}); 