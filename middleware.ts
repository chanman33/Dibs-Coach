import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth/auth-client'

// Define route matchers
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/auth/(.*)',
  '/contact-sales(.*)',
  '/coaches(.*)',
  '/pricing(.*)',
  '/about(.*)',
  '/blog(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/faq(.*)',
  '/((?!dashboard|admin|coach|settings).*)'
])

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/settings(.*)'
])

const isAdminRoute = createRouteMatcher([
  '/admin(.*)'
])

const isCoachRoute = createRouteMatcher([
  '/coach(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  try {
    // Public routes are always accessible
    if (isPublicRoute(req)) {
      return NextResponse.next()
    }

    // Get auth state
    const authState = await auth()

    // Protected routes require authentication
    if (isProtectedRoute(req) && !authState.userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }

    // For admin and coach routes, verify roles in Supabase
    if (isAdminRoute(req) || isCoachRoute(req)) {
      if (!authState.userId) {
        return NextResponse.redirect(new URL('/sign-in', req.url))
      }

      const supabase = createAuthClient()
      const { data: user, error } = await supabase
        .from('User')
        .select('systemRole, capabilities')
        .eq('userId', authState.userId)
        .single()

      if (error || !user) {
        console.error('[AUTH_ERROR]', {
          code: 'ROLE_VERIFICATION_ERROR',
          message: error?.message || 'User not found',
          context: { userId: authState.userId, path: req.nextUrl.pathname },
          timestamp: new Date().toISOString()
        })
        return NextResponse.redirect(new URL('/not-authorized', req.url))
      }

      // Verify admin access
      if (isAdminRoute(req) && 
          user.systemRole !== 'SYSTEM_OWNER' && 
          user.systemRole !== 'SYSTEM_MODERATOR') {
        return NextResponse.redirect(new URL('/not-authorized', req.url))
      }

      // Verify coach access
      if (isCoachRoute(req) && 
          !user.capabilities?.includes('COACH')) {
        return NextResponse.redirect(new URL('/not-authorized', req.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error('[AUTH_ERROR]', {
      code: 'MIDDLEWARE_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      context: { path: req.nextUrl.pathname },
      timestamp: new Date().toISOString()
    })
    return NextResponse.redirect(new URL('/error?code=server_error', req.url))
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Include API routes
    '/(api|trpc)(.*)'
  ]
}