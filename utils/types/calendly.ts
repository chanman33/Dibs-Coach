import { z } from 'zod'

// Session Status Enum (matching Prisma schema)
export const SessionStatus = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
} as const

export type SessionStatus = typeof SessionStatus[keyof typeof SessionStatus]

// Error Handling Types
export interface CalendlyError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export const CalendlyErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional()
})

export type ApiResponse<T> = {
  data: T
  error: null
} | {
  data: null
  error: CalendlyError
}

// Base Schemas
export const DateTimeSchema = z.string().datetime()
export const UUIDSchema = z.string().uuid()
export const URISchema = z.string().url()
export const EmailSchema = z.string().email()
export const TimezoneSchema = z.string().regex(/^[A-Za-z]+\/[A-Za-z_]+$/)

// Integration Types
export const CalendlyIntegrationSchema = z.object({
  userDbId: z.number(),
  accessToken: z.string(),
  refreshToken: z.string(),
  scope: z.string(),
  organizationUrl: URISchema,
  schedulingUrl: URISchema,
  expiresAt: DateTimeSchema
})

export type CalendlyIntegration = z.infer<typeof CalendlyIntegrationSchema>

// Invitee Types
export interface CalendlyInvitee {
  uri: string
  email: string
  name: string
  status: SessionStatus
  timezone: string
  event: string
  questions_and_answers: Array<{
    question: string
    answer: string
  }>
  created_at: string
  updated_at: string
  canceled: boolean
  cancellation: {
    reason: string
    canceled_by: string
  } | null
}

export const CalendlyInviteeSchema = z.object({
  uri: URISchema,
  email: EmailSchema,
  name: z.string(),
  status: z.enum([
    SessionStatus.SCHEDULED,
    SessionStatus.COMPLETED,
    SessionStatus.CANCELLED,
    SessionStatus.NO_SHOW
  ]),
  timezone: TimezoneSchema,
  event: URISchema,
  questions_and_answers: z.array(z.object({
    question: z.string(),
    answer: z.string()
  })),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
  canceled: z.boolean(),
  cancellation: z.object({
    reason: z.string(),
    canceled_by: z.string()
  }).nullable()
})

// No-Show Types
export interface NoShowRequest {
  inviteeUri: string
}

export const NoShowRequestSchema = z.object({
  inviteeUri: URISchema
})

// Webhook Types
export const WebhookEventType = {
  INVITEE_CREATED: 'invitee.created',
  INVITEE_CANCELED: 'invitee.canceled',
  INVITEE_RESCHEDULED: 'invitee.rescheduled'
} as const

export type WebhookEventType = typeof WebhookEventType[keyof typeof WebhookEventType]

export interface WebhookEvent {
  event: WebhookEventType
  created_at: string
  payload: {
    event_type: {
      uri: string
      name: string
    }
    invitee: CalendlyInvitee
    scheduled_event: {
      uri: string
      name: string
      status: 'active' | 'canceled'
      start_time: string
      end_time: string
    }
  }
}

export const WebhookEventSchema = z.object({
  event: z.enum([
    WebhookEventType.INVITEE_CREATED,
    WebhookEventType.INVITEE_CANCELED,
    WebhookEventType.INVITEE_RESCHEDULED
  ]),
  created_at: DateTimeSchema,
  payload: z.object({
    event_type: z.object({
      uri: URISchema,
      name: z.string()
    }),
    invitee: CalendlyInviteeSchema,
    scheduled_event: z.object({
      uri: URISchema,
      name: z.string(),
      status: z.enum(['active', 'canceled']),
      start_time: DateTimeSchema,
      end_time: DateTimeSchema
    })
  })
})

export interface WebhookStorage {
  id: number
  event_type: string
  payload: Record<string, unknown>
  processed: boolean
  created_at: string
  updated_at: string
}

