import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SYSTEM_ROLES, USER_CAPABILITIES, hasCapability, type UserRoleContext } from './utils/roles/roles'
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getAuthContext } from './utils/auth/auth-context'
import { createAuthMiddleware } from './utils/auth/auth-middleware'
import { handleAuthError } from "./utils/auth/auth-utils";
import { getRequiredCapabilities } from "./utils/auth/auth-utils";
import { getRequiredRole } from "./utils/auth/auth-utils";

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
  if (!config.auth.enabled) return NextResponse.next()

  return clerkMiddleware(async (auth: any) => {
    const pathname = req.nextUrl.pathname

    if (isPublicRoute(pathname)) return NextResponse.next()
    if (!auth?.userId && isProtectedRoute(pathname)) {
      return auth.redirectToSignIn()
    }

    try {
      const context = await getAuthContext()
      
      // Route-specific middleware
      await createAuthMiddleware({
        requiredSystemRole: getRequiredRole(pathname),
        requiredCapabilities: getRequiredCapabilities(pathname)
      })(context)

      // Add context to headers
      const headers = new Headers(req.headers)
      headers.set('x-auth-context', JSON.stringify(context))

      return NextResponse.next({ headers })
    } catch (error) {
      return handleAuthError(error as Error, req)
    }
  })(req)
}

// Export middleware config
export const middlewareConfig = {
  matcher: [
    // Match all paths except static assets and api routes that don't need auth
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};