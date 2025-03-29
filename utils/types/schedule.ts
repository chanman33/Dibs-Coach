import { z } from 'zod';

// Define our own Json type for Supabase compatibility
export type Json = 
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Constants for schedule sync sources
export const SCHEDULE_SYNC_SOURCE = {
  LOCAL: 'LOCAL',     // Created locally, never synced to Cal.com
  CALCOM: 'CALCOM',   // Imported from Cal.com
  SYNCED: 'SYNCED'    // Synced bidirectionally with Cal.com
} as const;

export type ScheduleSyncSource = typeof SCHEDULE_SYNC_SOURCE[keyof typeof SCHEDULE_SYNC_SOURCE];

// Matches Cal.com API structure exactly for days availability
export interface AvailabilitySlot {
  days: string[];       // Array of weekdays: ["Monday", "Tuesday", etc.]
  startTime: string;    // Format: "HH:MM"
  endTime: string;      // Format: "HH:MM"
}

// Matches Cal.com API structure for date-specific overrides
export interface ScheduleOverride {
  date: string;         // Format: "YYYY-MM-DD"
  startTime: string;    // Format: "HH:MM"
  endTime: string;      // Format: "HH:MM"
}

// Type for the availability JSON field
export type ScheduleAvailability = AvailabilitySlot[];

// Type for the overrides JSON field
export type ScheduleOverrides = ScheduleOverride[];

// Type for database JSON fields - could be string (when retrieved) or object (when working with it)
export type JsonField<T> = T | string;

// Complete schedule type including all fields from our database
export interface CoachingSchedule {
  ulid: string;
  userUlid: string;
  name: string;
  timeZone: string;
  calScheduleId?: number | null;
  // Use JsonField type for JSON database fields
  availability: JsonField<ScheduleAvailability>;
  overrides?: JsonField<ScheduleOverrides> | null;
  syncSource: ScheduleSyncSource;
  lastSyncedAt?: string | null; // Always use ISO strings for dates in DB
  isDefault: boolean;
  active: boolean;
  allowCustomDuration: boolean;
  defaultDuration: number;
  maximumDuration: number;
  minimumDuration: number;
  bufferAfter: number;
  bufferBefore: number;
  averageRating?: number | null;
  totalSessions: number;
  zoomEnabled: boolean;
  calendlyEnabled: boolean;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
}

// Cal.com API Schedule Type (for reference)
export interface CalSchedule {
  id: number;
  name: string;
  timeZone: string;
  availability: AvailabilitySlot[];
  isDefault: boolean;
  overrides?: ScheduleOverride[];
}

// Helper functions to serialize/deserialize JSON fields
export function serializeJsonField<T>(field: T): string {
  return typeof field === 'string' ? field : JSON.stringify(field);
}

export function parseJsonField<T>(field: JsonField<T>): T {
  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T;
    } catch (e) {
      console.error('Error parsing JSON field:', e);
      return {} as T;
    }
  }
  return field as T;
}

// Convert dates to ISO strings
export function toIsoString(date: Date | string | null | undefined): string | null {
  if (date === null || date === undefined) return null;
  if (typeof date === 'string') return date;
  return date.toISOString();
}

// Zod schema for validation
export const availabilitySlotSchema = z.object({
  days: z.array(z.string()),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
});

export const scheduleOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
});

export const calScheduleSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  timeZone: z.string(),
  availability: z.array(availabilitySlotSchema),
  isDefault: z.boolean().default(false),
  overrides: z.array(scheduleOverrideSchema).optional()
});

// Schema for creating a new schedule
export const createScheduleSchema = z.object({
  name: z.string(),
  timeZone: z.string(),
  availability: z.array(availabilitySlotSchema).default([{
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    startTime: "09:00",
    endTime: "17:00"
  }]),
  isDefault: z.boolean().default(false),
  overrides: z.array(scheduleOverrideSchema).optional()
});

// Schema for updating an existing schedule
export const updateScheduleSchema = z.object({
  name: z.string().optional(),
  timeZone: z.string().optional(),
  availability: z.array(availabilitySlotSchema).optional(),
  isDefault: z.boolean().optional(),
  overrides: z.array(scheduleOverrideSchema).optional()
}); 