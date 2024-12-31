import { z } from 'zod'

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

export type CalendlyEvent = z.infer<typeof CalendlyEventSchema>

export interface CalendlyConfig {
  headers: {
    Authorization: string
    'Content-Type': string
  }
}

export interface BookingData {
  eventTypeUrl: string
  scheduledTime: string
  inviteeEmail: string
  eventUri: string
  coachName: string
  userId: string
} 