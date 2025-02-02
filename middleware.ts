import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLES } from './utils/roles/roles'
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

// Routes that require Calendly access
const CALENDLY_ROUTES = [
  '/api/calendly/events',
  '/api/calendly/events/types',
  '/api/calendly/events/scheduled',
  '/api/calendly/events/cancel',
  '/api/calendly/events/no-shows',
  '/api/calendly/availability',
  '/api/calendly/availability/schedules',
  '/api/calendly/availability/busy',
  '/api/calendly/availability/free',
  '/api/calendly/invitees',
  '/api/calendly/sessions'
] as const;

// Public routes that don't require auth
const PUBLIC_ROUTES = [
  '/api/auth/webhook',
  '/api/calendly/webhooks'
] as const;

// Role-specific route patterns
const COACH_ROUTES = ['/dashboard/(role-specific)/coach(.*)'] as const;
const MENTEE_ROUTES = ['/dashboard/(role-specific)/mentee(.*)'] as const;
const ADMIN_ROUTES = ['/dashboard/admin(.*)'] as const;

let clerkMiddleware: any, createRouteMatcher: any;

if (config.auth.enabled) {
  try {
    ({ clerkMiddleware, createRouteMatcher } = require("@clerk/nextjs/server"));
  } catch (error) {
    console.warn("Clerk modules not available. Auth will be disabled.");
    config.auth.enabled = false;
  }
}

const isProtectedRoute = config.auth.enabled
  ? createRouteMatcher(["/dashboard(.*)"])
  : () => false;

const isCalendlyRoute = (pathname: string) => 
  CALENDLY_ROUTES.some(route => pathname.startsWith(route));

const isPublicRoute = (pathname: string) =>
  PUBLIC_ROUTES.some(route => pathname.startsWith(route));

export default function middleware(req: NextRequest) {
  if (!config.auth.enabled) {
    return NextResponse.next();
  }

  return clerkMiddleware(async (auth: any) => {
    const resolvedAuth = await auth();
    const pathname = req.nextUrl.pathname;

    // Handle public routes
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // Handle unauthenticated users
    if (!resolvedAuth.userId && (isProtectedRoute(req) || isCalendlyRoute(pathname))) {
      return resolvedAuth.redirectToSignIn();
    }

    // Special handling for new signups
    if (pathname === '/dashboard' && resolvedAuth.userId) {
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
      const { data: user } = await supabase
        .from('User')
        .select('role')
        .eq('userId', resolvedAuth.userId)
        .single();

      // If user doesn't exist yet, redirect to onboarding
      if (!user) {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
    }

    // Handle role-specific routes
    const role = resolvedAuth.sessionClaims?.role;
    if (role) {
      // Protect admin routes
      if (ADMIN_ROUTES.some(route => pathname.match(route)) && role !== ROLES.ADMIN) {
        return new NextResponse('Access denied. Admin role required.', { status: 403 });
      }

      // Protect coach routes
      if (COACH_ROUTES.some(route => pathname.match(route)) && 
          role !== ROLES.COACH && role !== ROLES.ADMIN) {
        return new NextResponse('Access denied. Coach role required.', { status: 403 });
      }

      // Protect mentee routes
      if (MENTEE_ROUTES.some(route => pathname.match(route)) && 
          role !== ROLES.MENTEE && role !== ROLES.ADMIN) {
        return new NextResponse('Access denied. Mentee role required.', { status: 403 });
      }
    }

    // Handle Calendly routes
    if (isCalendlyRoute(pathname)) {
      const userId = resolvedAuth.userId;
      if (!userId) {
        return new NextResponse('Authentication required', { status: 401 });
      }

      // Add auth info to headers for downstream use
      const requestHeaders = new Headers(req.headers);
      if (role) {
        requestHeaders.set('x-user-role', role);
      }
      requestHeaders.set('x-user-id', userId);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    return NextResponse.next();
  })(req);
}

// Export middleware config separately to avoid naming conflicts
export const middlewareConfig = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};