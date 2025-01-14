import { clerkMiddleware, getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Roles that can access Calendly features
const CALENDLY_ROLES = ['coach', 'admin'] as const
type CalendlyRole = typeof CALENDLY_ROLES[number]

// Routes that require Calendly access
const CALENDLY_ROUTES = [
  '/api/calendly/event-types',
  '/api/calendly/scheduled-events',
  '/api/calendly/availability-schedules',
  '/api/calendly/busy-times',
  '/api/calendly/available-times',
  '/api/calendly/invitees',
] as const

const middleware = clerkMiddleware((req: NextRequest) => {
  const auth = getAuth(req)
  
  // Handle authentication
  if (!auth.userId && !auth.isPublicRoute) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Check if trying to access Calendly routes
  const isCalendlyRoute = CALENDLY_ROUTES.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  if (isCalendlyRoute) {
    // Get user's role from custom Clerk claims
    const role = auth.sessionClaims?.role as CalendlyRole | undefined

    // Check if user has required role
    if (!role || !CALENDLY_ROLES.includes(role)) {
      return new NextResponse(
        'Access denied. Required role: coach or admin',
        { status: 403 }
      )
    }

    // Add role to headers for downstream use
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-role', role)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
})

export default middleware

// Configure Middleware Matcher
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}