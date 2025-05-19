import { authMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from "next/server"
import { createAuthClient } from './utils/auth/auth-client'

const ONBOARDING_ROUTE = '/onboarding'

// Define route matchers
const publicPaths = [
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sign-out(.*)',
  '/profile/(.*)',
  '/api/webhooks(.*)',      // Public webhooks
  '/api/auth/(.*)',       // Clerk auth routes
  '/api/cal/webhook(.*)', // Public Cal webhooks
  '/contact-sales(.*)',
  '/coaches(.*)',
  '/pricing(.*)',
  '/about(.*)',
  '/blog(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/faq(.*)',
  '/case-studies(.*)',
  '/business-solutions(.*)',
  '/become-coach(.*)',
  '/how-it-works(.*)',
  '/not-authorized(.*)', // Allow access to the not-authorized page
  '/((?!dashboard|admin|coach|settings).*)', // Catch-all for non-protected pages (ensure this doesn't conflict)
]

export default authMiddleware({
  publicRoutes: publicPaths,
  // Keep ignored routes minimal - only routes that should COMPLETELY bypass middleware
  ignoredRoutes: [
    "/api/cal/test(.*)" // Assuming test routes should bypass middleware entirely
    // Removed /api/webhook(.*) and /api/cal/webhook(.*) as they are in publicPaths
  ],
  afterAuth: async (auth, req) => {
    // Block access to test routes in production (Still needed if ignoredRoutes doesn't cover all cases or for clarity)
    if (process.env.NODE_ENV === 'production' && req.nextUrl.pathname.startsWith('/api/cal/test')) {
      return new NextResponse('Test routes are not available in production', { status: 403 });
    }

    // Allow public routes
    // Check if the current path matches any public path pattern
    const isPublic = publicPaths.some(path => {
      // Handle simple string paths
      if (!path.includes('(.*)') && !path.includes('/?((?!)')) {
        return path === req.nextUrl.pathname;
      }
      // Handle regex-like patterns (e.g., /sign-in(.*) or /api/webhooks(.*))
      if (path.includes('(.*)')) {
        const basePath = path.replace('(.*)', '');
        // Ensure we match the start exactly for regex patterns
        return req.nextUrl.pathname.startsWith(basePath);
      }
      // Handle negative lookahead patterns (e.g., /((?!dashboard|admin).*) )
      if (path.includes('/?((?!)')) { // Simplified check for lookahead structure
        try {
          // Attempt to create a RegExp from the path pattern
          // Ensure special characters are escaped correctly for RegExp
          const regexPattern = `^${path.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`;
          const pattern = new RegExp(regexPattern);
          return pattern.test(req.nextUrl.pathname);
        } catch (e) {
          console.error(`[MIDDLEWARE_REGEX_ERROR] Invalid regex pattern: ${path}`, e);
          return false; // Treat invalid patterns as non-matching
        }
      }
      return false;
    });

    if (!auth.userId && isPublic) {
      return NextResponse.next()
    }
    
    // Require authentication for non-public routes
    if (!auth.userId) {
      // Construct the sign-in URL with a redirect back to the original request URL
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname) // Use pathname for cleaner redirect
      return NextResponse.redirect(signInUrl)
    }
    
    // Handle completed sign-up -> redirect to onboarding
    // Check if the user is authenticated and the path starts with /sign-up
    if (auth.userId && req.nextUrl.pathname.startsWith('/sign-up')) {
      return NextResponse.redirect(new URL(ONBOARDING_ROUTE, req.url))
    }
    
    // For authenticated users on protected routes, verify user exists in database
    // Ensure /api/user/context is never treated as a protected route
    if (req.nextUrl.pathname.startsWith('/api/user/context')) {
      return NextResponse.next();
    }
    const isProtectedRoute = [
      '/dashboard',
      '/settings',
      '/admin',
      '/coach'
    ].some(p => req.nextUrl.pathname.startsWith(p)) || 
    (req.nextUrl.pathname.startsWith('/api') && 
     !req.nextUrl.pathname.startsWith('/api/webhooks') && 
     !req.nextUrl.pathname.startsWith('/api/auth') && 
     !req.nextUrl.pathname.startsWith('/api/cal/webhook') &&
     !req.nextUrl.pathname.startsWith('/api/cal/test'));
    
    if (isProtectedRoute) {
      try {
        const supabase = createAuthClient()
        const { data: user, error } = await supabase
          .from('User')
          .select('ulid') // Only select what's needed
          .eq('userId', auth.userId)
          .maybeSingle() // Use maybeSingle to handle user not found gracefully
          
        // If user doesn't exist in database (and it's required), redirect to onboarding
        if (!user && !error) { // Check for !user and no error
          console.warn('[AUTH_MIDDLEWARE] User not found in DB, redirecting to onboarding:', { userId: auth.userId, path: req.nextUrl.pathname });
          // Avoid redirect loop if already on onboarding
          if (req.nextUrl.pathname !== ONBOARDING_ROUTE) {
            return NextResponse.redirect(new URL(ONBOARDING_ROUTE, req.url))
          }
        } else if (error) {
          // Rethrow unexpected database errors
          throw error;
        }
      } catch (error) {
        console.error('[AUTH_MIDDLEWARE_ERROR]', {
          code: 'DB_CHECK_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error during DB check',
          context: { userId: auth.userId, path: req.nextUrl.pathname },
          timestamp: new Date().toISOString()
        })
        // Redirect to a generic error page or handle appropriately
        return NextResponse.redirect(new URL('/error?code=middleware_error', req.url))
      }
    }
    
    // If all checks pass, allow the request to proceed
    return NextResponse.next()
  }
})

// Updated config matcher
export const config = {
  matcher: [
    // Exclude:
    // - _next/static (Next.js internals)
    // - _next/image (image optimization)
    // - favicon.ico
    // - api/webhooks, api/cal/webhook (public APIs)
    // - any file with an extension (e.g., .jpg, .png, .css, .js, etc.)
    // - root path "/"
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/cal/webhook|.*\\..*).*)',
    '/', // Explicitly match root
  ],
};