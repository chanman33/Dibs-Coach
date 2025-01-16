import { CALENDLY_CONFIG, isDevelopment } from './calendly-config'
import { MOCK_DATA } from './mock/mock-data'

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
    const headers: CalendlyHeaders = { ...CALENDLY_CONFIG.headers }
    
    if (requiresAuth && this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`
    }

    return headers
  }

  private buildUrl(path: string): string {
    return `${CALENDLY_CONFIG.api.baseUrl}/${path.replace(/^\//, '')}`
  }

  async request<T>(path: string, options: CalendlyRequestOptions = {}): Promise<T> {
    // Return mock response in development mode
    if (isDevelopment) {
      console.log('[CALENDLY_API_DEBUG] Using development mode with mock response for:', path)
      const mockPath = path.split('?')[0]
      const mockResponse = MOCK_DATA[mockPath as keyof typeof MOCK_DATA]
      if (!mockResponse) {
        throw new Error(`No mock response available for path: ${path}`)
      }
      return mockResponse as T
    }

    const {
      method = 'GET',
      body,
      requiresAuth = true,
      headers: extraHeaders = {}
    } = options

    const url = this.buildUrl(path)
    const baseHeaders = this.getHeaders(requiresAuth)
    
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