export const WebhookStorageSchema = z.object({
  id: z.number(),
  event_type: z.string(),
  payload: z.record(z.unknown()),
  processed: z.boolean(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema
})

// Availability Schedule Types
export interface CalendlyAvailabilitySchedule {
  uri: string
  name: string
  user: string
  default: boolean
  rules: Array<{
    type: string
    wday: number
    start_time: string
    end_time: string
  }>
  intervals: Array<{
    from: string
    to: string
  }>
}

export const CalendlyAvailabilityScheduleSchema = z.object({
  uri: URISchema,
  name: z.string(),
  user: URISchema,
  default: z.boolean(),
  rules: z.array(z.object({
    type: z.string(),
    wday: z.number().min(0).max(6),
    start_time: z.string(),
    end_time: z.string()
  })),
  intervals: z.array(z.object({
    from: DateTimeSchema,
    to: DateTimeSchema
  }))
})

// Query Schemas
export const AvailabilityScheduleQuerySchema = z.object({
  userUri: URISchema
})

// Busy Times Types
export interface CalendlyBusyTime {
  uri: string
  user: string
  start_time: string
  end_time: string
  calendar_event_details?: {
    external_id: string
    title: string
  }
}

export const CalendlyBusyTimeSchema = z.object({
  uri: URISchema,
  user: URISchema,
  start_time: DateTimeSchema,
  end_time: DateTimeSchema,
  calendar_event_details: z.object({
    external_id: z.string(),
    title: z.string()
  }).optional()
})

export const BusyTimesQuerySchema = z.object({
  userUri: URISchema,
  startTime: DateTimeSchema,
  endTime: DateTimeSchema
})

// Available Times Types
export interface CalendlyAvailableTime {
  status: 'available' | 'unavailable'
  start_time: string
  invitees_remaining: number
}

export const CalendlyAvailableTimeSchema = z.object({
  status: z.enum(['available', 'unavailable']),
  start_time: DateTimeSchema,
  invitees_remaining: z.number()
})

export const FreeTimesQuerySchema = z.object({
  eventUri: URISchema,
  startTime: DateTimeSchema,
  endTime: DateTimeSchema
})

// Scheduled Event Types
export interface CalendlyScheduledEvent {
  uri: string
  name: string
  status: SessionStatus
  start_time: string
  end_time: string
  event_type: string
  location: string
  invitees_counter: {
    active: number
    limit: number
  }
  event_guests: Array<{
    email: string
    first_name: string
    last_name: string
  }>
}

export const CalendlyScheduledEventSchema = z.object({
  uri: URISchema,
  name: z.string(),
  status: z.enum([
    SessionStatus.SCHEDULED,
    SessionStatus.COMPLETED,
    SessionStatus.CANCELLED,
    SessionStatus.NO_SHOW
  ]),
  start_time: DateTimeSchema,
  end_time: DateTimeSchema,
  event_type: URISchema,
  location: z.string(),
  invitees_counter: z.object({
    active: z.number(),
    limit: z.number()
  }),
  event_guests: z.array(z.object({
    email: EmailSchema,
    first_name: z.string(),
    last_name: z.string()
  }))
})

// Event Types
export interface CalendlyEventType {
  uri: string
  name: string
  description: string | null
  duration: number
  type: string
  slug: string
  color: string
  active: boolean
  scheduling_url: string
}

export const CalendlyEventTypeSchema = z.object({
  uri: URISchema,
  name: z.string().min(1),
  description: z.string().nullable(),
  duration: z.number().positive(),
  type: z.string(),
  slug: z.string(),
  color: z.string(),
  active: z.boolean(),
  scheduling_url: URISchema
})

// Event Query Types
export interface EventTypesQuery {
  count?: number
  pageToken?: string
}

export const EventTypesQuerySchema = z.object({
  count: z.number().optional(),
  pageToken: z.string().optional()
})

export interface EventCancellation {
  uuid: string
  reason: string
}

export const EventCancellationSchema = z.object({
  uuid: UUIDSchema,
  reason: z.string().min(1)
})

// Scheduled Events Query Types
export interface ScheduledEventsQuery {
  count?: number
  pageToken?: string
  status?: SessionStatus
  minStartTime?: string
  maxStartTime?: string
}

export const ScheduledEventsQuerySchema = z.object({
  count: z.number().optional(),
  pageToken: z.string().optional(),
  status: z.enum([
    SessionStatus.SCHEDULED,
    SessionStatus.COMPLETED,
    SessionStatus.CANCELLED,
    SessionStatus.NO_SHOW
  ]).optional(),
  minStartTime: DateTimeSchema.optional(),
  maxStartTime: DateTimeSchema.optional()
})

export interface CalendlyConfig {
  accessToken: string
  refreshToken: string
}

export interface BookingData {
  eventTypeUrl: string
  schedulingUrl?: string
  scheduledTime: string
  inviteeEmail: string
}

export const AvailabilityQuerySchema = z.object({
  startTime: DateTimeSchema,
  endTime: DateTimeSchema,
  timezone: TimezoneSchema
}) 