import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'
import { NextResponse } from "next/server"
import { createAuthClient } from './utils/auth/auth-client'

// Define route matchers
const PUBLIC_ROUTES = [
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
]

const PROTECTED_ROUTES = [
  '/dashboard(.*)',
  '/settings(.*)',
  '/admin(.*)',
  '/coach(.*)'
]

const ONBOARDING_ROUTE = '/onboarding'

const isPublicRoute = createRouteMatcher(PUBLIC_ROUTES)
const isProtectedRoute = createRouteMatcher(PROTECTED_ROUTES)

// Metrics tracking
const metrics = new Map<string, {
  hits: number
  misses: number
  errors: number
  latency: number[]
}>()

export default clerkMiddleware(async (auth, request) => {
  const start = Date.now()
  const requestId = Math.random().toString(36).substring(7)
  
  try {
    // Handle public routes
    if (isPublicRoute(request)) {
      updateMetrics('public_route', { duration: Date.now() - start })
      return NextResponse.next()
    }

    // Get auth state
    const { userId } = await auth()

    // Require authentication for all other routes
    if (!userId) {
      updateMetrics('auth_required', { duration: Date.now() - start })
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    // Special handling for sign-up to onboarding redirect
    if (request.nextUrl.pathname.startsWith('/sign-up') && userId) {
      updateMetrics('signup_redirect', { duration: Date.now() - start })
      return NextResponse.redirect(new URL(ONBOARDING_ROUTE, request.url))
    }

    // For protected routes, verify user exists in database
    if (isProtectedRoute(request)) {
      try {
        const supabase = createAuthClient()
        const { data: user, error } = await supabase
          .from('User')
          .select('ulid')
          .eq('userId', userId)
          .maybeSingle()

        // If user doesn't exist in database, redirect to onboarding
        if (!user || error) {
          updateMetrics('new_user_redirect', { duration: Date.now() - start })
          return NextResponse.redirect(new URL(ONBOARDING_ROUTE, request.url))
        }
      } catch (error) {
        // Always log errors
        console.error('[AUTH_ERROR]', {
          code: 'MIDDLEWARE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          context: { userId, path: request.nextUrl.pathname }
        })
        updateMetrics('middleware_error', { duration: Date.now() - start, error: error as Error })
        return NextResponse.redirect(new URL('/error?code=server_error', request.url))
      }
    }

    updateMetrics('success', { duration: Date.now() - start })
    return NextResponse.next()
  } catch (error) {
    updateMetrics('unhandled_error', { duration: Date.now() - start, error: error as Error })
    // Always log errors
    console.error('[UNHANDLED_AUTH_ERROR]', {
      error,
      path: request.nextUrl.pathname
    })
    return NextResponse.redirect(new URL('/error?code=server_error', request.url))
  }
})

function updateMetrics(operation: string, data: { duration: number, error?: Error }) {
  const metric = metrics.get(operation) || { hits: 0, misses: 0, errors: 0, latency: [] }
  
  if (data.error) {
    metric.errors++
    metric.misses++
  } else {
    metric.hits++
  }
  
  metric.latency.push(data.duration)
  if (metric.latency.length > 100) metric.latency.shift()
  
  metrics.set(operation, metric)
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Include API routes
    '/(api|trpc)(.*)'
  ]
}