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
      'cal-api-version': '2024-06-14'
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
    let response = await fetch(url, requestConfig);

    // Handle token expiration (status 498) specifically with auto-retry
    if (response.status === 498 && userUlid) {
      console.log('[CAL_API] Detected token expiration (status 498), refreshing token');
      
      // Force refresh the token
      const refreshResult = await CalTokenService.refreshTokens(userUlid, true);
      
      if (refreshResult.success && refreshResult.tokens?.access_token) {
        console.log('[CAL_API] Token refreshed successfully, retrying request');
        
        // Update the Authorization header with the new token
        const newHeaders = { ...requestConfig.headers } as Record<string, string>;
        newHeaders['Authorization'] = `Bearer ${refreshResult.tokens.access_token}`;
        
        // Create a new request config with the updated headers
        const retryConfig = {
          ...requestConfig,
          headers: newHeaders
        };
        
        // Retry the request with the new token
        response = await fetch(url, retryConfig);
      } else {
        console.error('[CAL_API] Failed to refresh token for retry', {
          userUlid,
          error: refreshResult.error
        });
      }
    }

    // Handle non-success responses after potential retry
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

// [CURSOR]: Removed deprecated CalApiClient class and instance 