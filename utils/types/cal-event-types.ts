/**
 * Cal.com Event Types
 * 
 * This file contains TypeScript definitions for Cal.com event types and related interfaces.
 */

import { CalSchedulingType } from '@prisma/client'
import { Json } from '@/types/supabase'

/**
 * Core EventType interface for UI components
 * Contains only essential fields needed for display and editing
 */
export interface EventType {
  id: string;
  name: string;
  description: string;
  duration: number;
  free: boolean;
  enabled: boolean;
  isDefault: boolean;
  schedulingType: CalSchedulingType | string;
  
  // Optional fields for special scheduling types
  maxParticipants?: number;
  discountPercentage?: number;
  organizationId?: string;
  
  // Buffer settings (needed for Cal.com API)
  beforeEventBuffer?: number;
  afterEventBuffer?: number;
  minimumBookingNotice?: number;
  slotInterval?: number;
  
  // Location settings
  locations?: CalEventTypeLocation[];
  
  // UI-specific fields
  isRequired?: boolean;
  canDisable?: boolean;
}

/**
 * Location type for Cal.com event types
 */
export interface CalEventTypeLocation {
  type: string;
  link?: string;
  displayName?: string;
  address?: string;
  public?: boolean;
}

/**
 * API response from Cal.com for event types
 */
export interface CalEventTypeResponse {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  length: number;
  hidden: boolean;
  price: number;
  metadata?: Record<string, any>;
  seatsPerTimeSlot?: number;
  schedulingType?: string;
}

/**
 * Payload for creating an event type in Cal.com API
 */
export interface CalEventTypeCreatePayload {
  title: string;
  slug: string;
  description: string;
  lengthInMinutes: number;
  hidden: boolean;
  price: number;
  schedulingType: string | null;
  locations: CalEventTypeLocation[];
  seatsPerTimeSlot?: number;
  metadata?: Record<string, any>;
  minimumBookingNotice?: number;
  beforeEventBuffer?: number;
  afterEventBuffer?: number;
  // Other fields as needed by Cal.com API
}

/**
 * Default event type definition with basic required fields
 */
export interface DefaultEventType {
  name: string;
  description: string;
  duration: number;
  isFree: boolean;
  schedulingType: string;
  isDefault: boolean;
}

/**
 * Type converters between database/API/UI formats
 */

/**
 * Converts CalEventTypeLocation array to Json for database storage
 */
export function locationArrayToJson(locations: CalEventTypeLocation[] | undefined): Json | undefined {
  if (!locations) return undefined;
  return locations as unknown as Json;
}

/**
 * Converts Json from database to CalEventTypeLocation array
 */
export function jsonToLocationArray(json: Json | null | undefined): CalEventTypeLocation[] | undefined {
  if (!json) return undefined;
  return json as unknown as CalEventTypeLocation[];
}

/**
 * Converts a database event type to UI EventType format
 */
export function dbToEventType(dbRecord: any): EventType {
  return {
    id: dbRecord.ulid,
    name: dbRecord.name,
    description: dbRecord.description || '',
    duration: dbRecord.lengthInMinutes,
    free: dbRecord.isFree,
    enabled: dbRecord.isActive,
    isDefault: dbRecord.isDefault,
    schedulingType: dbRecord.scheduling,
    maxParticipants: dbRecord.maxParticipants || undefined,
    discountPercentage: dbRecord.discountPercentage || undefined,
    organizationId: dbRecord.organizationUlid || undefined,
    
    // UI display settings
    isRequired: dbRecord.isDefault, // Default events are required
    canDisable: !dbRecord.isDefault, // Non-default events can be disabled
  };
}

/**
 * Converts a UI EventType to database insert format
 */
export function eventTypeToDbFields(eventType: EventType, calendarIntegrationUlid: string): any {
  return {
    name: eventType.name,
    description: eventType.description,
    lengthInMinutes: eventType.duration,
    isFree: eventType.free,
    isActive: eventType.enabled,
    isDefault: eventType.isDefault,
    scheduling: eventType.schedulingType as CalSchedulingType,
    maxParticipants: eventType.maxParticipants || null,
    discountPercentage: eventType.discountPercentage || null,
    organizationUlid: eventType.organizationId || null,
    calendarIntegrationUlid,
    // Default values for JSON fields - will be properly typed in DB operations
    locations: [{
      type: 'link',
      link: 'https://dibs.coach/call/session',
      public: true
    }],
  };
}

/**
 * Converts an EventType to Cal.com API format
 */
export function eventTypeToCalFormat(eventType: EventType, hourlyRate: number = 0): CalEventTypeCreatePayload {
  const price = eventType.free ? 0 : calculateEventPrice(hourlyRate, eventType.duration);
  
  return {
    title: eventType.name,
    slug: generateSlug(eventType.name),
    description: eventType.description,
    lengthInMinutes: eventType.duration,
    hidden: !eventType.enabled,
    price,
    schedulingType: (eventType.schedulingType as string).toLowerCase() || null,
    locations: [{
      type: 'link',
      link: 'https://dibs.coach/call/session',
      public: true
    }],
    seatsPerTimeSlot: eventType.maxParticipants,
    metadata: eventType.discountPercentage ? { discountPercentage: eventType.discountPercentage } : undefined,
  };
}

/**
 * Helper to calculate event price based on hourly rate and duration
 */
export function calculateEventPrice(hourlyRate: number, durationMinutes: number): number {
  const hourlyRateInCents = Math.round(hourlyRate * 100);
  const durationHours = durationMinutes / 60;
  const priceInCents = Math.round(hourlyRateInCents * durationHours);
  return priceInCents;
}

/**
 * Helper to generate a slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
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
  title: string; // Same as name, but used for Cal.com API
  slug: string;
  description: string;
  duration?: number;
  lengthInMinutes: number; // Required by Cal.com API - must match duration
  isFree: boolean;
  isActive: boolean;
  isDefault: boolean;
  isRequired?: boolean; // Whether this event type is required (cannot be disabled by user)
  
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
  
  // Confirmation settings
  requiresConfirmation?: boolean;
} 