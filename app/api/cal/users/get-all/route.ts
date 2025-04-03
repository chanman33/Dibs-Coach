/**
 * Cal.com Managed Users API - Get All Users
 * 
 * This API route fetches all managed users from Cal.com's API v2.
 * It uses the client ID and secret from environment variables.
 */

import { NextResponse } from 'next/server'
import { makeCalApiRequest } from '@/utils/cal/cal-api-utils'
import { env } from '@/lib/env'

export async function GET(request: Request) {
  try {
    const clientId = env.NEXT_PUBLIC_CAL_CLIENT_ID
    const url = new URL(request.url)
    const directFetch = url.searchParams.get('directFetch') === 'true'
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'CAL_CLIENT_ID is not configured' },
        { status: 400 }
      )
    }

    // If directFetch is true, bypass makeCalApiRequest and use fetch directly
    // This can help diagnose if there's any issue with our utility function
    if (directFetch) {
      const baseUrl = 'https://api.cal.com/v2'
      const endpoint = `/oauth-clients/${clientId}/users`
      const requestUrl = `${baseUrl}${endpoint}`
      
      // Use the same headers as Postman would
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-cal-client-id': clientId,
          'x-cal-secret-key': env.CAL_CLIENT_SECRET || '',
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Cal.com API request failed: ${JSON.stringify(error)}`)
      }
      
      const result = await response.json()
      return NextResponse.json(result)
    }

    // Use our standard utility function
    const result = await makeCalApiRequest({
      endpoint: `/oauth-clients/${clientId}/users`,
      method: 'GET'
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[CAL_GET_MANAGED_USERS_ERROR]', {
      error: error?.message || error,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch managed users' },
      { status: error?.status || 500 }
    )
  }
}
