export const dynamic = 'force-dynamic';

/**
 * Cal.com Managed Users API - Update User
 * 
 * This API route updates an existing managed user in Cal.com's API v2.
 * It uses the client ID and secret from environment variables.
 */

import { NextResponse } from 'next/server'
import { makeCalApiRequest } from '@/utils/cal/cal-api-utils'
import { env } from '@/lib/env'
import { getAuthenticatedUserUlid } from '@/utils/auth'

export async function PATCH(request: Request) {
  try {
    // Get the request body and query parameters
    const body = await request.json()
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const clientId = env.NEXT_PUBLIC_CAL_CLIENT_ID

    // Validate required parameters
    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      )
    }

    if (!clientId) {
      return NextResponse.json(
        { error: 'CAL_CLIENT_ID is not configured' },
        { status: 400 }
      )
    }
    
    // Authenticate the user using the centralized helper
    const authResult = await getAuthenticatedUserUlid();
    if (authResult.error || !authResult.data) {
      return NextResponse.json(
        { error: authResult.error?.message || 'Authentication failed' },
        { status: authResult.error?.code === 'UNAUTHORIZED' ? 401 : 500 }
      );
    }

    // Create the payload with only the fields that are provided
    const payload: Record<string, any> = {}
    
    if (body.email !== undefined) payload.email = body.email
    if (body.name !== undefined) payload.name = body.name
    if (body.timeZone !== undefined) payload.timeZone = body.timeZone
    if (body.weekStart !== undefined) payload.weekStart = body.weekStart
    if (body.timeFormat !== undefined) payload.timeFormat = body.timeFormat
    if (body.defaultScheduleId !== undefined) payload.defaultScheduleId = body.defaultScheduleId
    if (body.locale !== undefined) payload.locale = body.locale
    if (body.avatarUrl !== undefined) payload.avatarUrl = body.avatarUrl

    // If no fields were provided, return an error
    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: 'At least one field to update must be provided' },
        { status: 400 }
      )
    }

    console.log('[CAL_UPDATE_MANAGED_USER]', {
      clientId,
      userId,
      payload,
      timestamp: new Date().toISOString()
    })

    // Make the API request to Cal.com
    const result = await makeCalApiRequest({
      endpoint: `/oauth-clients/${clientId}/users/${userId}`,
      method: 'PATCH',
      body: payload
    })

    console.log('[CAL_UPDATE_MANAGED_USER_SUCCESS]', {
      userId,
      updatedFields: Object.keys(payload),
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[CAL_UPDATE_MANAGED_USER_ERROR]', {
      error: error?.message || error,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { error: error?.message || 'Failed to update managed user' },
      { status: error?.status || 500 }
    )
  }
}
