import { z } from 'zod'

// Schema for the payload needed to create a Cal.com managed user via API key
export const createCalManagedUserPayloadSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  timeFormat: z.number().default(12), // Default to 12-hour format
  weekStart: z.string().default("Monday"), // Default week start
  timeZone: z.string(),
  locale: z.string().default("en"), // Default to English
  avatarUrl: z.string().url().optional() // Optional profile image URL
});

export type CreateCalManagedUserPayload = z.infer<typeof createCalManagedUserPayloadSchema>;

// Interface representing the structure of your CalendarIntegration database table
// Keep this synchronized with your actual Supabase schema
export interface CalendarIntegrationRecord {
  ulid: string;
  userUlid: string;
  calManagedUserId: number; // Matches the corrected column name
  isManagedUser: boolean;
  googleCalendarConnected: boolean;
  office365CalendarConnected: boolean;
  accessToken?: string | null; // Optional fields based on connection type
  refreshToken?: string | null;
  tokenExpiresAt?: string | null; // Represented as ISO string or timestamp number?
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
}

// Cal.com API response for user creation
export interface CalUserApiResponse {
  user: {
    id: number;
    email: string;
    name: string;
    username?: string;
    timeZone?: string;
    timeFormat?: number;
    weekStart?: string;
    locale?: string;
    avatarUrl?: string | null;
  };
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number | string;
}

// You might also add types for Cal.com API responses if needed
// export interface CalUserApiResponse {
//   user: {
//     id: number;
//     email: string;
//     // ... other fields returned by Cal.com
//   };
//   // ... other top-level response fields
// } 