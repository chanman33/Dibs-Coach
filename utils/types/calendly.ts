import { z } from 'zod'

// Base interfaces
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

export interface CalendlyScheduledEvent {
  uri: string
  name: string
  status: string
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

export interface CalendlyInvitee {
  uri: string
  email: string
  name: string
  status: string
  questions_and_answers: Array<{
    question: string
    answer: string
  }>
  timezone: string
  event: string
  created_at: string
  updated_at: string
  canceled: boolean
  cancellation: {
    canceled_by: string
    reason: string
  } | null
}

export interface CalendlyAvailabilitySchedule {
  resource: {
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
}

export interface CalendlyBusyTime {
  resource: {
    uri: string
    user: string
    start_time: string
    end_time: string
    calendar_event_details?: {
      external_id: string
      title: string
    }
  }
}

export interface CalendlyAvailableTime {
  status: string
  start_time: string
  invitees_remaining: number
}

export interface CalendlyUser {
  uri: string
  name: string
  email: string
  scheduling_url: string
  timezone: string
}

export interface CalendlyConfig {
  accessToken: string
  refreshToken: string
  headers: {
    Authorization: string
    'Content-Type': string
  }
}

export const CalendlyConfigSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  headers: z.object({
    Authorization: z.string(),
    'Content-Type': z.string()
  })
}).nullable()

export type CalendlyConfigValidated = z.infer<typeof CalendlyConfigSchema>

export interface BookingData {
  eventTypeUrl: string
  scheduledTime: string
  inviteeEmail: string
  eventUri: string
  coachName: string
  userId: string
}

// Zod Schemas for runtime validation
export const CalendlyEventSchema = z.object({
  data: z.object({
    event: z.string(),
    payload: z.object({
      event: z.object({
        start_time: z.string(),
        end_time: z.string(),
        name: z.string(),
        event_type: z.string(),
        uri: z.string(),
      }),
      invitee: z.object({
        email: z.string().email(),
      }),
    }),
  }),
})

export const CalendlyEventTypeSchema = z.object({
  uri: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  duration: z.number(),
  type: z.string(),
  slug: z.string(),
  color: z.string(),
  active: z.boolean(),
  scheduling_url: z.string(),
})

export const CalendlyScheduledEventSchema = z.object({
  uri: z.string(),
  name: z.string(),
  status: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  event_type: z.string(),
  location: z.string(),
  invitees_counter: z.object({
    active: z.number(),
    limit: z.number(),
  }),
  event_guests: z.array(z.object({
    email: z.string().email(),
    first_name: z.string(),
    last_name: z.string(),
  })),
})

export const CalendlyInviteeSchema = z.object({
  uri: z.string(),
  email: z.string().email(),
  name: z.string(),
  status: z.string(),
  questions_and_answers: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
  timezone: z.string(),
  event: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  canceled: z.boolean(),
  cancellation: z.object({
    canceled_by: z.string(),
    reason: z.string(),
  }).nullable(),
})

export type CalendlyEvent = z.infer<typeof CalendlyEventSchema>
export type CalendlyEventTypeValidated = z.infer<typeof CalendlyEventTypeSchema>
export type CalendlyScheduledEventValidated = z.infer<typeof CalendlyScheduledEventSchema>
export type CalendlyInviteeValidated = z.infer<typeof CalendlyInviteeSchema> 