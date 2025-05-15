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

// Placeholder for actual role checking logic if needed by hasRequiredRole
const hasRequiredRole = (path: string, systemRole: string, capabilities: string[]): boolean => {
  if (path.startsWith('/admin')) {
    return systemRole === 'SYSTEM_OWNER' || systemRole === 'SYSTEM_MODERATOR';
  }
  return true; // Default to true if no specific role check for path
};

/**
 * Enhanced middleware that combines Clerk auth with role verification
 */
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next.js specific paths and common public assets to pass through early
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/public/') || // Assuming /public folder exists
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.webp')
  ) {
    return NextResponse.next();
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // For all non-public routes, authentication is required.
  const { userId } = getAuth(req); // getAuth is synchronous

  if (!userId) {
    console.log(`[AUTH_MIDDLEWARE] No userId, redirecting to sign-in for path: ${pathname}`);
    return redirectToSignIn(req);
  }

  // If the route is a protected PAGE (not an API route handled above by public check or its own auth)
  if (isProtectedRoute(pathname)) {
    try {
      const supabase = createAuthClient();
      const { data: user, error } = await supabase
        .from('User')
        .select('systemRole, capabilities')
        .eq('userId', userId)
        .single();

      if (error || !user) {
        console.error('[AUTH_MIDDLEWARE_ERROR] Role verification failed:', {
          code: 'ROLE_VERIFICATION_ERROR',
          message: error?.message || 'User not found during role verification in middleware',
          context: { userId, path: pathname },
          timestamp: new Date().toISOString()
        });
        return redirectToError(req, 'unauthorized_role_check');
      }

      if (!hasRequiredRole(pathname, user.systemRole as string, (user.capabilities || []) as string[])) {
        console.warn(`[AUTH_MIDDLEWARE_FORBIDDEN] User ${userId} does not have required role for ${pathname}`);
        return redirectToError(req, 'forbidden_role');
      }
    } catch (error) {
      console.error('[AUTH_MIDDLEWARE_CATCH_ERROR] Error in protected route check:', {
        code: 'MIDDLEWARE_PROTECTED_ROUTE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error in protected route check',
        context: { userId, path: pathname },
        timestamp: new Date().toISOString()
      });
      return redirectToError(req, 'server_error_middleware');
    }
  }

  return NextResponse.next();
}

// Helper functions
function isPublicRoute(path: string): boolean {
  const publicPaths = [
    '/',
    '/sign-in',
    '/sign-up',
    '/api/webhooks',        // General webhooks (e.g., Clerk)
    '/api/auth/setup-user', // Used in onboarding
    '/api/user/context',    // Used by client to get auth context
    '/error',               // Error page should be public
  ];

  return publicPaths.some(route => path === route || path.startsWith(route + '/'));
}

function isProtectedRoute(path: string): boolean {
  // Ensure API routes like /api/user/context are NOT treated as protected pages here
  // This list should be for pages that require a user session and potentially role checks.
  const pageRoutes = [
    '/dashboard',
    '/admin',
    '/settings'
  ];
  return pageRoutes.some(route => path.startsWith(route)) && !path.startsWith('/api/');
}

function redirectToSignIn(req: NextRequest) {
  const signInUrl = new URL('/sign-in', req.url);
  signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(signInUrl);
}

function redirectToError(req: NextRequest, code: string) {
  const errorUrl = new URL('/error', req.url);
  errorUrl.searchParams.set('code', code);
  errorUrl.searchParams.set('from', req.nextUrl.pathname);
  return NextResponse.redirect(errorUrl);
}

function updateMetrics(operation: string, data: { duration: number, error?: Error }) {
  const metric = metrics.get(operation) || { hits: 0, misses: 0, errors: 0, latency: [] };
  
  if (data.error) {
    metric.errors++;
    metric.misses++;
  } else {
    metric.hits++;
  }
  
  metric.latency.push(data.duration);
  if (metric.latency.length > 100) metric.latency.shift();
  
  metrics.set(operation, metric);
}
