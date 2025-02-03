import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { ROLES } from '@/utils/roles/roles'

export async function withRoleCheck(
  request: NextRequest,
  allowedRoles: string[]
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Authentication required', { status: 401 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get user's role from database
    const { data: user, error } = await supabase
      .from('User')
      .select('role')
      .eq('userId', userId)
      .single()

    if (error || !user) {
      console.error('[ROLE_CHECK_ERROR] User not found:', userId)
      return new NextResponse('User not found', { status: 404 })
    }

    const role = user.role

    if (!allowedRoles.includes(role)) {
      return new NextResponse(
        `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        { status: 403 }
      )
    }

    // Add role to headers for downstream use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-role', role)
    requestHeaders.set('x-user-id', userId)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('[ROLE_CHECK_ERROR]', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// Role-specific middleware
export async function withCoachOnly(request: NextRequest) {
  return withRoleCheck(request, [ROLES.COACH])
}

export async function withMenteeOnly(request: NextRequest) {
  return withRoleCheck(request, [ROLES.MENTEE])
}

export async function withAdminOnly(request: NextRequest) {
  return withRoleCheck(request, [ROLES.ADMIN])
}

export async function withCoachOrAdmin(request: NextRequest) {
  return withRoleCheck(request, [ROLES.COACH, ROLES.ADMIN])
}

export async function withMenteeOrAdmin(request: NextRequest) {
  return withRoleCheck(request, [ROLES.MENTEE, ROLES.ADMIN])
} 