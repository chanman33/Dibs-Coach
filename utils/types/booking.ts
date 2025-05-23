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

export interface TimeSlotGroup {
  title: string;
  slots: TimeSlot[];
}

// Loading state type for more detailed status tracking
export interface LoadingState {
  status: 'loading' | 'success' | 'error';
  context?: string;
  message?: string;
}

// Booking result types
export interface CalendarLink {
  label: string;
  link: string;
}

export interface BookingResult {
  id: string; // This is the CalBooking ulid from our DB
  calBookingUid: string;
  title: string;
  startTime: string;
  endTime: string;
  attendeeName: string;
  attendeeEmail: string;
  calendarLinks?: CalendarLink[];
} 