import { z } from "zod";

export interface BrowseCoachData {
  id: number;
  userId: string;
  name: string;
  strength: string;
  imageUrl: string | null;
  bio: string | null;
  experience: string | null;
  certifications: string[] | null;
  availability: string | null;
  sessionLength: string | null;
  specialties: string[];
  calendlyUrl: string | null;
  eventTypeUrl: string | null;
  rate: number | null;
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