import { z } from 'zod'

// Base Calendly Types
export interface CalendlyStatus {
  connected: boolean
  schedulingUrl?: string
  expiresAt?: string
  isExpired?: boolean
  isMockData?: boolean
  eventTypes?: CalendlyEventType[]
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