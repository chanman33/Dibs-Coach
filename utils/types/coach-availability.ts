import { z } from 'zod';

// Schema for availability slots
export const AvailabilitySlotSchema = z.object({
  days: z.array(z.string()),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
});

export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>;

// Schema for coach schedule
export const CoachScheduleSchema = z.object({
  ulid: z.string(),
  userUlid: z.string(),
  name: z.string(),
  timeZone: z.string(),
  availability: z.array(AvailabilitySlotSchema),
  isDefault: z.boolean(),
  active: z.boolean(),
  defaultDuration: z.number()
});

export type CoachSchedule = z.infer<typeof CoachScheduleSchema>;

// Type for coach basic info
export interface CoachInfo {
  ulid: string;
  firstName: string;
  lastName: string;
}

// Response type for getCoachAvailability
export interface CoachAvailabilityResponse {
  coach: CoachInfo | null;
  schedule: CoachSchedule | null;
}

// Parameter type for getCoachAvailability
export interface GetCoachAvailabilityParams {
  coachId?: string;
  slug?: string;
} 