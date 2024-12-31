import { auth } from '@clerk/nextjs/server'

const CALENDLY_API_BASE = 'https://api.calendly.com/v2'

interface CalendlyConfig {
  headers: {
    Authorization: string
    'Content-Type': string
  }
}

export const getCalendlyConfig = (): CalendlyConfig => ({
  headers: {
    Authorization: `Bearer ${process.env.CALENDLY_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
})

export async function getAvailableSlots(coachCalendlyUrl: string, startTime: string, endTime: string) {
  const config = getCalendlyConfig()
  
  try {
    const response = await fetch(
      `${CALENDLY_API_BASE}/scheduled_events/available_times?` +
      `user=${coachCalendlyUrl}&` +
      `start_time=${startTime}&` +
      `end_time=${endTime}`,
      { headers: config.headers }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch available slots')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching available slots:', error)
    throw error
  }
}

export async function createScheduledEvent(eventTypeUrl: string, data: any) {
  const config = getCalendlyConfig()
  
  try {
    const response = await fetch(`${CALENDLY_API_BASE}/scheduled_events`, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify({
        event_type_url: eventTypeUrl,
        ...data
      })
    })

    if (!response.ok) {
      throw new Error('Failed to schedule event')
    }

    return await response.json()
  } catch (error) {
    console.error('Error scheduling event:', error)
    throw error
  }
}

interface CalendlyEvent {
  data: {
    event: string
    payload: {
      event: {
        start_time: string
        end_time: string
        name: string
        event_type: string
      }
    }
  }
}

export function handleCalendlyEvent(e: CalendlyEvent) {
  if (e.data.event === 'calendly.event_scheduled') {
    return {
      startTime: e.data.payload.event.start_time,
      endTime: e.data.payload.event.end_time,
      eventName: e.data.payload.event.name,
      eventType: e.data.payload.event.event_type
    }
  }
  return null
} 