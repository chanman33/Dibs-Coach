import { createServerClient } from '@supabase/ssr'
import { type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { CALENDLY_CONFIG } from './calendly-config'
import type { 
  CalendlyStatus,
  CalendlyEventType,
  CalendlyScheduledEvent,
  WebhookEvent,
  WebhookStorage
} from '@/utils/types/calendly'
import { formatEventDateTime, formatEventType } from './calendly-utils'

export class CalendlyService {
  private baseUrl = 'https://api.calendly.com/v2'
  private supabase: SupabaseClient = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get(name: string) {
          return null
        },
      },
    }
  )
  private userId: string | null = null

  async init() {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Not authenticated')
    }
    this.userId = userId

    const cookieStore = await cookies()
    this.supabase = createServerClient(
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
  }

  private async getTokens() {
    if (!this.userId) {
      throw new Error('Service not initialized')
    }

    const { data: user, error } = await this.supabase
      .from('User')
      .select('calendlyAccessToken, calendlyRefreshToken, calendlyExpiresAt')
      .eq('userId', this.userId)
      .single()

    if (error || !user?.calendlyAccessToken) {
      throw new Error('Calendly not connected')
    }

    return {
      accessToken: user.calendlyAccessToken,
      refreshToken: user.calendlyRefreshToken,
      expiresAt: user.calendlyExpiresAt
    }
  }

  private async refreshTokenIfNeeded() {
    const tokens = await this.getTokens()
    if (!tokens.expiresAt || new Date(tokens.expiresAt) <= new Date()) {
      // Refresh token logic here
      const response = await fetch('https://auth.calendly.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.CALENDLY_CLIENT_ID!,
          client_secret: process.env.CALENDLY_CLIENT_SECRET!,
          refresh_token: tokens.refreshToken,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to refresh token')
      }

      const data = await response.json()
      await this.supabase
        .from('User')
        .update({
          calendlyAccessToken: data.access_token,
          calendlyRefreshToken: data.refresh_token,
          calendlyExpiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('userId', this.userId)

      return data.access_token
    }

    return tokens.accessToken
  }

  private async fetchCalendly(endpoint: string, options: RequestInit = {}) {
    const accessToken = await this.refreshTokenIfNeeded()
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Calendly API error: ${response.statusText}`)
    }

    return response.json()
  }

  async getStatus(): Promise<CalendlyStatus> {
    try {
      await this.init()
      const tokens = await this.getTokens()
      
      if (!tokens.accessToken) {
        return { connected: false }
      }

      const user = await this.fetchCalendly('/users/me')
      const eventTypes = await this.getEventTypes()

      return {
        connected: true,
        schedulingUrl: user.resource.scheduling_url,
        expiresAt: tokens.expiresAt,
        isExpired: tokens.expiresAt ? new Date(tokens.expiresAt) <= new Date() : false,
        eventTypes
      }
    } catch (error) {
      console.error('[CALENDLY_STATUS_ERROR]', error)
      return { connected: false }
    }
  }

  async getEventTypes(): Promise<CalendlyEventType[]> {
    const response = await this.fetchCalendly('/event_types')
    return response.collection.map(formatEventType)
  }

  async getScheduledEvents(params: {
    startTime?: string
    endTime?: string
    status?: 'active' | 'canceled'
  } = {}): Promise<CalendlyScheduledEvent[]> {
    const queryParams = new URLSearchParams()
    if (params.startTime) queryParams.append('min_start_time', params.startTime)
    if (params.endTime) queryParams.append('max_start_time', params.endTime)
    if (params.status) queryParams.append('status', params.status)

    const response = await this.fetchCalendly(`/scheduled_events?${queryParams}`)
    return response.collection.map(formatEventDateTime)
  }

  async createWebhookSubscription(url: string) {
    const user = await this.fetchCalendly('/users/me')
    const organization = user.resource.current_organization

    return this.fetchCalendly('/webhook_subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        url,
        organization,
        scope: 'user',
        events: ['invitee.created', 'invitee.canceled', 'invitee.rescheduled']
      })
    })
  }

  async storeWebhookEvent(event: WebhookEvent): Promise<void> {
    const now = new Date().toISOString()
    await this.supabase
      .from('CalendlyWebhookEvent')
      .insert({
        eventType: event.event,
        payload: event.payload,
        processed: false,
        createdAt: now,
        updatedAt: now
      })
  }

  async processWebhookEvent(event: WebhookEvent): Promise<void> {
    // Implement webhook event processing logic here
    // This could include:
    // - Updating the database
    // - Sending notifications
    // - Syncing with other services
    console.log('[CALENDLY_WEBHOOK_PROCESSING]', event)
  }
} 