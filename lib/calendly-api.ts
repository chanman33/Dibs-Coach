import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CalendlyConfig, CalendlyEvent, BookingData } from '@/utils/types/calendly'

export const CALENDLY_API_BASE = 'https://api.calendly.com/v2'

async function getCalendlyToken(): Promise<string> {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Unauthorized')
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
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )

  const { data: integration, error } = await supabase
    .from('calendly_integration')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !integration) {
    throw new Error('Calendly integration not found')
  }

  // Check if token needs refresh
  if (new Date(integration.expires_at) <= new Date()) {
    const refreshResponse = await fetch('https://auth.calendly.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.CALENDLY_CLIENT_ID!,
        client_secret: process.env.CALENDLY_CLIENT_SECRET!,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    if (!refreshResponse.ok) {
      throw new Error('Failed to refresh token')
    }

    const refreshData = await refreshResponse.json()

    // Update tokens in database
    const { error: updateError } = await supabase
      .from('calendly_integration')
      .update({
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token,
        expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      throw new Error('Failed to update tokens')
    }

    return refreshData.access_token
  }

  return integration.access_token
}

export const getCalendlyConfig = async (): Promise<CalendlyConfig> => {
  const token = await getCalendlyToken()
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
}

export async function getAvailableSlots(coachCalendlyUrl: string, startTime: string, endTime: string) {
  const config = await getCalendlyConfig()
  
  try {
    const response = await fetch(
      `${CALENDLY_API_BASE}/scheduled_events/available_times?` +
      `user=${coachCalendlyUrl}&` +
      `start_time=${startTime}&` +
      `end_time=${endTime}`,
      { headers: config.headers }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to fetch slots:', await response.text())
      throw new Error('Failed to fetch available slots')
    }

    return await response.json()
  } catch (error) {
    console.error('[CALENDLY_ERROR] Error fetching slots:', error)
    throw error
  }
}

export async function createScheduledEvent(data: BookingData) {
  const config = await getCalendlyConfig()
  
  try {
    const response = await fetch(`${CALENDLY_API_BASE}/scheduled_events`, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify({
        event_type_url: data.eventTypeUrl,
        start_time: data.scheduledTime,
        email: data.inviteeEmail,
      })
    })

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to schedule:', await response.text())
      throw new Error('Failed to schedule event')
    }

    return await response.json()
  } catch (error) {
    console.error('[CALENDLY_ERROR] Error scheduling:', error)
    throw error
  }
}

export async function getOrganizationMemberships() {
  const config = await getCalendlyConfig()
  
  try {
    const response = await fetch(
      `${CALENDLY_API_BASE}/organization_memberships`,
      { headers: config.headers }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to fetch organization memberships:', await response.text())
      throw new Error('Failed to fetch organization memberships')
    }

    return await response.json()
  } catch (error) {
    console.error('[CALENDLY_ERROR] Error fetching organization memberships:', error)
    throw error
  }
}

export async function getUserAvailabilitySchedules(userUri: string) {
  const config = await getCalendlyConfig()
  
  try {
    const response = await fetch(
      `${CALENDLY_API_BASE}/user_availability_schedules?user=${userUri}`,
      { headers: config.headers }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to fetch availability schedules:', await response.text())
      throw new Error('Failed to fetch availability schedules')
    }

    return await response.json()
  } catch (error) {
    console.error('[CALENDLY_ERROR] Error fetching availability schedules:', error)
    throw error
  }
}

export async function getUserBusyTimes(userUri: string, startTime: string, endTime: string) {
  const config = await getCalendlyConfig()
  
  try {
    const response = await fetch(
      `${CALENDLY_API_BASE}/user_busy_times?` +
      `user=${userUri}&` +
      `start_time=${startTime}&` +
      `end_time=${endTime}`,
      { headers: config.headers }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to fetch busy times:', await response.text())
      throw new Error('Failed to fetch busy times')
    }

    return await response.json()
  } catch (error) {
    console.error('[CALENDLY_ERROR] Error fetching busy times:', error)
    throw error
  }
}

