import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { CalendlyClient } from './calendly-client'
import type {
  CalendlyEventType,
  CalendlyScheduledEvent,
  CalendlyInvitee,
  CalendlyAvailableTime,
  CalendlyAvailabilitySchedule,
  CalendlyBusyTime,
  CalendlyConfig,
  BookingData
} from '@/utils/types/calendly'

export class CalendlyService {
  private client: CalendlyClient
  private config: CalendlyConfig | null = null

  constructor() {
    this.client = new CalendlyClient()
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

    // Update the client with the access token
    this.client = new CalendlyClient(user.calendlyAccessToken)

    return this.config
  }

  private async refreshToken(refreshToken: string) {
    const response = await fetch('https://auth.calendly.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.CALENDLY_CLIENT_ID!,
        client_secret: process.env.CALENDLY_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
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

    // Update the client with the new access token
    this.client = new CalendlyClient(data.access_token)

    return this.config
  }

  // User Methods
  async getUserInfo() {
    await this.getConfig()
    return this.client.getUser()
  }

  // Event Type Methods
  async getEventTypes(count = 10, pageToken?: string) {
    await this.getConfig()
    return this.client.getEventTypes()
  }

  async getUserEventType(uuid: string) {
    await this.getConfig()
    return this.client.request(`/event_types/${uuid}`)
  }

  // Scheduled Events Methods
  async getScheduledEvents(params: {
    count?: number
    pageToken?: string
    status?: string
    minStartTime?: string
    maxStartTime?: string
  } = {}) {
    await this.getConfig()
    const queryParams: Record<string, string> = {}
    if (params.count) queryParams.count = params.count.toString()
    if (params.pageToken) queryParams.pageToken = params.pageToken
    if (params.status) queryParams.status = params.status
    if (params.minStartTime) queryParams.minStartTime = params.minStartTime
    if (params.maxStartTime) queryParams.maxStartTime = params.maxStartTime
    return this.client.getScheduledEvents(queryParams)
  }

  async getScheduledEvent(uuid: string) {
    await this.getConfig()
    return this.client.request(`/scheduled_events/${uuid}`)
  }

  async cancelEvent(uuid: string, reason: string) {
    await this.getConfig()
    return this.client.request(`/scheduled_events/${uuid}/cancellation`, {
      method: 'POST',
      body: { reason }
    })
  }

  // Invitee Methods
  async getEventInvitees(eventUuid: string, count = 10, pageToken?: string) {
    await this.getConfig()
    return this.client.request(`/scheduled_events/${eventUuid}/invitees`, {
      method: 'GET'
    })
  }

  async markInviteeAsNoShow(inviteeUri: string) {
    await this.getConfig()
    return this.client.request('/invitee_no_shows', {
      method: 'POST',
      body: { invitee: inviteeUri }
    })
  }

  async undoInviteeNoShow(inviteeUuid: string) {
    await this.getConfig()
    return this.client.request(`/invitee_no_shows/${inviteeUuid}`, {
      method: 'DELETE'
    })
  }

  // Availability Methods
  async getAvailableSlots(coachCalendlyUrl: string, startTime: string, endTime: string) {
    await this.getConfig()
    return this.client.request(`/scheduled_events/available_times`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  async getUserAvailabilitySchedules(userUri: string) {
    await this.getConfig()
    return this.client.request(`/user_availability_schedules?user=${userUri}`)
  }

  async getUserBusyTimes(userUri: string, startTime: string, endTime: string) {
    await this.getConfig()
    const params = new URLSearchParams({
      user: userUri,
      start_time: startTime,
      end_time: endTime
    })
    return this.client.request(`/user_busy_times?${params}`)
  }

  async getEventTypeAvailableTimes(params: {
    eventUri: string
    startTime: string
    endTime: string
  }) {
    await this.getConfig()
    const queryParams = new URLSearchParams({
      event_type: params.eventUri,
      start_time: params.startTime,
      end_time: params.endTime
    })
    return this.client.request(`/event_type_available_times?${queryParams}`)
  }

  // Organization Methods
  async getOrganizationMemberships() {
    await this.getConfig()
    return this.client.request('/organization_memberships')
  }

  // Webhook Methods
  async createWebhookSubscription(webhookUrl: string, scope: 'user' | 'organization' = 'user') {
    await this.getConfig()
    const response = await this.getOrganizationMemberships()
    const orgMemberships = response as { collection: Array<{ organization: { uri: string } }> }
    const organization = orgMemberships.collection[0]?.organization.uri

    if (!organization) {
      throw new Error('No organization found')
    }

    return this.client.request('/webhook_subscriptions', {
      method: 'POST',
      body: {
        url: webhookUrl,
        events: ['invitee.created', 'invitee.canceled', 'invitee.rescheduled'],
        organization,
        scope
      }
    })
  }

  async listWebhookSubscriptions() {
    await this.getConfig()
    return this.client.request('/webhook_subscriptions')
  }

  async deleteWebhookSubscription(webhookUuid: string) {
    await this.getConfig()
    return this.client.request(`/webhook_subscriptions/${webhookUuid}`, {
      method: 'DELETE'
    })
  }

  // Booking Methods
  async createScheduledEvent(data: BookingData) {
    await this.getConfig()
    return this.client.request('/scheduled_events', {
      method: 'POST',
      body: {
        event_type_url: data.eventTypeUrl,
        start_time: data.scheduledTime,
        email: data.inviteeEmail
      }
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