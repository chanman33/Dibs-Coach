import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import type {
  CalendlyEventType,
  CalendlyScheduledEvent,
  CalendlyInvitee,
  CalendlyAvailableTime,
  CalendlyAvailabilitySchedule,
  CalendlyBusyTime,
  CalendlyConfig,
  CalendlyEventTypeSchema,
  CalendlyScheduledEventSchema,
  CalendlyInviteeSchema
} from '@/utils/types/calendly'

interface CalendlyUser {
  uri: string
  name: string
  email: string
  scheduling_url: string
  timezone: string
}

export class CalendlyService {
  private baseUrl: string
  private authBaseUrl: string
  private clientId: string
  private clientSecret: string
  private config: CalendlyConfig | null = null

  constructor() {
    this.baseUrl = process.env.CALENDLY_API_BASE_URL || 'https://api.calendly.com'
    this.authBaseUrl = process.env.CALENDLY_AUTH_BASE_URL || 'https://auth.calendly.com'
    this.clientId = process.env.CALENDLY_CLIENT_ID || ''
    this.clientSecret = process.env.CALENDLY_CLIENT_SECRET || ''
  }

  private async getConfig(): Promise<CalendlyConfig> {
    if (this.config) return this.config

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

    const { userId } = await auth()
    if (!userId) throw new Error('User not authenticated')

    const { data: user, error } = await supabase
      .from('User')
      .select('calendlyAccessToken, calendlyRefreshToken')
      .eq('userId', userId)
      .single()

    if (error || !user) {
      throw new Error('Failed to get Calendly tokens')
    }

    this.config = {
      accessToken: user.calendlyAccessToken,
      refreshToken: user.calendlyRefreshToken,
    }

    return this.config
  }

  private async refreshToken(refreshToken: string) {
    const response = await fetch(`${this.authBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const data = await response.json()
    
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

    const { userId } = await auth()
    if (!userId) throw new Error('User not authenticated')

    await supabase
      .from('User')
      .update({
        calendlyAccessToken: data.access_token,
        calendlyRefreshToken: data.refresh_token,
        updatedAt: new Date().toISOString(),
      })
      .eq('userId', userId)

    this.config = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    }

    return this.config
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const config = await this.getConfig()
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (response.status === 401) {
      const newConfig = await this.refreshToken(config.refreshToken)
      return this.fetch<T>(endpoint, options)
    }

    if (!response.ok) {
      throw new Error(`Calendly API error: ${await response.text()}`)
    }

    return response.json()
  }

  async getUserInfo(): Promise<CalendlyUser> {
    const { resource } = await this.fetch<{ resource: CalendlyUser }>('/users/me')
    return resource
  }

  async getEventTypes(count = 10, pageToken?: string): Promise<CalendlyEventType[]> {
    const user = await this.getUserInfo()
    let url = `/event_types?count=${count}&user=${user.uri}`
    if (pageToken) url += `&page_token=${pageToken}`

    const { collection } = await this.fetch<{ collection: CalendlyEventType[] }>(url)
    return collection
  }

  async getScheduledEvents(params: {
    count?: number
    pageToken?: string
    status?: string
    minStartTime?: string
    maxStartTime?: string
  } = {}): Promise<CalendlyScheduledEvent[]> {
    const user = await this.getUserInfo()
    const { count = 10, pageToken, status, minStartTime, maxStartTime } = params

    let url = `/scheduled_events?count=${count}&user=${user.uri}`
    if (pageToken) url += `&page_token=${pageToken}`
    if (status) url += `&status=${status}`
    if (minStartTime) url += `&min_start_time=${minStartTime}`
    if (maxStartTime) url += `&max_start_time=${maxStartTime}`

    const { collection } = await this.fetch<{ collection: CalendlyScheduledEvent[] }>(url)
    return collection
  }

  async getScheduledEvent(uuid: string): Promise<CalendlyScheduledEvent> {
    const { resource } = await this.fetch<{ resource: CalendlyScheduledEvent }>(
      `/scheduled_events/${uuid}`
    )
    return resource
  }

  async getEventInvitees(eventUuid: string, count = 10, pageToken?: string): Promise<CalendlyInvitee[]> {
    let url = `/scheduled_events/${eventUuid}/invitees?count=${count}`
    if (pageToken) url += `&page_token=${pageToken}`

    const { collection } = await this.fetch<{ collection: CalendlyInvitee[] }>(url)
    return collection
  }

  async cancelEvent(uuid: string, reason: string): Promise<void> {
    await this.fetch(`/scheduled_events/${uuid}/cancellation`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  async getUserEventType(uuid: string): Promise<CalendlyEventType> {
    const { resource } = await this.fetch<{ resource: CalendlyEventType }>(
      `/event_types/${uuid}`
    )
    return resource
  }

  async getEventTypeAvailableTimes(params: {
    eventUri: string
    startTime: string
    endTime: string
  }): Promise<CalendlyAvailableTime[]> {
    const { eventUri, startTime, endTime } = params
    const queryParams = new URLSearchParams({
      start_time: startTime,
      end_time: endTime,
      event_type: eventUri,
    })

    const { collection } = await this.fetch<{ collection: CalendlyAvailableTime[] }>(
      `/event_type_available_times?${queryParams}`
    )
    return collection
  }

  async getUserBusyTimes(params: {
    userUri: string
    startTime: string
    endTime: string
  }): Promise<CalendlyBusyTime[]> {
    const { userUri, startTime, endTime } = params
    const queryParams = new URLSearchParams({
      user: userUri,
      start_time: startTime,
      end_time: endTime,
    })

    const { collection } = await this.fetch<{ collection: CalendlyBusyTime[] }>(
      `/user_busy_times?${queryParams}`
    )
    return collection
  }

  async getAvailabilitySchedules(userUri: string): Promise<CalendlyAvailabilitySchedule[]> {
    const queryParams = new URLSearchParams({ user: userUri })
    const { collection } = await this.fetch<{ collection: CalendlyAvailabilitySchedule[] }>(
      `/user_availability_schedules?${queryParams}`
    )
    return collection
  }

  async getUser(userUri: string): Promise<CalendlyUser> {
    const { resource } = await this.fetch<{ resource: CalendlyUser }>(
      `/users/${userUri}`
    )
    return resource
  }

  async markInviteeAsNoShow(inviteeUri: string): Promise<void> {
    await this.fetch('/invitee_no_shows', {
      method: 'POST',
      body: JSON.stringify({ invitee: inviteeUri }),
    })
  }

  async undoInviteeNoShow(inviteeUuid: string): Promise<void> {
    await this.fetch(`/invitee_no_shows/${inviteeUuid}`, {
      method: 'DELETE',
    })
  }

  protected async handleError(error: unknown): Promise<never> {
    if (error instanceof Error) {
      console.error('[CALENDLY_ERROR]', {
        message: error.message,
        stack: error.stack,
      })
      throw error
    }

    console.error('[CALENDLY_UNKNOWN_ERROR]', error)
    throw new Error('An unknown error occurred while calling Calendly API')
  }
} 