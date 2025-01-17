import { CALENDLY_CONFIG } from './calendly-config'
import { getValidCalendlyToken } from './calendly-service'

interface CalendlyRequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: any
  requiresAuth?: boolean
}

type CalendlyHeaders = {
  'Content-Type': string
  Authorization?: string
  [key: string]: string | undefined
}

export class CalendlyClient {
  private userDbId: number
  private accessToken?: string

  constructor(userDbId: number, accessToken?: string) {
    this.userDbId = userDbId
    this.accessToken = accessToken
  }

  private async getHeaders(requiresAuth: boolean = true): Promise<CalendlyHeaders> {
    const headers: CalendlyHeaders = { ...CALENDLY_CONFIG.headers }
    
    if (requiresAuth) {
      // Get a valid token (will refresh if needed)
      const token = this.accessToken || await getValidCalendlyToken(this.userDbId)
      headers.Authorization = `Bearer ${token}`
      // Update the stored token
      this.accessToken = token
    }

    return headers
  }

  private buildUrl(path: string): string {
    return `${CALENDLY_CONFIG.api.baseUrl}/${path.replace(/^\//, '')}`
  }

  async request<T>(path: string, options: CalendlyRequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      body,
      requiresAuth = true,
      headers: extraHeaders = {}
    } = options

    const url = this.buildUrl(path)
    const baseHeaders = await this.getHeaders(requiresAuth)
    
    // Ensure all header values are strings
    const headers: Record<string, string> = {}
    Object.entries(baseHeaders).forEach(([key, value]) => {
      if (value !== undefined) {
        headers[key] = value
      }
    })
    Object.entries(extraHeaders).forEach(([key, value]) => {
      headers[key] = String(value)
    })

    try {
      const response = await fetch(url, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {})
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Calendly API error: ${response.status} ${response.statusText}\n${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[CALENDLY_API_ERROR]', error)
      throw error
    }
  }

  // Common API Methods
  async getUser() {
    return this.request('users/me')
  }

  async getEventTypes() {
    return this.request('event_types')
  }

  async getScheduledEvents(params: Record<string, string> = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`scheduled_events${queryString ? `?${queryString}` : ''}`)
  }
} 