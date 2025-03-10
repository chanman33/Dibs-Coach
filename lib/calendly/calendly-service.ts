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
  WebhookStorage,
  CalendlyBusyTime,
  CalendlyAvailableTime,
} from '@/utils/types/calendly'
import { CalendlySessionType } from '@/utils/types/calendly'
import { formatEventDateTime, formatEventType } from './calendly-utils'
import { env } from '@/lib/env'
import { generateUlid } from '@/utils/ulid'

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

export class CalendlyService {
  private baseUrl = 'https://api.calendly.com'
  private supabase: SupabaseClient = createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_KEY,
    {
      cookies: {
        get(name: string) {
          return null
        },
      },
    }
  )
  private userUlid: string | null = null
  private readonly clientId: string
  private readonly clientSecret: string

  constructor(userUlid?: string) {
    this.clientId = env.CALENDLY_CLIENT_ID
    this.clientSecret = env.CALENDLY_CLIENT_SECRET
    if (userUlid) {
      this.userUlid = userUlid
    }
  }

  async init(userUlid?: string) {
    if (userUlid) {
      this.userUlid = userUlid
    } else if (!this.userUlid) {
      throw new Error('User ULID is required for initialization')
    }

    const cookieStore = await cookies()
    this.supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_KEY,
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
    if (!this.userUlid) {
      throw new Error('Service not initialized')
    }

    // Get the Calendly integration using the user's ULID
    const { data: integration, error: integrationError } = await this.supabase
      .from('CalendlyIntegration')
      .select('accessToken, refreshToken, expiresAt')
      .eq('userUlid', this.userUlid)
      .single()

    if (integrationError || !integration?.accessToken) {
      throw new Error('Calendly not connected')
    }

    return {
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken,
      expiresAt: integration.expiresAt
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
            client_id: this.clientId,
            client_secret: this.clientSecret,
            refresh_token: tokens.refreshToken,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error('[CALENDLY_REFRESH_ERROR]', error)
          throw new Error('Failed to refresh token: ' + error.message)
        }

        const data = await response.json()
        
        // Update tokens in database using the user's ULID
        const { error: updateError } = await this.supabase
          .from('CalendlyIntegration')
          .update({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          })
          .eq('userUlid', this.userUlid)

        if (updateError) {
          console.error('[CALENDLY_DB_ERROR] Failed to update tokens:', updateError)
          throw new Error('Failed to update tokens in database')
        }

        return data.access_token
      } catch (error) {
        console.error('[CALENDLY_REFRESH_ERROR]', error)
        
        // If refresh fails, try to clean up the integration
        try {
          const { error: deleteError } = await this.supabase
            .from('CalendlyIntegration')
            .delete()
            .eq('userUlid', this.userUlid)

          if (deleteError) {
            console.error('[CALENDLY_CLEANUP_ERROR] Failed to delete invalid integration:', deleteError)
          } else {
            console.log('[CALENDLY_CLEANUP] Removed invalid integration for userUlid:', this.userUlid)
          }
        } catch (cleanupError) {
          console.error('[CALENDLY_CLEANUP_ERROR]', cleanupError)
        }
        
        throw new Error('Token refresh failed - please reconnect Calendly')
      }
    }

    return tokens.accessToken
  }

  private async fetchCalendly<T = any>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
    try {
      const accessToken = await this.refreshTokenIfNeeded()
      
      // Log the request for debugging
      console.log(`[CALENDLY_API_REQUEST] ${this.baseUrl}${endpoint}`)
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // If the response is not JSON, use the status text
          errorData = { message: response.statusText };
        }
        
        console.error('[CALENDLY_API_ERROR]', {
          status: response.status,
          statusText: response.statusText,
          endpoint: `${this.baseUrl}${endpoint}`,
          errorData
        })

        // If unauthorized and haven't retried yet, force token refresh and retry once
        if (response.status === 401 && retryCount === 0) {
          console.log('[CALENDLY_API] Unauthorized, forcing token refresh and retrying...')
          // Force token refresh by setting expired date
          await this.supabase
            .from('CalendlyIntegration')
            .update({
              expiresAt: new Date(0).toISOString(),
              updatedAt: new Date().toISOString()
            })
            .eq('userUlid', this.userUlid)

          // Retry the request
          return this.fetchCalendly<T>(endpoint, options, retryCount + 1)
        }

        throw new Error(`Calendly API error: ${errorData.message || response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error('[CALENDLY_API_ERROR]', error)
      throw error
    }
  }

  async getStatus(fetchEventTypes: boolean = false): Promise<CalendlyStatus> {
    try {
      await this.init()
      
      // We already have the userUlid from initialization
      if (!this.userUlid) {
        return { connected: false }
      }

      // Try to get a valid token (this will refresh if needed)
      try {
        const accessToken = await this.refreshTokenIfNeeded()
        
        // If we got here, we have a valid token
        // Now try to get user info using the correct endpoint
        try {
          // According to Calendly API docs, the correct endpoint is /users/me
          console.log(`[CALENDLY_API_REQUEST] ${this.baseUrl}/users/me`)
          const userResponse = await fetch(`${this.baseUrl}/users/me`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
          })
          
          if (!userResponse.ok) {
            console.error(`[CALENDLY_API_ERROR] User endpoint failed: ${userResponse.status} ${userResponse.statusText}`)
            return await this.getStatusFromEventTypes(accessToken, fetchEventTypes)
          }
          
          // Parse the user response
          const userData = await userResponse.json()
          console.log('[CALENDLY_API_DEBUG] User data:', {
            resourceExists: !!userData.resource,
            uri: userData.resource?.uri,
            schedulingUrl: userData.resource?.scheduling_url
          })
          
          // Only fetch event types if requested
          const eventTypes = fetchEventTypes ? await this.getEventTypes(accessToken) : []
          
          return {
            connected: true,
            schedulingUrl: userData.resource?.scheduling_url,
            eventTypes: fetchEventTypes ? eventTypes : undefined,
            isExpired: false,
            userUri: userData.resource?.uri
          }
        } catch (apiError) {
          console.error('[CALENDLY_API_ERROR_DETAILS]', apiError)
          
          // If the API call fails, try the event_types endpoint as a fallback
          return await this.getStatusFromEventTypes(accessToken, fetchEventTypes)
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

  // Helper method to get status from event types when user endpoints fail
  private async getStatusFromEventTypes(accessToken: string, fetchEventTypes: boolean = false): Promise<CalendlyStatus> {
    try {
      // First, get the user information
      console.log(`[CALENDLY_API_REQUEST] ${this.baseUrl}/users/me`)
      const userResponse = await fetch(`${this.baseUrl}/users/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      })
      
      if (!userResponse.ok) {
        console.error(`[CALENDLY_API_ERROR] User endpoint failed: ${userResponse.status} ${userResponse.statusText}`)
        throw new Error(`Failed to fetch user: ${userResponse.statusText}`)
      }
      
      const userData = await userResponse.json()
      
      // Only fetch event types if requested
      if (!fetchEventTypes) {
        return {
          connected: true,
          schedulingUrl: userData.resource.scheduling_url,
          eventTypes: undefined,
          isExpired: false,
          userUri: userData.resource.uri
        }
      }
      
      // Now try to get event types using the user's URI as a filter
      console.log(`[CALENDLY_API_REQUEST] ${this.baseUrl}/event_types?user=${userData.resource.uri}`)
      const eventTypesResponse = await fetch(`${this.baseUrl}/event_types?user=${userData.resource.uri}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      })
      
      if (!eventTypesResponse.ok) {
        console.error(`[CALENDLY_API_ERROR] Event types endpoint failed: ${eventTypesResponse.status} ${eventTypesResponse.statusText}`)
        
        // Even if we can't get event types, we can still return a connected state
        // with the user's scheduling URL
        return {
          connected: true,
          schedulingUrl: userData.resource.scheduling_url,
          eventTypes: [],
          isExpired: false,
          userUri: userData.resource.uri
        }
      }
      
      const eventTypesData = await eventTypesResponse.json()
      const eventTypes = eventTypesData.collection?.map(formatEventType) || []
      
      // Return the connected state with user info and event types
      return {
        connected: true,
        schedulingUrl: userData.resource.scheduling_url,
        eventTypes,
        isExpired: false,
        userUri: userData.resource.uri
      }
    } catch (error) {
      console.error('[CALENDLY_API_ERROR_DETAILS]', error)
      
      // If the API call fails, we'll return a connected state but with an error
      // This allows the client to show a reconnect button
      return {
        connected: true,
        needsReconnect: true,
        error: 'Unable to access Calendly API. Please reconnect your account.'
      }
    }
  }

  async getEventTypes(accessToken?: string, count?: number, pageToken?: string): Promise<CalendlyEventType[]> {
    try {
      // If not initialized and no access token provided, throw error
      if (!this.userUlid && !accessToken) {
        throw new Error('Service not initialized')
      }

      // Get token if not provided
      const token = accessToken || await this.refreshTokenIfNeeded()
      
      // First, get the user information to get the user URI
      console.log(`[CALENDLY_API_REQUEST] ${this.baseUrl}/users/me`)
      const userResponse = await fetch(`${this.baseUrl}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      })
      
      if (!userResponse.ok) {
        console.error(`[CALENDLY_API_ERROR] User endpoint failed: ${userResponse.status} ${userResponse.statusText}`)
        return []
      }
      
      // Extract the user URI from the response
      const userData = await userResponse.json()
      if (!userData.resource?.uri) {
        console.error('[CALENDLY_API_ERROR] No user URI found in response')
        return []
      }
      
      // Construct query parameters
      const queryParams = new URLSearchParams({
        user: userData.resource.uri
      })
      
      if (count) queryParams.append('count', count.toString())
      if (pageToken) queryParams.append('page_token', pageToken)
      
      // Make the request with the user filter
      console.log(`[CALENDLY_API_REQUEST] ${this.baseUrl}/event_types?${queryParams}`)
      const response = await fetch(`${this.baseUrl}/event_types?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      })
      
      if (!response.ok) {
        console.error(`[CALENDLY_API_ERROR] Event types endpoint failed: ${response.status} ${response.statusText}`)
        return []
      }
      
      const data = await response.json()
      return data.collection?.map(formatEventType) || []
    } catch (error) {
      console.error('[CALENDLY_EVENT_TYPES_ERROR]', error)
      return []
    }
  }

  async getScheduledEvents(params: {
    startTime?: string
    endTime?: string
    status?: 'active' | 'canceled'
  } = {}): Promise<CalendlyScheduledEvent[]> {
    try {
      const queryParams = new URLSearchParams()
      if (params.startTime) queryParams.append('min_start_time', params.startTime)
      if (params.endTime) queryParams.append('max_start_time', params.endTime)
      if (params.status) queryParams.append('status', params.status)

      console.log(`[CALENDLY_API_REQUEST] ${this.baseUrl}/scheduled_events?${queryParams}`)
      const response = await fetch(`${this.baseUrl}/scheduled_events?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${await this.refreshTokenIfNeeded()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch scheduled events: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.collection.map(formatEventDateTime)
    } catch (error) {
      console.error('[CALENDLY_EVENTS_ERROR]', error)
      return []
    }
  }

  async createWebhookSubscription(url: string) {
    try {
      console.log(`[CALENDLY_API_REQUEST] ${this.baseUrl}/users/me`)
      const userResponse = await fetch(`${this.baseUrl}/users/me`, {
        headers: {
          'Authorization': `Bearer ${await this.refreshTokenIfNeeded()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      })
      
      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user: ${userResponse.statusText}`)
      }
      
      const user = await userResponse.json()
      const organization = user.resource.current_organization
      
      console.log(`[CALENDLY_API_REQUEST] ${this.baseUrl}/webhook_subscriptions`)
      const webhookResponse = await fetch(`${this.baseUrl}/webhook_subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.refreshTokenIfNeeded()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          url,
          organization,
          scope: 'user',
          events: ['invitee.created', 'invitee.canceled', 'invitee.rescheduled']
        })
      })
      
      if (!webhookResponse.ok) {
        throw new Error(`Failed to create webhook: ${webhookResponse.statusText}`)
      }
      
      return webhookResponse.json()
    } catch (error) {
      console.error('[CALENDLY_WEBHOOK_ERROR]', error)
      throw error
    }
  }

  async storeWebhookEvent(event: WebhookEvent): Promise<void> {
    const now = new Date().toISOString()
    await this.supabase
      .from('CalendlyWebhookEvent')
      .insert({
        ulid: generateUlid(),
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
    if (!this.userUlid) {
      throw new Error('Service not initialized')
    }

    try {
      // Get user's integration data
      const { data: integration, error: integrationError } = await this.supabase
        .from('CalendlyIntegration')
        .select('accessToken, refreshToken')
        .eq('userUlid', this.userUlid)
        .single()

      if (integrationError || !integration) {
        throw new Error('Failed to fetch user integration data')
      }

      // Revoke both tokens
      await Promise.all([
        revokeCalendlyToken(integration.accessToken),
        revokeCalendlyToken(integration.refreshToken)
      ])

      // Delete the integration record
      const { error: deleteError } = await this.supabase
        .from('CalendlyIntegration')
        .delete()
        .eq('userUlid', this.userUlid)

      if (deleteError) {
        throw new Error('Failed to delete integration record')
      }

      console.log('[CALENDLY_DISCONNECT] Successfully disconnected Calendly for user:', this.userUlid)
    } catch (error) {
      console.error('[CALENDLY_DISCONNECT_ERROR]', error)
      throw error
    }
  }

  public async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })

    const response = await fetch('https://auth.calendly.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Token refresh failed: ${error.error || response.statusText}`)
    }

    return response.json()
  }

  async getUserAvailability(accessToken: string) {
    const response = await fetch(`${this.baseUrl}/user_availability_schedules`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to fetch availability: ${error.message}`)
    }

    const data = await response.json()
    return data.collection.map((schedule: any) => ({
      id: schedule.uri,
      name: schedule.name,
      timezone: schedule.timezone,
      rules: schedule.rules.map((rule: any) => ({
        type: rule.type,
        wday: rule.wday,
        intervals: rule.intervals.map((interval: any) => ({
          from: interval.from,
          to: interval.to,
        })),
      })),
    }))
  }

  private async getUserUlid(): Promise<string> {
    if (!this.userUlid) {
      throw new Error('Service not initialized')
    }

    const { data: user, error } = await this.supabase
      .from('User')
      .select('ulid')
      .eq('userId', this.userUlid)
      .single()

    if (error || !user?.ulid) {
      throw new Error('User not found')
    }

    return user.ulid
  }

  private async getEventTypeMapping(userUlid: string, eventTypeUri: string) {
    const { data: mapping } = await this.supabase
      .from('CalendlyEventTypeMapping')
      .select('*')
      .eq('userUlid', userUlid)
      .eq('eventTypeUri', eventTypeUri)
      .single()

    return mapping
  }

  private async applyEventTypeMapping(eventType: CalendlyEventType, userUlid: string) {
    const mapping = await this.getEventTypeMapping(userUlid, eventType.uri)
    if (mapping) {
      return {
        ...eventType,
        sessionType: mapping.sessionType,
        minimumDuration: mapping.durationConstraints.minimum,
        maximumDuration: mapping.durationConstraints.maximum,
        bufferBeforeMinutes: mapping.bufferTime.before,
        bufferAfterMinutes: mapping.bufferTime.after,
      }
    }
    // Provide default values when no mapping exists
    return {
      ...eventType,
      sessionType: CalendlySessionType.FREE,
      minimumDuration: eventType.duration,
      maximumDuration: eventType.duration,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      availabilityRules: eventType.availabilityRules || []
    }
  }

  async createScheduledEvent(data: {
    eventTypeUri: string
    startTime: string
    endTime: string
    email: string
    name: string
    timezone: string
    questions?: Record<string, string>
  }) {
    if (!this.userUlid) {
      throw new Error('Service not initialized')
    }

    const userUlid = await this.getUserUlid()
    const mapping = await this.getEventTypeMapping(userUlid, data.eventTypeUri)

    // Apply buffer time if mapping exists
    if (mapping) {
      const startTime = new Date(data.startTime)
      const endTime = new Date(data.endTime)
      
      // Add buffer time before
      startTime.setMinutes(startTime.getMinutes() - mapping.bufferTime.before)
      
      // Add buffer time after
      endTime.setMinutes(endTime.getMinutes() + mapping.bufferTime.after)

      data.startTime = startTime.toISOString()
      data.endTime = endTime.toISOString()
    }

    const response = await this.fetchCalendly(`/scheduled_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type_uri: data.eventTypeUri,
        start_time: data.startTime,
        end_time: data.endTime,
        invitee: {
          email: data.email,
          name: data.name,
          timezone: data.timezone,
          questions_and_answers: Object.entries(data.questions || {}).map(([question, answer]) => ({
            question,
            answer,
          })),
        },
      }),
    })

    return response
  }

  async getBusyTimes(startTime: string, endTime: string): Promise<{ collection: CalendlyBusyTime[] }> {
    try {
      // First, get the user information to get the user URI
      console.log(`[CALENDLY_API_REQUEST] ${this.baseUrl}/users/me`)
      const userResponse = await fetch(`${this.baseUrl}/users/me`, {
        headers: {
          'Authorization': `Bearer ${await this.refreshTokenIfNeeded()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      })
      
      if (!userResponse.ok) {
        console.error(`[CALENDLY_API_ERROR] User endpoint failed: ${userResponse.status} ${userResponse.statusText}`)
        throw new Error(`Failed to fetch user: ${userResponse.statusText}`)
      }
      
      const userData = await userResponse.json()
      if (!userData.resource?.uri) {
        throw new Error('User URI not found in response')
      }
      
      // Construct query parameters
      const queryParams = new URLSearchParams({
        user: userData.resource.uri,
        start_time: startTime,
        end_time: endTime
      })
      
      // Make the request with the correct URL and headers
      console.log(`[CALENDLY_API_REQUEST] ${this.baseUrl}/user_busy_times?${queryParams}`)
      const response = await fetch(`${this.baseUrl}/user_busy_times?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.refreshTokenIfNeeded()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      })
      
      if (!response.ok) {
        console.error(`[CALENDLY_API_ERROR] Busy times endpoint failed: ${response.status} ${response.statusText}`)
        throw new Error(`Failed to fetch busy times: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('[CALENDLY_BUSY_TIMES_ERROR]', error)
      throw error
    }
  }

  async getEventTypeAvailableTimes(params: {
    eventTypeUri: string,
    startTime: string,
    endTime: string
  }): Promise<{ collection: CalendlyAvailableTime[] }> {
    try {
      // Construct query parameters
      const queryParams = new URLSearchParams({
        event_type: params.eventTypeUri,
        start_time: params.startTime,
        end_time: params.endTime
      })
      
      // Make the request with the correct URL and headers
      console.log(`[CALENDLY_API_REQUEST] ${this.baseUrl}/event_type_available_times?${queryParams}`)
      const response = await fetch(`${this.baseUrl}/event_type_available_times?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.refreshTokenIfNeeded()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      })
      
      if (!response.ok) {
        console.error(`[CALENDLY_API_ERROR] Available times endpoint failed: ${response.status} ${response.statusText}`)
        throw new Error(`Failed to fetch available times: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('[CALENDLY_AVAILABLE_TIMES_ERROR]', error)
      throw error
    }
  }

  async markInviteeAsNoShow(inviteeUri: string): Promise<void> {
    await this.fetchCalendly(`/invitees/${encodeURIComponent(inviteeUri.split('/').pop()!)}/no_show`, {
      method: 'POST'
    })
  }

  async undoInviteeNoShow(inviteeUuid: string): Promise<void> {
    await this.fetchCalendly(`/invitees/${encodeURIComponent(inviteeUuid)}/no_show`, {
      method: 'DELETE'
    })
  }

  async getEventInvitees(
    eventUuid: string,
    count: number = 10,
    pageToken?: string
  ) {
    const queryParams = new URLSearchParams()
    queryParams.append('count', count.toString())
    if (pageToken) queryParams.append('page_token', pageToken)

    return this.fetchCalendly(`/scheduled_events/${eventUuid}/invitees?${queryParams}`)
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

export async function getValidCalendlyToken(userUlid: string): Promise<string> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_KEY,
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
      .eq('userUlid', userUlid)
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
      return refreshCalendlyToken(userUlid)
    }

    return integration.accessToken
  } catch (error) {
    console.error('[CALENDLY_TOKEN_ERROR]', error)
    throw error
  }
}

export async function refreshCalendlyToken(userUlid: string) {
  try {
    // Initialize Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_KEY,
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
      .eq('userUlid', userUlid)
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
      .eq('userUlid', userUlid)

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
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_KEY,
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
        .eq('userUlid', userUlid)

      console.log('[CALENDLY_CLEANUP] Removed invalid integration for userUlid:', userUlid)
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