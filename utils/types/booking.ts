import { z } from "zod";

// Interfaces for booking availability component
export interface TimeSlot {
  startTime: Date;
  endTime: Date;
}

export interface BusyTime {
  start: string;
  end: string;
  source: string;
}

export interface AvailabilitySlot {
  days: string[];
  startTime: string; // Format: "HH:MM"
  endTime: string;   // Format: "HH:MM"
}

export interface CoachSchedule {
  ulid: string;
  userUlid: string;
  name: string;
  timeZone: string;
  availability: AvailabilitySlot[];
  isDefault: boolean;
  active: boolean;
  defaultDuration: number;
}

export interface TimeSlotGroup {
  title: string;
  slots: TimeSlot[];
}

// Coach information for booking UI
export interface Coach {
  name: string;
  sessionType?: string;
  sessionDuration?: number;
  hourlyRate?: number;
}

// Loading state type for more detailed status tracking
export interface LoadingState {
  status: 'loading' | 'success' | 'error';
  context?: string;
  message?: string;
}

// Schema for booking validation
export const BookingSchema = z.object({
  eventTypeId: z.number(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  attendeeName: z.string(),
  attendeeEmail: z.string().email(),
  timeZone: z.string()
});

export type BookingParams = z.infer<typeof BookingSchema>;

// Booking result types
export interface CalendarLink {
  label: string;
  link: string;
}

export interface BookingResult {
  id: string;
  calBookingUid: string;
  title: string;
  startTime: string;
  endTime: string;
  attendeeName: string;
  attendeeEmail: string;
  calendarLinks?: CalendarLink[];
}

/**
 * Response from booking creation
 */
export interface BookingResponse {
  id: string;
  calBookingUid: string;
  startTime: string;
  endTime: string;
  attendeeName: string;
  attendeeEmail: string;
  createdAt: string;
} 