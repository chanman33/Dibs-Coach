import { env } from '@/lib/env'
import type { CreateCalManagedUserPayload } from '@/utils/types/cal-managed-user'

// Types for Cal.com API client and responses
export type CalApiClient = {
  users: {
    create: (payload: any) => Promise<{ user: { id: number; email: string; name: string; username?: string } }>;
    delete: (options: { id: number }) => Promise<void>;
  };
  // Add other API endpoints as needed
};

/**
 * Creates a simple Cal.com API client that uses API key authentication
 * This is specifically for managed user operations (create/delete/update)
 * @returns A simple client with methods for Cal.com API operations
 */
export function createApiKeyCalClient(): CalApiClient {
  return {
    users: {
      create: async (payload) => {
        const clientId = env.NEXT_PUBLIC_CAL_CLIENT_ID;
        const clientSecret = env.CAL_CLIENT_SECRET;
        
        if (!clientId) {
          throw new Error('CAL_CLIENT_ID is not configured');
        }
        
        if (!clientSecret) {
          throw new Error('CAL_CLIENT_SECRET is not configured');
        }
        
        // Use direct API endpoint with x-cal-secret-key auth header
        const response = await fetch(`https://api.cal.com/v2/oauth-clients/${clientId}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cal-secret-key': clientSecret
          },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          // Read error details
          const errorText = await response.text();
          let errorDetail;
          try {
            errorDetail = JSON.parse(errorText);
          } catch (e) {
            errorDetail = errorText;
          }
          
          throw new Error(`Cal.com API request failed: ${response.status} - ${JSON.stringify(errorDetail)}`);
        }
        
        const data = await response.json();
        return data;
      },
      delete: async ({ id }) => {
        const clientId = env.NEXT_PUBLIC_CAL_CLIENT_ID;
        const clientSecret = env.CAL_CLIENT_SECRET;
        
        if (!clientId) {
          throw new Error('CAL_CLIENT_ID is not configured');
        }
        
        if (!clientSecret) {
          throw new Error('CAL_CLIENT_SECRET is not configured');
        }
        
        // Use direct API endpoint with x-cal-secret-key auth header
        const response = await fetch(`https://api.cal.com/v2/oauth-clients/${clientId}/users/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-cal-secret-key': clientSecret
          }
        });
        
        if (!response.ok) {
          // Read error details
          const errorText = await response.text();
          let errorDetail;
          try {
            errorDetail = JSON.parse(errorText);
          } catch (e) {
            errorDetail = errorText;
          }
          
          throw new Error(`Cal.com API request failed: ${response.status} - ${JSON.stringify(errorDetail)}`);
        }
      }
    }
  };
}

/**
 * Maps our managed user payload to Cal.com API format
 * @param payload The validated user data 
 * @returns Formatted payload for Cal.com API
 */
export function mapUserToCalPayload(payload: CreateCalManagedUserPayload) {
  return {
    email: payload.email,
    name: payload.name,
    timeFormat: 12, // Default to 12-hour format
    weekStart: 'Monday', // Default week start
    timeZone: payload.timeZone || 'America/New_York',
    locale: 'en', // Default locale
    avatarUrl: payload.avatarUrl || null // Optional profile image URL
  };
}

type CalApiRequestOptions = {
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
}

export async function makeCalApiRequest({
  endpoint,
  method = 'GET',
  headers = {},
  body
}: CalApiRequestOptions) {
  // Use the exact base URL from official docs: https://api.cal.com/v2
  const baseUrl = 'https://api.cal.com/v2'
  // Make sure endpoint doesn't start with a slash to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint
  const url = `${baseUrl}/${cleanEndpoint}`

  // Always include client credentials for managed users
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'x-cal-client-id': env.NEXT_PUBLIC_CAL_CLIENT_ID || '',
    'x-cal-secret-key': env.CAL_CLIENT_SECRET || '',
    ...headers
  }

  const response = await fetch(url, {
    method,
    headers: defaultHeaders,
    body: body ? JSON.stringify(body) : undefined
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Cal.com API request failed: ${JSON.stringify(error)}`)
  }

  return response.json()
}

// For OAuth initialization only
export function getCalOAuthHeaders() {
  return {
    'x-cal-client-id': env.NEXT_PUBLIC_CAL_CLIENT_ID || '',
    'x-cal-secret-key': env.CAL_CLIENT_SECRET || ''
  }
}

// For authenticated requests
export function getCalAuthHeaders(accessToken: string) {
  return {
    'Authorization': `Bearer ${accessToken}`
  }
} 