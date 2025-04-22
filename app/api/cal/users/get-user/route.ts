/**
 * Cal.com Managed Users API - Get Specific User
 * 
 * This API route fetches a specific managed user by ID from Cal.com's API v2.
 * It uses the client ID and secret from environment variables.
 */

import { NextResponse } from 'next/server'
import { makeCalApiRequest } from '@/utils/cal/cal-api-utils'
import { env } from '@/lib/env'
import { getAuthenticatedUserUlid } from '@/utils/auth'

export async function GET(request: Request) {
  try {
    const clientId = env.NEXT_PUBLIC_CAL_CLIENT_ID
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!clientId) {
      return NextResponse.json(
        { error: 'CAL_CLIENT_ID is not configured' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      )
    }

    // Authenticate the user using the centralized helper
    const authResult = await getAuthenticatedUserUlid()
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error.message },
        { status: authResult.error.code === 'UNAUTHORIZED' ? 401 : 500 }
      )
    }

    const result = await makeCalApiRequest({
      endpoint: `/oauth-clients/${clientId}/users/${userId}`,
      method: 'GET'
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[CAL_GET_MANAGED_USER_ERROR]', {
      error: error?.message || error,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch managed user' },
      { status: error?.status || 500 }
    )
  }
}
