import { calConfig, getCalUrls } from './cal';
import { CalEventTypeResponse } from '@/utils/types/cal-event-types';
import { CalTokenService } from './cal-service';

// Use the centralized type definition for Cal.com API
export type CalEventType = CalEventTypeResponse;

export interface CalTimeSlot {
  time: string;
  attendees: number;
  bookingId: string | null;
}

export interface CreateBookingData {
  eventTypeId: number;
  start: string;
  end: string;
  name: string;
  email: string;
  notes?: string;
  guests?: string[];
  customInputs?: Record<string, any>;
}

export interface CalTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

/**
 * Makes a request to the Cal.com API with automatic token validation.
 * Central function for all Cal.com API calls.
 * 
 * @param endpoint The Cal.com API endpoint to call
 * @param method The HTTP method to use (GET, POST, etc.)
 * @param body Optional request body for POST/PUT requests
 * @param userUlid The user's ULID to use for authentication
 * @param options Additional fetch options
 * @returns The API response data
 */
export async function makeCalApiRequest<T = any>(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  userUlid?: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    // Make sure endpoint has leading slash
    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint;
    }

    // For the base URL, remove any trailing slash
    const baseUrl = 'https://api.cal.com/v2'.replace(/\/$/, '');
    const url = `${baseUrl}${endpoint}`;

    console.log('[CAL_API] Making request', {
      url,
      method,
      userUlid: userUlid || 'none',
      timestamp: new Date().toISOString()
    });

    // If userUlid is provided, get a valid token
    let headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (userUlid) {
      const tokenResult = await CalTokenService.ensureValidToken(userUlid);
      
      if (!tokenResult.success) {
        throw new Error(`Failed to get valid token: ${tokenResult.error}`);
      }
      
      headers['Authorization'] = `Bearer ${tokenResult.accessToken}`;
    }

    // Merge user-provided headers if any
    if (options.headers) {
      headers = { ...headers, ...options.headers };
    }

    // Prepare request config
    const requestConfig: RequestInit = {
      method,
      headers,
      ...options,
    };

    // Add body for methods that support it
    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      requestConfig.body = JSON.stringify(body);
    }

    // Make the request
    const response = await fetch(url, requestConfig);

    // Handle non-success responses
    if (!response.ok) {
      let errorMessage = `Cal.com API request failed with status ${response.status}`;
      let errorDetail = '';
      
      try {
        const errorData = await response.json();
        errorDetail = JSON.stringify(errorData);
      } catch {
        // Unable to parse error response
      }
      
      console.error('[CAL_API_ERROR]', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        errorDetail,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      throw new Error(`${errorMessage}${errorDetail ? ': ' + errorDetail : ''}`);
    }

    // Parse JSON response
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error('[CAL_API_ERROR]', {
      context: 'REQUEST',
      endpoint,
      method,
      error,
      userUlid,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}

// Legacy client maintained for backward compatibility
class CalApiClient {
  private tokens: CalTokens | null = null;
  private tokenPromise: Promise<CalTokens> | null = null;
  private isConfigured: boolean;

  constructor() {
    // Check if we have the necessary configuration
    this.isConfigured = !!(
      calConfig.clientId && 
      (calConfig.clientSecret || process.env.CAL_CLIENT_SECRET) && 
      calConfig.organizationId
    );
    
    console.warn('[DEPRECATED] CalApiClient is deprecated, use makeCalApiRequest instead.');
  }

  private async ensureValidToken(): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Cal.com API is not configured. Missing required credentials.');
    }

    if (!this.tokens) {
      if (!this.tokenPromise) {
        this.tokenPromise = this.refreshTokens();
      }
      this.tokens = await this.tokenPromise;
      this.tokenPromise = null;
    } else if (this.tokens.expires_at <= Date.now()) {
      this.tokens = await this.refreshTokens();
    }
    return this.tokens.access_token;
  }

  private async refreshTokens(): Promise<CalTokens> {
    throw new Error('Deprecated: Use CalTokenService for token management instead');
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.ensureValidToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Fetch available event types
  async getEventTypes(): Promise<CalEventType[]> {
    console.warn('[DEPRECATED] Use makeCalApiRequest instead of CalApiClient');
    throw new Error('Deprecated: Use makeCalApiRequest for API calls');
  }

  // Fetch available time slots for an event type
  async getAvailability(
    eventTypeId: number,
    start: string,
    end: string
  ): Promise<CalTimeSlot[]> {
    console.warn('[DEPRECATED] Use makeCalApiRequest instead of CalApiClient');
    throw new Error('Deprecated: Use makeCalApiRequest for API calls');
  }

  // Create a new booking
  async createBooking(
    data: CreateBookingData,
    customRedirectPath?: string
  ) {
    console.warn('[DEPRECATED] Use makeCalApiRequest instead of CalApiClient');
    throw new Error('Deprecated: Use makeCalApiRequest for API calls');
  }

  // Set tokens (used after OAuth flow)
  setTokens(tokens: CalTokens) {
    console.warn('[DEPRECATED] Use CalTokenService instead of CalApiClient');
    this.tokens = tokens;
  }

  // Check if Cal.com is properly configured
  isCalConfigured(): boolean {
    return this.isConfigured;
  }
}

export const calApiClient = new CalApiClient(); 