import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLES } from './utils/roles/roles'

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

const appConfig: AppConfig = require('./config').default;

// Roles that can access Calendly features
const CALENDLY_ROLES = [ROLES.REALTOR_COACH, ROLES.LOAN_OFFICER_COACH, ROLES.ADMIN] as const
type CalendlyRole = typeof CALENDLY_ROLES[number]

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
] as const

// Public routes that don't require auth
const PUBLIC_ROUTES = [
  '/api/auth/webhook',
  '/api/calendly/webhooks'
] as const

let clerkMiddlewareInstance: any, createRouteMatcher: any;

if (appConfig.auth.enabled) {
  try {
    ({ clerkMiddleware: clerkMiddlewareInstance, createRouteMatcher } = require("@clerk/nextjs/server"));
  } catch (error) {
    console.warn("Clerk modules not available. Auth will be disabled.");
    appConfig.auth.enabled = false;
  }
}

const isProtectedRoute = appConfig.auth.enabled
  ? createRouteMatcher(["/dashboard(.*)"])
  : () => false;

const isCalendlyRoute = (pathname: string) => 
  CALENDLY_ROUTES.some(route => pathname.startsWith(route));

const isPublicRoute = (pathname: string) =>
  PUBLIC_ROUTES.some(route => pathname.startsWith(route));

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  // Log all requests in middleware
  console.log("\n[MIDDLEWARE] ====== Request Details ======");
  console.log("[MIDDLEWARE] Request to:", pathname);
  console.log("[MIDDLEWARE] Method:", req.method);
  console.log("[MIDDLEWARE] Headers:", Object.fromEntries(req.headers));
  
  // Always allow webhook requests - more permissive matching
  if (pathname.includes('/api/auth/webhook')) {
    console.log("[MIDDLEWARE] Webhook request detected");
    console.log("[MIDDLEWARE] Allowing webhook request");
    return NextResponse.next();
  }

  if (!appConfig.auth.enabled) {
    return NextResponse.next();
  }

  return clerkMiddlewareInstance(async (auth: any) => {
    const resolvedAuth = await auth();
    
    // Handle public routes
    if (isPublicRoute(pathname)) {
      console.log("[MIDDLEWARE] Public route detected:", pathname);
      return NextResponse.next();
    }

    // Handle unauthenticated users
    if (!resolvedAuth.userId && (isProtectedRoute(req) || isCalendlyRoute(pathname))) {
      return resolvedAuth.redirectToSignIn();
    }

    // Handle Calendly routes
    if (isCalendlyRoute(pathname)) {
      const role = resolvedAuth.sessionClaims?.role as CalendlyRole | undefined;
      const userId = resolvedAuth.userId;

      if (!role || !CALENDLY_ROLES.includes(role) || !userId) {
        return new NextResponse(
          'Access denied. Required role: coach or admin',
          { status: 403 }
        );
      }

      // Add auth info to headers for downstream use
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-role', role);
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

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};