import { env } from '@/lib/env'

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
  const baseUrl = 'https://api.cal.com/v2'
  const url = `${baseUrl}${endpoint}`

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