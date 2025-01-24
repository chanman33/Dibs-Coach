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
    const now = new Date()
    const expiresAt = tokens.expiresAt ? new Date(tokens.expiresAt) : null
    
    // Refresh if token is expired or will expire in the next 5 minutes
    if (!expiresAt || expiresAt.getTime() - now.getTime() <= 5 * 60 * 1000) {
      console.log('[CALENDLY_TOKEN] Refreshing token that expires at:', expiresAt)
      
      try {
        const response = await fetch('https://auth.calendly.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: CALENDLY_CONFIG.oauth.clientId,
            client_secret: CALENDLY_CONFIG.oauth.clientSecret,
            refresh_token: tokens.refreshToken,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error('[CALENDLY_REFRESH_ERROR]', error)
          throw new Error('Failed to refresh token: ' + error.message)
        }

        const data = await response.json()
        
        // Update tokens in database
        const { error: updateError } = await this.supabase
          .from('User')
          .update({
            calendlyAccessToken: data.access_token,
            calendlyRefreshToken: data.refresh_token,
            calendlyExpiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          })
          .eq('userId', this.userId)

        if (updateError) {
          console.error('[CALENDLY_DB_ERROR] Failed to update tokens:', updateError)
          throw new Error('Failed to update tokens in database')
        }

        return data.access_token
      } catch (error) {
        console.error('[CALENDLY_REFRESH_ERROR]', error)
        throw new Error('Token refresh failed - please reconnect Calendly')
      }
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
      
      // Get user's database ID first
      const { data: user } = await this.supabase
        .from('User')
        .select('id')
        .eq('userId', this.userId)
        .single()

      if (!user?.id) {
        return { connected: false }
      }

      // Try to get a valid token (this will refresh if needed)
      try {
        const accessToken = await getValidCalendlyToken(user.id)
        
        // If we got here, we have a valid token
        // Now fetch the Calendly user info and event types
        const calendlyUser = await this.fetchCalendly('/users/me')
        const eventTypes = await this.getEventTypes()

        return {
          connected: true,
          schedulingUrl: calendlyUser.resource.scheduling_url,
          eventTypes,
          // Don't expose token expiration to the client since we handle refresh automatically
          isExpired: false
        }
      } catch (error) {
        if (error instanceof Error) {
          // Check if this is an invalid refresh token error
          if (error.message.includes('Refresh token is invalid')) {
            return {
              connected: false,
              needsReconnect: true,
              error: 'Calendly connection expired. Please reconnect your account.'
            }
          }
          
          // For other errors, log but don't expose details to client
          console.error('[CALENDLY_STATUS_ERROR]', error)
          return {
            connected: false,
            error: 'Unable to connect to Calendly. Please try again later.'
          }
        }
        return { connected: false }
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

  async disconnectCalendly(): Promise<void> {
    if (!this.userId) {
      throw new Error('Service not initialized')
    }

    try {
      // Get user's database ID and tokens
      const { data: user, error: userError } = await this.supabase
        .from('CalendlyIntegration')
        .select('accessToken, refreshToken')
        .eq('userDbId', (
          await this.supabase
            .from('User')
            .select('id')
            .eq('userId', this.userId)
            .single()
        ).data?.id)
        .single()

      if (userError || !user) {
        throw new Error('Failed to fetch user integration data')
      }

      // Revoke both tokens
      await Promise.all([
        revokeCalendlyToken(user.accessToken),
        revokeCalendlyToken(user.refreshToken)
      ])

      // Delete the integration record
      const { error: deleteError } = await this.supabase
        .from('CalendlyIntegration')
        .delete()
        .eq('userDbId', (
          await this.supabase
            .from('User')
            .select('id')
            .eq('userId', this.userId)
            .single()
        ).data?.id)

      if (deleteError) {
        throw new Error('Failed to delete integration record')
      }

      console.log('[CALENDLY_DISCONNECT] Successfully disconnected Calendly for user:', this.userId)
    } catch (error) {
      console.error('[CALENDLY_DISCONNECT_ERROR]', error)
      throw error
    }
  }
}

interface TokenIntrospectionResponse {
  active: boolean
  scope?: string
  client_id?: string
  token_type?: string
  exp?: number
  iat?: number
  owner?: string
  organization?: string
}

async function introspectToken(token: string): Promise<TokenIntrospectionResponse> {
  try {
    const response = await fetch(`${CALENDLY_CONFIG.oauth.baseUrl}/oauth/introspect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CALENDLY_CONFIG.oauth.clientId,
        client_secret: CALENDLY_CONFIG.oauth.clientSecret,
        token,
      }).toString(),
    })

    if (!response.ok) {
      throw new Error('Token introspection failed')
    }

    return response.json()
  } catch (error) {
    console.error('[CALENDLY_INTROSPECTION_ERROR]', error)
    return { active: false }
  }
}

export async function getValidCalendlyToken(userDbId: number): Promise<string> {
  try {
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
            // Not needed for this flow
          },
          remove(name: string, options: any) {
            // Not needed for this flow
          },
        },
      }
    )

    // Get current integration data
    const { data: integration, error: fetchError } = await supabase
      .from('CalendlyIntegration')
      .select('accessToken, expiresAt')
      .eq('userDbId', userDbId)
      .single()

    if (fetchError || !integration) {
      throw new Error('Calendly integration not found')
    }

    // Check if token is expired or will expire in the next 5 minutes
    const expiresAt = new Date(integration.expiresAt)
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

    if (expiresAt <= fiveMinutesFromNow) {
      console.log('[CALENDLY_TOKEN] Access token expiring soon, refreshing...')
      return refreshCalendlyToken(userDbId)
    }

    return integration.accessToken
  } catch (error) {
    console.error('[CALENDLY_TOKEN_ERROR]', error)
    throw error
  }
}

export async function refreshCalendlyToken(userDbId: number) {
  try {
    // Initialize Supabase client
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
            // Not needed for this flow
          },
          remove(name: string, options: any) {
            // Not needed for this flow
          },
        },
      }
    )

    // Get current integration data
    const { data: integration, error: fetchError } = await supabase
      .from('CalendlyIntegration')
      .select('refreshToken')
      .eq('userDbId', userDbId)
      .single()

    if (fetchError || !integration) {
      throw new Error('Failed to fetch Calendly integration')
    }

    // For native clients, we include client_id in the body params
    // and don't use Basic Auth header
    const tokenResponse = await fetch(`${CALENDLY_CONFIG.oauth.baseUrl}${CALENDLY_CONFIG.oauth.tokenPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CALENDLY_CONFIG.oauth.clientId,
        client_secret: CALENDLY_CONFIG.oauth.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: integration.refreshToken
      }).toString()
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('[CALENDLY_REFRESH_ERROR] Token refresh failed:', errorData)
      throw new Error(errorData.message || 'Token refresh failed')
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokenData

    // Update tokens in database
    // Note: Access tokens expire after 2 hours (7200 seconds)
    const { error: updateError } = await supabase
      .from('CalendlyIntegration')
      .update({
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + (expires_in * 1000)).toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('userDbId', userDbId)

    if (updateError) {
      console.error('[CALENDLY_DB_ERROR] Failed to update tokens:', updateError)
      throw new Error('Failed to update tokens in database')
    }

    return access_token
  } catch (error) {
    console.error('[CALENDLY_REFRESH_ERROR]', error)
    
    // If refresh fails, clean up the integration
    try {
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
              // Not needed for this flow
            },
            remove(name: string, options: any) {
              // Not needed for this flow
            },
          },
        }
      )

      // Delete the integration record since it's no longer valid
      await supabase
        .from('CalendlyIntegration')
        .delete()
        .eq('userDbId', userDbId)

      console.log('[CALENDLY_CLEANUP] Removed invalid integration for userDbId:', userDbId)
    } catch (cleanupError) {
      console.error('[CALENDLY_CLEANUP_ERROR]', cleanupError)
    }
    
    throw new Error('Calendly connection expired. Please reconnect your account.')
  }
}

async function revokeCalendlyToken(token: string): Promise<void> {
  try {
    const response = await fetch(`${CALENDLY_CONFIG.oauth.baseUrl}/oauth/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CALENDLY_CONFIG.oauth.clientId,
        client_secret: CALENDLY_CONFIG.oauth.clientSecret,
        token,
      }).toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Token revocation failed: ${errorText}`)
    }

    // Successful revocation returns an empty response
  } catch (error) {
    console.error('[CALENDLY_REVOKE_ERROR]', error)
    throw error
  }
} 