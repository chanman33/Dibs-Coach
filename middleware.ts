import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ROLES } from './utils/roles/roles'

// Roles that can access Calendly features
const CALENDLY_ROLES = [ROLES.REALTOR_COACH, ROLES.LOAN_OFFICER_COACH, ROLES.ADMIN] as const
type CalendlyRole = typeof CALENDLY_ROLES[number]

// Routes that require Calendly access
const CALENDLY_ROUTES = [
  // Event endpoints
  '/api/calendly/events',
  '/api/calendly/events/types',
  '/api/calendly/events/scheduled',
  '/api/calendly/events/cancel',
  '/api/calendly/events/no-shows',
  // Availability endpoints
  '/api/calendly/availability',
  '/api/calendly/availability/schedules',
  '/api/calendly/availability/busy',
  '/api/calendly/availability/free',
  // Other endpoints
  '/api/calendly/invitees',
  '/api/calendly/sessions'
] as const

// This ensures public routes are properly typed
const PUBLIC_ROUTES = [
  '/api/auth/webhook',
  '/api/calendly/webhooks'
] as const

export default clerkMiddleware((auth) => {
  const requestHeaders = new Headers(auth.request.headers)
  
  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    auth.request.nextUrl.pathname.startsWith(route)
  )

  // Handle authentication
  if (!auth.userId && !isPublicRoute) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Check if trying to access Calendly routes
  const isCalendlyRoute = CALENDLY_ROUTES.some(route => 
    auth.request.nextUrl.pathname.startsWith(route)
  )

  if (isCalendlyRoute && !isPublicRoute) {
    const role = auth.sessionClaims?.role as CalendlyRole | undefined
    const userId = auth.sessionClaims?.userId as string | undefined

    if (!role || !CALENDLY_ROLES.includes(role) || !userId) {
      return new NextResponse(
        'Access denied. Required role: coach or admin',
        { status: 403 }
      )
    }

    // Add auth info to headers for downstream use
    requestHeaders.set('x-user-role', role)
    requestHeaders.set('x-user-id', userId)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
})

// Configure Middleware Matcher
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}