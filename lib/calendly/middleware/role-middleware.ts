import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function withRoleCheck(
  request: NextRequest,
  allowedRoles: string[]
) {
  try {
    const { sessionClaims } = await auth()
    const role = sessionClaims?.role as string | undefined

    if (!role || !allowedRoles.includes(role)) {
      return new NextResponse(
        `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        { status: 403 }
      )
    }

    // Add role to headers for downstream use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-role', role)

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
  return withRoleCheck(request, ['coach'])
}

export async function withRealtorOnly(request: NextRequest) {
  return withRoleCheck(request, ['realtor'])
}

export async function withAdminOnly(request: NextRequest) {
  return withRoleCheck(request, ['admin'])
}

export async function withCoachOrAdmin(request: NextRequest) {
  return withRoleCheck(request, ['coach', 'admin'])
}

export async function withRealtorOrAdmin(request: NextRequest) {
  return withRoleCheck(request, ['realtor', 'admin'])
} 