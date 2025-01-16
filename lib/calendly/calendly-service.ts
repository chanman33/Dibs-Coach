import { CalendlyClient } from './calendly-client'
import { CalendlyAuthManager } from './calendly-auth'
import type {
  CalendlyEventType,
  CalendlyScheduledEvent,
  CalendlyInvitee,
  CalendlyAvailableTime,
  CalendlyAvailabilitySchedule,
  CalendlyBusyTime,
  BookingData
} from '@/utils/types/calendly'

export class CalendlyService {
  private client: CalendlyClient
  private authManager: CalendlyAuthManager

  constructor() {
    this.authManager = new CalendlyAuthManager()
    this.client = new CalendlyClient()
  }

  private async ensureAuth() {
    const accessToken = await this.authManager.initialize()
    this.client = new CalendlyClient(accessToken)
  }

  // User Methods
  async getUserInfo() {
    await this.ensureAuth()
    return this.client.getUser()
  }

  // Event Type Methods
  async getEventTypes(count = 10, pageToken?: string) {
    await this.ensureAuth()
    return this.client.getEventTypes()
  }

  async getUserEventType(uuid: string) {
    await this.ensureAuth()
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
    await this.ensureAuth()
    const queryParams: Record<string, string> = {}
    if (params.count) queryParams.count = params.count.toString()
    if (params.pageToken) queryParams.pageToken = params.pageToken
    if (params.status) queryParams.status = params.status
    if (params.minStartTime) queryParams.minStartTime = params.minStartTime
    if (params.maxStartTime) queryParams.maxStartTime = params.maxStartTime
    return this.client.getScheduledEvents(queryParams)
  }

  async getScheduledEvent(uuid: string) {
    await this.ensureAuth()
    return this.client.request(`/scheduled_events/${uuid}`)
  }

  async cancelEvent(uuid: string, reason: string) {
    await this.ensureAuth()
    return this.client.request(`/scheduled_events/${uuid}/cancellation`, {
      method: 'POST',
      body: { reason }
    })
  }

  // Invitee Methods
  async getEventInvitees(eventUuid: string, count = 10, pageToken?: string) {
    await this.ensureAuth()
    return this.client.request(`/scheduled_events/${eventUuid}/invitees`)
  }

  async markInviteeAsNoShow(inviteeUri: string) {
    await this.ensureAuth()
    return this.client.request('/invitee_no_shows', {
      method: 'POST',
      body: { invitee: inviteeUri }
    })
  }

  async undoInviteeNoShow(inviteeUuid: string) {
    await this.ensureAuth()
    return this.client.request(`/invitee_no_shows/${inviteeUuid}`, {
      method: 'DELETE'
    })
  }

  // Availability Methods
  async getAvailableSlots(coachCalendlyUrl: string, startTime: string, endTime: string) {
    await this.ensureAuth()
    return this.client.request(`/scheduled_events/available_times`, {
      method: 'GET'
    })
  }

  async getUserAvailabilitySchedules(userUri: string) {
    await this.ensureAuth()
    return this.client.request(`/user_availability_schedules?user=${userUri}`)
  }

  async getUserBusyTimes(userUri: string, startTime: string, endTime: string) {
    await this.ensureAuth()
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
    await this.ensureAuth()
    const queryParams = new URLSearchParams({
      event_type: params.eventUri,
      start_time: params.startTime,
      end_time: params.endTime
    })
    return this.client.request(`/event_type_available_times?${queryParams}`)
  }

  // Organization Methods
  async getOrganizationMemberships() {
    await this.ensureAuth()
    return this.client.request('/organization_memberships')
  }

  // Webhook Methods
  async createWebhookSubscription(webhookUrl: string, scope: 'user' | 'organization' = 'user') {
    await this.ensureAuth()
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
    await this.ensureAuth()
    return this.client.request('/webhook_subscriptions')
  }

  async deleteWebhookSubscription(webhookUuid: string) {
    await this.ensureAuth()
    return this.client.request(`/webhook_subscriptions/${webhookUuid}`, {
      method: 'DELETE'
    })
  }

  // Booking Methods
  async createScheduledEvent(data: BookingData) {
    await this.ensureAuth()
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