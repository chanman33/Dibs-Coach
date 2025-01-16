import { CALENDLY_CONFIG } from './calendly-config'

interface CalendlyRequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: any
  requiresAuth?: boolean
}

type CalendlyHeaders = {
  'Content-Type': string
  Authorization?: string
  Prefer?: string
  [key: string]: string | undefined
}

export class CalendlyClient {
  private accessToken?: string

  constructor(accessToken?: string) {
    this.accessToken = accessToken
  }

  private getHeaders(requiresAuth: boolean = true): CalendlyHeaders {
    const headers: CalendlyHeaders = {
      ...CALENDLY_CONFIG.DEFAULT_HEADERS,
      ...(CALENDLY_CONFIG.MOCK_SERVER.enabled ? CALENDLY_CONFIG.MOCK_SERVER.headers : {})
    }

    if (requiresAuth && this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`
    }

    return headers
  }

  private buildUrl(path: string): string {
    const baseUrl = CALENDLY_CONFIG.API_BASE_URL
    const version = CALENDLY_CONFIG.API_VERSION
    return `${baseUrl}/${version}/${path.replace(/^\//, '')}`
  }

  async request<T>(path: string, options: CalendlyRequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      body,
      requiresAuth = true,
      headers: extraHeaders = {}
    } = options

    const url = this.buildUrl(path)
    const baseHeaders = this.getHeaders(requiresAuth)
    
    // Convert headers to Record<string, string> by filtering out undefined values
    const headers: Record<string, string> = Object.entries({
      ...baseHeaders,
      ...extraHeaders
    }).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, string>)

    try {
      const response = await fetch(url, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {})
      })

      if (!response.ok) {
        throw new Error(`Calendly API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[CALENDLY_API_ERROR]', error)
      throw error
    }
  }

  // Utility methods for common operations
  async getUser() {
    return this.request('/users/me')
  }

  async getEventTypes() {
    return this.request('/event_types')
  }

  async getScheduledEvents(params: Record<string, string> = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/scheduled_events${queryString ? `?${queryString}` : ''}`)
  }

  async getAvailability(params: Record<string, string> = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/user_availability_schedules${queryString ? `?${queryString}` : ''}`)
  }
} 