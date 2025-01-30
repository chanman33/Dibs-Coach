import { z } from 'zod'
import { Session } from '@prisma/client'

// Base Calendly Types
export type CalendlyStatus = {
  connected: boolean
  schedulingUrl?: string
  expiresAt?: string
  isExpired?: boolean
  isMockData?: boolean
  eventTypes?: CalendlyEventType[]
  needsReconnect?: boolean
  error?: string
  userUri?: string
}

export interface CalendlyEventType {
  uri: string
  name: string
  duration: number
  url: string
  updated_at: string
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
    event_type: CalendlyEventType
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
  duration: z.number(),
  url: z.string(),
  updated_at: z.string()
})

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

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  type: 'session' | 'busy' | 'availability'
  resource: ExtendedSession | CalendlyBusyTime | CalendlyAvailabilitySchedule
}

export interface ExtendedSession {
  id: number
  durationMinutes: number
  status: string
  calendlyEventId: string
  startTime: string
  endTime: string
  createdAt: string
  userRole: 'coach' | 'mentee'
  otherParty: {
    id: number
    firstName: string | null
    lastName: string | null
    email: string | null
  }
} 