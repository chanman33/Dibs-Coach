import { authMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from "next/server"
import { createAuthClient } from './utils/auth/auth-client'

// Define route matchers
const publicPaths = [
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

const ONBOARDING_ROUTE = '/onboarding'

// Metrics tracking
const metrics = new Map<string, {
  hits: number
  misses: number
  errors: number
  latency: number[]
}>()

// Only log every N requests to reduce noise
const METRICS_LOG_FREQUENCY = 20
let requestCounter = 0

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
  
  // Only log metrics in development for errors or periodically
  if (process.env.NODE_ENV === 'development') {
    if (data.error || (operation !== 'success' && operation !== 'public_route')) {
      // Always log errors and important operations
      console.log(`[METRICS_${operation.toUpperCase()}]`, {
        duration: data.duration,
        error: data.error?.message,
        timestamp: new Date().toISOString()
      })
    } else if (++requestCounter % METRICS_LOG_FREQUENCY === 0) {
      // Log success metrics occasionally to reduce console noise
      console.log(`[METRICS_SUMMARY]`, {
        success: metrics.get('success')?.hits || 0,
        publicRoutes: metrics.get('public_route')?.hits || 0,
        errors: Array.from(metrics.values()).reduce((sum, m) => sum + m.errors, 0),
        avgLatency: Array.from(metrics.values())
          .flatMap(m => m.latency)
          .reduce((sum, latency) => sum + latency, 0) / 
          Math.max(1, Array.from(metrics.values()).flatMap(m => m.latency).length),
        timestamp: new Date().toISOString()
      })
    }
  }
}

export default authMiddleware({
  publicRoutes: publicPaths,
  afterAuth: async (auth, req) => {
    const start = Date.now()
    
    // Allow public routes
    if (!auth.userId && publicPaths.some(path => {
      if (path.includes('(.*)')) {
        const basePath = path.replace('(.*)', '')
        return req.nextUrl.pathname.startsWith(basePath)
      }
      return path === req.nextUrl.pathname
    })) {
      updateMetrics('public_route', { duration: Date.now() - start })
      return NextResponse.next()
    }
    
    // Require authentication
    if (!auth.userId) {
      updateMetrics('auth_required', { duration: Date.now() - start })
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
    
    // Handle sign-up to onboarding redirect
    if (req.nextUrl.pathname.startsWith('/sign-up') && auth.userId) {
      updateMetrics('signup_redirect', { duration: Date.now() - start })
      return NextResponse.redirect(new URL(ONBOARDING_ROUTE, req.url))
    }
    
    // For protected routes, verify user exists in database
    const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') ||
                            req.nextUrl.pathname.startsWith('/settings') ||
                            req.nextUrl.pathname.startsWith('/admin') ||
                            req.nextUrl.pathname.startsWith('/coach')
    
    if (isProtectedRoute) {
      try {
        const supabase = createAuthClient()
        const { data: user, error } = await supabase
          .from('User')
          .select('ulid')
          .eq('userId', auth.userId)
          .maybeSingle()
          
        // If user doesn't exist in database, redirect to onboarding
        if (!user || error) {
          updateMetrics('new_user_redirect', { duration: Date.now() - start })
          return NextResponse.redirect(new URL(ONBOARDING_ROUTE, req.url))
        }
      } catch (error) {
        // Only log errors
        console.error('[AUTH_ERROR]', {
          code: 'MIDDLEWARE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          context: { userId: auth.userId, path: req.nextUrl.pathname }
        })
        updateMetrics('middleware_error', { duration: Date.now() - start, error: error as Error })
        return NextResponse.redirect(new URL('/error?code=server_error', req.url))
      }
    }
    
    updateMetrics('success', { duration: Date.now() - start })
    return NextResponse.next()
  }
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - static files with extensions
     */
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)"
  ]
}