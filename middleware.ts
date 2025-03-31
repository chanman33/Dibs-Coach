import { authMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from "next/server"
import { createAuthClient } from './utils/auth/auth-client'

const ONBOARDING_ROUTE = '/onboarding'

// Define route matchers
const publicPaths = [
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/auth/(.*)',
  '/api/cal/(.*)',
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

export default authMiddleware({
  publicRoutes: publicPaths,
  ignoredRoutes: [
    "/api/webhook(.*)",
    "/api/cal/webhook(.*)",
    "/api/cal/test(.*)"
  ],
  afterAuth: async (auth, req) => {
    // Block access to test routes in production
    if (process.env.NODE_ENV === 'production' && req.nextUrl.pathname.startsWith('/api/cal/test')) {
      return new NextResponse('Test routes are not available in production', { status: 403 });
    }

    // Allow public routes
    if (!auth.userId && publicPaths.some(path => {
      if (path.includes('(.*)')) {
        const basePath = path.replace('(.*)', '')
        return req.nextUrl.pathname.startsWith(basePath)
      }
      return path === req.nextUrl.pathname
    })) {
      return NextResponse.next()
    }
    
    // Require authentication
    if (!auth.userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
    
    // Handle sign-up to onboarding redirect
    if (req.nextUrl.pathname.startsWith('/sign-up') && auth.userId) {
      return NextResponse.redirect(new URL(ONBOARDING_ROUTE, req.url))
    }
    
    // For protected routes, verify user exists in database
    const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') ||
                            req.nextUrl.pathname.startsWith('/settings') ||
                            req.nextUrl.pathname.startsWith('/admin') ||
                            req.nextUrl.pathname.startsWith('/coach') ||
                            (req.nextUrl.pathname.startsWith('/api') && 
                             !req.nextUrl.pathname.startsWith('/api/cal/') &&
                             !publicPaths.some(path => {
                               if (path.includes('(.*)')) {
                                 const basePath = path.replace('(.*)', '')
                                 return req.nextUrl.pathname.startsWith(basePath)
                               }
                               return path === req.nextUrl.pathname
                             }))
    
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
          return NextResponse.redirect(new URL(ONBOARDING_ROUTE, req.url))
        }
      } catch (error) {
        console.error('[AUTH_ERROR]', {
          code: 'MIDDLEWARE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          context: { userId: auth.userId, path: req.nextUrl.pathname }
        })
        return NextResponse.redirect(new URL('/error?code=server_error', req.url))
      }
    }
    
    return NextResponse.next()
  }
})

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
    "/api/cal/test/:path*"
  ]
}