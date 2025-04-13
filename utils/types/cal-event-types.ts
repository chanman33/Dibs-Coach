/**
 * Cal.com Event Types
 * 
 * This file contains TypeScript definitions for Cal.com event types and related interfaces.
 */

import { CalSchedulingType } from '@prisma/client'

/**
 * API response from Cal.com for event types
 */
export interface CalEventTypeResponse {
  id: number;
  userId: number;
  title: string;
  slug: string;
  description: string | null;
  length: number;
  hidden: boolean;
  position: number;
  price: number;
  currency: string;
  metadata: Record<string, any>;
  // Additional fields for scheduling types
  seatsPerTimeSlot?: number;
  schedulingType?: string;
  // Plus other Cal.com API fields
}

/**
 * Colors for Cal.com event types
 */
export interface CalEventTypeColor {
  lightThemeHex: string;
  darkThemeHex: string;
}

/**
 * Confirmation policy for Cal.com event types
 */
export interface CalConfirmationPolicy {
  disabled: boolean;
}

/**
 * Seats configuration for Cal.com event types
 */
export interface CalEventTypeSeats {
  seatsPerTimeSlot: number;
  showAttendeeInfo: boolean;
  showAvailabilityCount: boolean;
}

/**
 * Location for Cal.com event types
 */
export interface CalEventTypeLocation {
  type: string;
  link?: string;
  displayName?: string;
  address?: string;
  public?: boolean;
}

/**
 * Booker layouts for Cal.com event types
 */
export interface CalEventTypeBookerLayouts {
  defaultLayout: 'month' | 'week' | 'column';
  enabledLayouts: ('month' | 'week' | 'column')[];
}

/**
 * Default event type definition for creating new Cal.com event types
 * This matches the payload structure used in create-default API
 */
export interface DefaultCalEventType {
  // Basic event info
  name: string;
  title: string;
  slug: string;
  description: string;
  duration?: number;
  lengthInMinutes: number; // Required by Cal.com API - must match duration
  isFree: boolean;
  isActive: boolean;
  isDefault: boolean;
  
  // Scheduling settings
  scheduling: CalSchedulingType | string;
  position: number;
  disableGuests: boolean;
  slotInterval: number;
  minimumBookingNotice: number;
  
  // Calendar integration
  useDestinationCalendarEmail: boolean;
  hideCalendarEventDetails: boolean;
  customName: string;
  
  // Appearance
  confirmationPolicy: CalConfirmationPolicy;
  color: CalEventTypeColor;
  
  // Capacity
  seats: CalEventTypeSeats;
  
  // Meeting location
  locations: CalEventTypeLocation[];
  
  // Optional fields for specific scheduling types
  maxParticipants?: number;
  discountPercentage?: number;
  organizationUlid?: string;
  
  // Buffer settings
  beforeEventBuffer?: number;
  afterEventBuffer?: number;
}

/**
 * Event type definition for UI components
 */
export interface EventType {
  id: string;
  name: string;
  description: string;
  duration: number;
  free: boolean;
  enabled: boolean;
  isDefault: boolean;
  
  // Scheduling type and related fields
  schedulingType: CalSchedulingType | string;
  maxParticipants?: number;
  discountPercentage?: number;
  organizationId?: string;
  
  // Required fields for Cal.com API
  bookerLayouts?: CalEventTypeBookerLayouts;
  locations?: CalEventTypeLocation[];
  
  // Buffer settings
  beforeEventBuffer?: number;
  afterEventBuffer?: number;
  minimumBookingNotice?: number;
  
  // Additional fields
  isRequired?: boolean;
  canDisable?: boolean;
  disableGuests?: boolean;
  customName?: string;
  useDestinationCalendarEmail?: boolean;
  hideCalendarEventDetails?: boolean;
  color?: CalEventTypeColor;
  slotInterval?: number;
}

/**
 * API payload for creating a Cal.com event type
 * This exactly matches the structure required by Cal.com API v2
 */
export interface CalEventTypeCreatePayload {
  title: string;
  slug: string;
  description: string;
  length: number;
  hidden: boolean;
  metadata: Record<string, any>;
  locations: CalEventTypeLocation[];
  customInputs: any[];
  bookingFields: any[];
  children: any[];
  hosts: any[];
  schedule: any;
  workflows: any[];
  successRedirectUrl: string | null;
  brandColor: string;
  periodType: string;
  periodDays: number | null;
  periodStartDate: string | null;
  periodEndDate: string | null;
  periodCountCalendarDays: boolean | null;
  requiresConfirmation: boolean;
  requiresBookerEmailVerification: boolean;
  price: number;
  currency: string;
  slotInterval: number;
  minimumBookingNotice: number;
  beforeEventBuffer: number;
  afterEventBuffer: number;
  seatsPerTimeSlot: number | null;
  seatsShowAttendees: boolean;
  seatsShowAvailabilityCount: boolean;
  disableGuests: boolean;
  hideCalendarNotes: boolean;
  schedulingType: string | null;
  durationLimits: any | null;
  bookingLimits: any | null;
  requiresBookerAddress: boolean;
  eventName: string;
  team: any | null;
  bookerLayouts: {
    enabledLayouts: string[];
    defaultLayout: string;
  };
} 