import { format } from 'date-fns'
import { env } from '@/lib/env'

interface CreateOneOffEventTypeParams {
  name: string
  hostUserId: string
  startTime: Date
  endTime: Date
  durationMinutes: number
  timezone: string
}

export async function createOneOffEventType({
  name,
  hostUserId,
  startTime,
  endTime,
  durationMinutes,
  timezone
}: CreateOneOffEventTypeParams) {
  try {
    if (!env.CALENDLY_WEBHOOK_SIGNING_KEY) {
      throw new Error('Calendly webhook signing key not configured')
    }

    const response = await fetch('https://api.calendly.com/one_off_event_types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.CALENDLY_WEBHOOK_SIGNING_KEY}`
      },
      body: JSON.stringify({
        name,
        host: `https://api.calendly.com/users/${hostUserId}`,
        duration: durationMinutes,
        timezone,
        date_setting: {
          type: 'date_range',
          start_date: format(startTime, 'yyyy-MM-dd'),
          end_date: format(endTime, 'yyyy-MM-dd')
        },
        location: {
          kind: 'custom',
          location: 'Virtual Meeting',
          additional_info: 'Meeting link will be provided before the session'
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create Calendly event type')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[CALENDLY_API_ERROR]', error)
    throw error
  }
}

/**
 * Creates a single-use scheduling link for a Calendly event type
 */
interface CreateSchedulingLinkParams {
  eventTypeId: string
}

export async function createSingleUseSchedulingLink({
  eventTypeId
}: CreateSchedulingLinkParams) {
  try {
    if (!env.CALENDLY_WEBHOOK_SIGNING_KEY) {
      throw new Error('Calendly webhook signing key not configured')
    }

    const response = await fetch('https://api.calendly.com/scheduling_links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.CALENDLY_WEBHOOK_SIGNING_KEY}`
      },
      body: JSON.stringify({
        max_event_count: 1,
        owner: `https://api.calendly.com/event_types/${eventTypeId}`,
        owner_type: 'EventType'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create scheduling link')
    }

    const data = await response.json()
    return data.resource
  } catch (error) {
    console.error('[CALENDLY_API_ERROR]', error)
    throw error
  }
}

