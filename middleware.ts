import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SYSTEM_ROLES, USER_CAPABILITIES, hasCapability, type UserRoleContext } from './utils/roles/roles'
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Import config and define its type
type AppConfig = {
  auth: {
    enabled: boolean;
  };
  payments: {
    enabled: boolean;
  };
  roles: {
    enabled: boolean;
  };
};

const config: AppConfig = require('./config').default;

// Public marketing routes that don't require auth
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/pricing',
  '/blog',
  '/api/auth/webhook',
  '/api/calendly/webhooks'
] as const;

// Protected routes that require auth
const PROTECTED_ROUTES = [
  '/dashboard(.*)',
  '/settings(.*)',
  '/profile(.*)',
  '/apply-coach(.*)'
] as const;

// Role-specific route patterns
const COACH_ROUTES = ['/dashboard/coach(.*)'] as const;
const MENTEE_ROUTES = ['/dashboard/mentee(.*)'] as const;
const ADMIN_ROUTES = ['/dashboard/admin(.*)'] as const;

// Note: We keep SHARED_TOOL_ROUTES for direct access, though it should be rare
const SHARED_TOOL_ROUTES = ['/dashboard/tools(.*)'] as const;

let clerkMiddleware: any, createRouteMatcher: any;

if (config.auth.enabled) {
  try {
    ({ clerkMiddleware, createRouteMatcher } = require("@clerk/nextjs/server"));
  } catch (error) {
    console.warn("Clerk modules not available. Auth will be disabled.");
    config.auth.enabled = false;
  }
}

const isPublicRoute = (pathname: string) =>
  PUBLIC_ROUTES.some(route => pathname.startsWith(route));

const isProtectedRoute = (pathname: string) =>
  PROTECTED_ROUTES.some(route => pathname.match(route));

export default function middleware(req: NextRequest) {
  if (!config.auth.enabled) {
    return NextResponse.next();
  }

  return clerkMiddleware(async (auth: any) => {
    const resolvedAuth = await auth();
    const pathname = req.nextUrl.pathname;

    // Always allow public routes
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // Handle unauthenticated users trying to access protected routes
    if (!resolvedAuth.userId && isProtectedRoute(pathname)) {
      return resolvedAuth.redirectToSignIn();
    }

    // If user is authenticated and trying to access protected routes
    if (resolvedAuth.userId && isProtectedRoute(pathname)) {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
      );

      // Check if user exists in database
      const { data: user, error } = await supabase
        .from('User')
        .select('ulid, role, capabilities')
        .eq('userId', resolvedAuth.userId)
        .single();

      // If there's an error or user doesn't exist, redirect to error page
      if (error || !user) {
        console.error('[AUTH_ERROR] User not found in database:', resolvedAuth.userId);
        return NextResponse.redirect(new URL('/error?code=user_not_found', req.url));
      }

      const { role, ulid } = user;

      // Handle role-specific route access
      if (ADMIN_ROUTES.some(route => pathname.match(route)) && role !== SYSTEM_ROLES.SYSTEM_MODERATOR) {
        return new NextResponse('Access denied. Admin role required.', { status: 403 });
      }

      if (COACH_ROUTES.some(route => pathname.match(route)) && 
          !hasCapability({ systemRole: role, capabilities: user.capabilities || [] } as UserRoleContext, USER_CAPABILITIES.COACH)) {
        return new NextResponse('Access denied. Coach capability required.', { status: 403 });
      }

      if (MENTEE_ROUTES.some(route => pathname.match(route)) && 
          !hasCapability({ systemRole: role, capabilities: user.capabilities || [] } as UserRoleContext, USER_CAPABILITIES.MENTEE)) {
        return new NextResponse('Access denied. Mentee capability required.', { status: 403 });
      }

      // Handle shared tool routes - allow access for both coaches and mentees
      // This covers both direct /dashboard/tools/* access and role-specific /dashboard/{role}/tools/* access
      if (SHARED_TOOL_ROUTES.some(route => pathname.match(route)) || pathname.match(/\/dashboard\/(coach|mentee)\/tools\/.*/)) {
        const hasToolAccess = hasCapability({ systemRole: role, capabilities: user.capabilities || [] } as UserRoleContext, USER_CAPABILITIES.COACH) || 
                             hasCapability({ systemRole: role, capabilities: user.capabilities || [] } as UserRoleContext, USER_CAPABILITIES.MENTEE) ||
                             role === SYSTEM_ROLES.SYSTEM_MODERATOR;
        if (!hasToolAccess) {
          return new NextResponse('Access denied. Coach or Mentee capability required.', { status: 403 });
        }
      }

      // Add role and user identifiers to headers for downstream use
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-role', role);
      requestHeaders.set('x-user-id', resolvedAuth.userId);
      requestHeaders.set('x-user-ulid', ulid);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // If authenticated user tries to access auth pages, redirect to dashboard
    if (resolvedAuth.userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  })(req);
}

// Export middleware config
export const middlewareConfig = {
  matcher: [
    // Match all paths except static assets and api routes that don't need auth
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};