export async function createWebhookSubscription(webhookUrl: string, scope: 'user' | 'organization' = 'user') {
  const config = await getCalendlyConfig()
  const orgMemberships = await getOrganizationMemberships()
  const organization = orgMemberships.collection[0]?.organization.uri
  
  if (!organization) {
    throw new Error('No organization found')
  }

  try {
    const response = await fetch(`${CALENDLY_API_BASE}/webhook_subscriptions`, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify({
        url: webhookUrl,
        events: ['invitee.created', 'invitee.canceled', 'invitee.rescheduled'],
        organization,
        scope,
      })
    })

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to create webhook:', await response.text())
      throw new Error('Failed to create webhook subscription')
    }

    return await response.json()
  } catch (error) {
    console.error('[CALENDLY_ERROR] Error creating webhook:', error)
    throw error
  }
}

export async function listWebhookSubscriptions() {
  const config = await getCalendlyConfig()
  
  try {
    const response = await fetch(
      `${CALENDLY_API_BASE}/webhook_subscriptions`,
      { headers: config.headers }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to fetch webhooks:', await response.text())
      throw new Error('Failed to fetch webhook subscriptions')
    }

    return await response.json()
  } catch (error) {
    console.error('[CALENDLY_ERROR] Error fetching webhooks:', error)
    throw error
  }
}

export async function deleteWebhookSubscription(webhookUuid: string) {
  const config = await getCalendlyConfig()
  
  try {
    const response = await fetch(
      `${CALENDLY_API_BASE}/webhook_subscriptions/${webhookUuid}`,
      { 
        method: 'DELETE',
        headers: config.headers 
      }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to delete webhook:', await response.text())
      throw new Error('Failed to delete webhook subscription')
    }

    return true
  } catch (error) {
    console.error('[CALENDLY_ERROR] Error deleting webhook:', error)
    throw error
  }
}

export interface CalendlyEventType {
  uri: string
  name: string
  scheduling_url: string
  duration: number
  kind: string
  pooling_type: string
  type: string
  color: string
  active: boolean
  description_plain: string
  description_html: string
}

export interface CalendlyAvailableTime {
  start_time: string
  invitee_count: number
  status: string
}

export interface CalendlyEventTypeMember {
  uri: string
  name: string
  email: string
}

export async function getEventTypes() {
  const config = await getCalendlyConfig()
  
  try {
    const response = await fetch(
      `${CALENDLY_API_BASE}/event_types`,
      { headers: config.headers }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to fetch event types:', await response.text())
      throw new Error('Failed to fetch event types')
    }

    const data = await response.json()
    return data.collection as CalendlyEventType[]
  } catch (error) {
    console.error('[CALENDLY_ERROR] Error fetching event types:', error)
    throw error
  }
}

export async function getEventTypeAvailability(
  eventTypeUri: string, 
  startTime: string, 
  endTime: string
) {
  const config = await getCalendlyConfig()
  
  try {
    const response = await fetch(
      `${CALENDLY_API_BASE}/event_type_available_times?${new URLSearchParams({
        event_type: eventTypeUri,
        start_time: startTime,
        end_time: endTime
      })}`,
      { headers: config.headers }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to fetch availability:', await response.text())
      throw new Error('Failed to fetch event type availability')
    }

    const data = await response.json()
    return data.collection as CalendlyAvailableTime[]
  } catch (error) {
    console.error('[CALENDLY_ERROR] Error fetching availability:', error)
    throw error
  }
}

export async function getEventTypeHosts(eventTypeUri: string) {
  const config = await getCalendlyConfig()
  
  try {
    const response = await fetch(
      `${CALENDLY_API_BASE}/event_type_memberships?${new URLSearchParams({
        event_type: eventTypeUri
      })}`,
      { headers: config.headers }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to fetch hosts:', await response.text())
      throw new Error('Failed to fetch event type hosts')
    }

    const data = await response.json()
    return data.collection.map(
      (membership: any) => membership.member
    ) as CalendlyEventTypeMember[]
  } catch (error) {
    console.error('[CALENDLY_ERROR] Error fetching hosts:', error)
    throw error
  }
} 