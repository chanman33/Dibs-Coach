import { z } from 'zod'
import { Session } from '@prisma/client'
import { SessionRate } from './session'

// Base Calendly Types
export interface CalendlyStatus {
  connected: boolean
  message?: string
  schedulingUrl?: string
  expiresAt?: string
  isExpired?: boolean
  isMockData?: boolean
  eventTypes?: ICalendlyEventType[]
  needsReconnect?: boolean
  error?: string
  userUri?: string
}

export enum CalendlySessionType {
  FREE = 'FREE',
  PAID = 'PAID',
  PACKAGE = 'PACKAGE'
}

export interface ICalendlyEventType {
  uri: string
  name: string
  description?: string
  duration: number
  type: string
  slug: string
  url: string
  active: boolean
  scheduling_url: string
  custom_questions?: any[]
  sessionType?: CalendlySessionType
  minimumDuration?: number
  maximumDuration?: number
  bufferBeforeMinutes?: number
  bufferAfterMinutes?: number
  availabilityRules?: {
    type: string
    interval?: number
    count?: number
    weekStart?: string
    weekDays?: string[]
  }[]
}

export interface CalendlyScheduledEvent {
  uri: string
  name: string
  start_time: string
  end_time: string
  event_type: string
  status: 'active' | 'canceled'
  invitee: CalendlyInvitee
}

export interface CalendlyInvitee {
  email: string
  name: string
  timezone: string
  created_at: string
  updated_at: string
  status: 'active' | 'canceled'
  questions_and_answers: Array<{
    question: string
    answer: string
  }>
}

export interface CalendlyAvailableTime {
  start_time: string
  status: 'available' | 'unavailable'
}

// Webhook Types
export enum WebhookEventType {
  INVITEE_CREATED = 'invitee.created',
  INVITEE_CANCELED = 'invitee.canceled',
  INVITEE_RESCHEDULED = 'invitee.rescheduled'
}

export interface WebhookEvent {
  event: WebhookEventType
  payload: {
    event_type: ICalendlyEventType
    invitee: CalendlyInvitee
    scheduled_event: CalendlyScheduledEvent
  }
}

export interface WebhookStorage extends WebhookEvent {
  id: number
  processed: boolean
  created_at: string
  updated_at: string
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null
  error: {
    code: string
    message: string
    details?: unknown
  } | null
}

// Zod Schemas
export const CalendlyEventTypeSchema = z.object({
  uri: z.string(),
  name: z.string(),
  description: z.string().optional(),
  duration: z.number(),
  type: z.string(),
  slug: z.string(),
  url: z.string(),
  active: z.boolean(),
  scheduling_url: z.string(),
  custom_questions: z.array(z.any()).optional(),
  sessionType: z.nativeEnum(CalendlySessionType).optional(),
  minimumDuration: z.number().optional(),
  maximumDuration: z.number().optional(),
  bufferBeforeMinutes: z.number().optional(),
  bufferAfterMinutes: z.number().optional(),
  availabilityRules: z.array(z.object({
    type: z.string(),
    interval: z.number().optional(),
    count: z.number().optional(),
    weekStart: z.string().optional(),
    weekDays: z.array(z.string()).optional(),
  })).optional(),
})

export type CalendlyEventType = z.infer<typeof CalendlyEventTypeSchema>

export const CalendlyInviteeSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  timezone: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  status: z.enum(['active', 'canceled']),
  questions_and_answers: z.array(z.object({
    question: z.string(),
    answer: z.string()
  }))
})

export const CalendlyScheduledEventSchema = z.object({
  uri: z.string(),
  name: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  event_type: z.string(),
  status: z.enum(['active', 'canceled']),
  invitee: CalendlyInviteeSchema
})

export const WebhookEventSchema = z.object({
  event: z.nativeEnum(WebhookEventType),
  payload: z.object({
    event_type: CalendlyEventTypeSchema,
    invitee: CalendlyInviteeSchema,
    scheduled_event: CalendlyScheduledEventSchema
  })
})

export interface TimeInterval {
  from: string
  to: string
}

export interface ScheduleRule {
  type: 'wday' | 'date'
  wday?: number
  date?: string
  intervals: TimeInterval[]
}

export interface CalendlyAvailabilitySchedule {
  id: number
  uri: string
  name: string
  timezone: string
  default: boolean
  active: boolean
  rules: ScheduleRule[]
}

export type CalendlyBusyTimeType = 'event' | 'busy_period'

export type CalendlyBusyTime = {
  uri: string
  start_time: string
  end_time: string
  type: CalendlyBusyTimeType
  calendar_type?: string
  event_name?: string
  event_url?: string
  calendar_name?: string
}

export type BusyTimeFilters = {
  type?: CalendlyBusyTimeType
  startDate: Date
  endDate: Date
  calendar?: string
}

export type CalendarEventType = 'session' | 'busy' | 'availability'

export interface AvailabilityEventResource {
  type: 'availability'
  timezone: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  type: 'session' | 'busy' | 'availability'
  resource: ExtendedSession | CalendlyBusyTime | CalendlyAvailabilitySchedule | AvailabilityEventResource
}

export interface ExtendedSession {
  id?: number
  ulid: string
  durationMinutes: number
  status: string
  calendlyEventId?: string
  startTime: string
  endTime: string
  createdAt?: string
  userRole: 'coach' | 'mentee'
  otherParty: {
    id?: number
    ulid: string
    firstName: string | null
    lastName: string | null
    email: string | null
    imageUrl: string | null
  }
}

// Event type mapping configuration
export const EventTypeMappingSchema = z.object({
  eventTypeUri: z.string(),
  sessionType: z.nativeEnum(CalendlySessionType),
  durationConstraints: z.object({
    minimum: z.number(),
    maximum: z.number(),
    default: z.number(),
  }),
  bufferTime: z.object({
    before: z.number(),
    after: z.number(),
  }),
})

export type EventTypeMapping = z.infer<typeof EventTypeMappingSchema>

// Event cancellation
export const EventCancellationSchema = z.object({
  uuid: z.string(),
  reason: z.string().optional()
})

export type EventCancellation = z.infer<typeof EventCancellationSchema>

// No-show request
export const NoShowRequestSchema = z.object({
  inviteeUri: z.string()
})

export type NoShowRequest = z.infer<typeof NoShowRequestSchema>

// Scheduled events query
export const ScheduledEventsQuerySchema = z.object({
  count: z.number().optional(),
  pageToken: z.string().optional(),
  status: z.enum(['active', 'canceled']).optional(),
  minStartTime: z.string().optional(),
  maxStartTime: z.string().optional()
})

export type ScheduledEventsQuery = z.infer<typeof ScheduledEventsQuerySchema> 