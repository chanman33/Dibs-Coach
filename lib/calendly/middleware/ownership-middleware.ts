import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface OwnershipConfig {
  table: string
  resourceIdParam: string
  userIdField?: string
  additionalFields?: string[]
}

interface ResourceData {
  id: number
  userDbId?: number
  [key: string]: unknown
}

export async function withOwnershipCheck(
  request: NextRequest,
  config: OwnershipConfig
) {
  try {
    // Get authenticated user
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Extract resource ID from URL or request body
    const url = new URL(request.url)
    const resourceId = url.pathname.split('/').pop() || url.searchParams.get(config.resourceIdParam)

    if (!resourceId) {
      return new NextResponse('Resource ID not provided', { status: 400 })
    }

    // Get user's database ID from Supabase
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            return cookie?.value
          },
        },
      }
    )

    // First get the user's database ID
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single()

    if (userError || !user) {
      console.error('[OWNERSHIP_CHECK_ERROR]', userError || 'User not found')
      return new NextResponse('User not found', { status: 404 })
    }

    // Check resource ownership
    const fields = ['id', config.userIdField || 'userDbId', ...(config.additionalFields || [])]
    const { data: resource, error: resourceError } = await supabase
      .from(config.table)
      .select(fields.join(','))
      .eq('id', resourceId)
      .single()

    if (resourceError) {
      console.error('[OWNERSHIP_CHECK_ERROR]', resourceError)
      return new NextResponse('Resource not found', { status: 404 })
    }
    const userIdField = config.userIdField || 'userDbId'
    
    // Validate resource has required fields before type casting
    if (!resource || typeof resource !== 'object' || !('id' in resource)) {
      console.error('[OWNERSHIP_CHECK_ERROR] Invalid resource format')
      return new NextResponse('Resource validation failed', { status: 500 })
    }

    const typedResource = resource as ResourceData
    if (typedResource[userIdField] !== user.id) {
      return new NextResponse('Access denied. You do not own this resource', { status: 403 })
    }

    // Add resource data to headers for downstream use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-resource-owner-id', user.id.toString())
    if (config.additionalFields) {
      config.additionalFields.forEach(field => {
        const value = typedResource[field]
        if (value !== undefined && value !== null) {
          requestHeaders.set(`x-resource-${field}`, String(value))
        }
      })
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('[OWNERSHIP_CHECK_ERROR]', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// Specific ownership checks
export async function withEventOwnership(request: NextRequest) {
  return withOwnershipCheck(request, {
    table: 'CalendlyEvent',
    resourceIdParam: 'eventId',
    additionalFields: ['status', 'eventType']
  })
}

export async function withSessionOwnership(request: NextRequest) {
  return withOwnershipCheck(request, {
    table: 'CalendlySession',
    resourceIdParam: 'sessionId',
    additionalFields: ['status', 'eventTypeId']
  })
}

export async function withInviteeOwnership(request: NextRequest) {
  return withOwnershipCheck(request, {
    table: 'CalendlyInvitee',
    resourceIdParam: 'inviteeId',
    additionalFields: ['status', 'eventId']
  })
} 