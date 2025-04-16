/**
 * Cal.com Event Types
 * 
 * This file contains TypeScript definitions for Cal.com event types and related interfaces.
 * It serves as the central repository for all type definitions related to Cal.com integration.
 */

import { CalSchedulingType } from '@prisma/client'
import { Json } from '@/types/supabase'
import { Database } from '@/types/supabase'

/**
 * Database CalEventType row type - used across all files
 */
export type DbCalEventType = Database['public']['Tables']['CalEventType']['Row'];

/**
 * API responses
 */

/**
 * API response structure for event type sync operations
 */
export type SyncResult = {
  success: boolean;
  error?: string;
  stats?: {
    fetchedFromCal: number;
    fetchedFromDb: number;
    createdInDb: number;
    updatedInDb: number;
    deactivatedInDb: number; // Deactivated instead of deleted
    skipped: number;
  };
};

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
 * Event type from Cal.com API
 */
export interface CalEventTypeFromApi {
  id: number;
  title: string;
  description?: string | null;
  length: number; // Duration in minutes (older API format)
  lengthInMinutes?: number; // Duration in minutes (new v2 API format)
  hidden: boolean; // Inactive if true
  position: number;
  price: number;
  currency: string;
  schedulingType?: string | null;
  minimumBookingNotice?: number | null;
  locations?: any[] | null;
  beforeEventBuffer?: number | null;
  afterEventBuffer?: number | null;
  seatsPerTimeSlot?: number | null; // Used for maxParticipants
  metadata?: { [key: string]: any } | null;
  slug: string;
  // Add any other relevant fields from Cal.com v2 API response
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
  disableGuests?: boolean;
  slotInterval?: number;
  confirmationPolicy?: CalConfirmationPolicy;
  color?: CalEventTypeColor;
  seats?: CalEventTypeSeats;
  customName?: string;
  useDestinationCalendarEmail?: boolean;
  hideCalendarEventDetails?: boolean;
  currency?: string;
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
 * Parameters for fetching event types
 */
export interface FetchEventTypesResponse {
  eventTypes: EventType[]
  coachHourlyRate?: {
    hourlyRate: number | null
    isValid: boolean
  }
}

/**
 * Parameters for saving event types
 */
export interface SaveEventTypeParams {
  eventTypes: EventType[]
}

/**
 * Representation of a default event type for creation
 */
export interface DefaultEventTypeConfig {
  name: string
  description: string
  duration: number
  isFree: boolean
  isActive: boolean
  isDefault: boolean
  scheduling: string
  position: number
  slug?: string
  // Cal.com API required fields
  locations: {
    type: string
    link?: string
    displayName?: string
    address?: string
    public?: boolean
  }[]
  beforeEventBuffer: number
  afterEventBuffer: number
  minimumBookingNotice: number
  // Optional fields
  maxParticipants?: number
  discountPercentage?: number
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
  
  // Default values based on working payload
  const defaultColor: CalEventTypeColor = {
    lightThemeHex: '#3B82F6',
    darkThemeHex: '#60A5FA'
  };
  const defaultSeats: CalEventTypeSeats = {
    seatsPerTimeSlot: eventType.maxParticipants || 1, // Use maxParticipants if available, default 1
    showAttendeeInfo: false,
    showAvailabilityCount: false
  };
  const defaultConfirmationPolicy: CalConfirmationPolicy = {
    disabled: true
  };

  return {
    title: eventType.name,
    slug: generateSlug(eventType.name),
    description: eventType.description || '', // Ensure non-null description
    lengthInMinutes: eventType.duration,
    hidden: !eventType.enabled,
    price,
    currency: 'USD', // Default currency
    // Ensure schedulingType is uppercase string or null
    schedulingType: eventType.schedulingType ? (eventType.schedulingType as string).toUpperCase() : null,
    locations: eventType.locations || [{ type: 'link', link: 'https://dibs.coach/call/session', public: true }], // Default location
    // Optional fields with defaults from working payload or EventType
    minimumBookingNotice: eventType.minimumBookingNotice ?? 60,
    beforeEventBuffer: eventType.beforeEventBuffer ?? undefined, // Send if defined
    afterEventBuffer: eventType.afterEventBuffer ?? undefined, // Send if defined
    disableGuests: true, // Default from working payload
    slotInterval: eventType.slotInterval ?? 30, // Default from working payload
    confirmationPolicy: defaultConfirmationPolicy, // Default from working payload
    color: defaultColor, // Default from working payload
    seats: defaultSeats, // Default from working payload, includes seatsPerTimeSlot
    customName: `Dibs: ${eventType.name} between {Organiser} and {Scheduler}`, // Default format
    useDestinationCalendarEmail: true, // Default from working payload
    hideCalendarEventDetails: false, // Default from working payload
    // Removed metadata mapping for discountPercentage
    metadata: eventType.discountPercentage ? { dibsDiscountPercentage: eventType.discountPercentage } : undefined, // Example metadata usage
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