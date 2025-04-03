/**
 * Cal.com Managed Users API - Delete User
 * 
 * This API route deletes a managed user by ID from Cal.com's API v2.
 * It uses the client ID and secret from environment variables.
 */

import { NextResponse } from 'next/server'
import { makeCalApiRequest } from '@/utils/cal/cal-api-utils'
import { env } from '@/lib/env'

export async function DELETE(request: Request) {
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

    const result = await makeCalApiRequest({
      endpoint: `/oauth-clients/${clientId}/users/${userId}`,
      method: 'DELETE'
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[CAL_DELETE_MANAGED_USER_ERROR]', {
      error: error?.message || error,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { error: error?.message || 'Failed to delete managed user' },
      { status: error?.status || 500 }
    )
  }
}
