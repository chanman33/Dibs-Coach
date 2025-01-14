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

export interface CalendlyAvailableTime {
  status: string
  start_time: string
  invitees_remaining: number
}

export interface CalendlyBusyTime {
  start_time: string
  end_time: string
}

export interface CalendlyAvailabilitySchedule {
  uri: string
  name: string
  timezone: string
  rules: Array<{
    type: string
    wday: number
    start_time: string
    end_time: string
  }>
}

export interface CalendlyUser {
  uri: string
  name: string
  email: string
  scheduling_url: string
  timezone: string
} 