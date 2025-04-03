/**
 * Cal.com Managed Users API - Create Managed User
 * 
 * This API route creates a new managed user in Cal.com's API v2.
 * It uses the client ID and secret from environment variables.
 */

import { NextResponse } from 'next/server'
import { makeCalApiRequest } from '@/utils/cal/cal-api-utils'
import { env } from '@/lib/env'

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json()
    const clientId = env.NEXT_PUBLIC_CAL_CLIENT_ID

    // Validate required fields
    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: 'Email and name are required fields' },
        { status: 400 }
      )
    }

    if (!clientId) {
      return NextResponse.json(
        { error: 'CAL_CLIENT_ID is not configured' },
        { status: 400 }
      )
    }

    // Create the payload with proper defaults
    const payload = {
      email: body.email,
      name: body.name,
      timeFormat: body.timeFormat || 12,
      weekStart: body.weekStart || 'Monday',
      timeZone: body.timeZone || 'America/Denver',
      locale: body.locale || 'en',
      ...(body.avatarUrl && { avatarUrl: body.avatarUrl })
    }

    console.log('[CAL_CREATE_MANAGED_USER]', {
      clientId,
      ...payload,
      timestamp: new Date().toISOString()
    })

    // Make the API request to Cal.com
    const result = await makeCalApiRequest({
      endpoint: `/oauth-clients/${clientId}/users`,
      method: 'POST',
      body: payload
    })

    console.log('[CAL_CREATE_MANAGED_USER_SUCCESS]', {
      userId: result.data.user.id,
      email: result.data.user.email,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[CAL_CREATE_MANAGED_USER_ERROR]', {
      error: error?.message || error,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { error: error?.message || 'Failed to create managed user' },
      { status: error?.status || 500 }
    )
  }
} 