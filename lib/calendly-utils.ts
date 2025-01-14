import { format, parseISO } from 'date-fns'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { 
  CalendlyEventType, 
  CalendlyScheduledEvent,
  CalendlyInvitee,
  CalendlyAvailableTime,
  CalendlyEventTypeSchema,
  CalendlyScheduledEventSchema,
  CalendlyInviteeSchema
} from '@/utils/types/calendly'

/**
 * Format a date string to a time string (e.g., "2:30 PM")
 */
export function formatTime(dateString: string): string {
  return format(parseISO(dateString), 'h:mm a')
}

/**
 * Check if a user is authenticated and has valid Calendly tokens
 */
export async function checkCalendlyAuth() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Not authenticated')
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: user, error } = await supabase
    .from('User')
    .select('calendlyAccessToken, calendlyRefreshToken')
    .eq('userId', userId)
    .single()

  if (error || !user?.calendlyAccessToken) {
    throw new Error('Calendly not connected')
  }

  return user
}

/**
 * Format a scheduled event with additional date/time fields
 */
export function formatEventDateTime(event: CalendlyScheduledEvent) {
  return {
    ...event,
    date: format(parseISO(event.start_time), 'PPP'),
    start_time_formatted: formatTime(event.start_time),
    end_time_formatted: formatTime(event.end_time),
  }
}

/**
 * Format an event type with additional date fields
 */
export function formatEventType(eventType: CalendlyEventType & { updated_at: string }) {
  return {
    ...eventType,
    last_updated: format(parseISO(eventType.updated_at), 'PPP'),
  }
}

/**
 * Format an invitee with additional date/time fields
 */
export function formatInvitee(invitee: CalendlyInvitee) {
  return {
    ...invitee,
    scheduled_at: format(parseISO(invitee.created_at), 'PPP p'),
    updated_at_formatted: formatTime(invitee.updated_at),
  }
}

/**
 * Format an available time slot with additional date/time fields
 */
export function formatAvailableTime(availableTime: CalendlyAvailableTime) {
  return {
    ...availableTime,
    date: format(parseISO(availableTime.start_time), 'PPP'),
    time_formatted: formatTime(availableTime.start_time),
  }
}

/**
 * Format a date range for display (e.g., "Mar 1 - Mar 7, 2024")
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  const start = format(startDate, 'MMM d')
  const end = format(endDate, 'MMM d, yyyy')
  return `${start} - ${end}`
}

/**
 * Check if a time slot is available
 */
export function isTimeSlotAvailable(
  time: CalendlyAvailableTime,
  busyTimes: Array<{ start_time: string; end_time: string }>
): boolean {
  const timeStart = new Date(time.start_time).getTime()
  return !busyTimes.some(
    busy => 
      timeStart >= new Date(busy.start_time).getTime() && 
      timeStart < new Date(busy.end_time).getTime()
  )
}

/**
 * Group available times by date
 */
export function groupTimesByDate(times: CalendlyAvailableTime[]): Record<string, CalendlyAvailableTime[]> {
  return times.reduce((groups, time) => {
    const date = format(parseISO(time.start_time), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(time)
    return groups
  }, {} as Record<string, CalendlyAvailableTime[]>)
} 