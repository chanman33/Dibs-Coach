import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAuthClient } from './auth-client'
import { hasSystemRole, hasOrgRole, hasPermission, hasCapability } from '../roles/roles'

const metrics = new Map<string, {
  hits: number
  misses: number
  errors: number
  latency: number[]
}>()

/**
 * Middleware configuration for auth and role verification
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

/**
 * Enhanced middleware that combines Clerk auth with role verification
 */
export default async function middleware(req: NextRequest) {
  const { userId } = await getAuth(req)

  // Handle public routes
  if (isPublicRoute(req.nextUrl.pathname)) {
    return NextResponse.next()
  }

  // Require authentication
  if (!userId) {
    return redirectToSignIn(req)
  }

  // For protected routes, verify roles if needed
  if (isProtectedRoute(req.nextUrl.pathname)) {
    try {
      const supabase = createAuthClient()
      const { data: user, error } = await supabase
        .from('User')
        .select('systemRole, capabilities')
        .eq('userId', userId)
        .single()

      if (error || !user) {
        console.error('[AUTH_ERROR]', {
          code: 'ROLE_VERIFICATION_ERROR',
          message: error?.message || 'User not found',
          context: { userId, path: req.nextUrl.pathname },
          timestamp: new Date().toISOString()
        })
        return redirectToError(req, 'unauthorized')
      }

      // Check role requirements
      if (!hasRequiredRole(req.nextUrl.pathname, user.systemRole, user.capabilities || [])) {
        return redirectToError(req, 'forbidden')
      }
    } catch (error) {
      console.error('[AUTH_ERROR]', {
        code: 'MIDDLEWARE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        context: { userId, path: req.nextUrl.pathname },
        timestamp: new Date().toISOString()
      })
      return redirectToError(req, 'server_error')
    }
  }

  return NextResponse.next()
}

// Helper functions
function isPublicRoute(path: string): boolean {
  return [
    '/',
    '/sign-in',
    '/sign-up',
    '/api/webhooks',
  ].some(route => path.startsWith(route))
}

function isProtectedRoute(path: string): boolean {
  return [
    '/dashboard',
    '/admin',
    '/settings'
  ].some(route => path.startsWith(route))
}

function redirectToSignIn(req: NextRequest) {
  return NextResponse.redirect(new URL('/sign-in', req.url))
}

function redirectToError(req: NextRequest, code: string) {
  return NextResponse.redirect(new URL(`/error?code=${code}`, req.url))
}

function hasRequiredRole(path: string, systemRole: string, capabilities: string[]): boolean {
  // Add your role verification logic here based on path patterns
  // Example:
  if (path.startsWith('/admin')) {
    return systemRole === 'SYSTEM_OWNER' || systemRole === 'SYSTEM_MODERATOR'
  }
  return true
}

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
