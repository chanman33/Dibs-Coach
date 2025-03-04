import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server"
import { createAuthClient } from './auth-client'
import config from "../../config"
import { UnauthorizedError } from '../types/auth'
import { getAuthContext } from './auth-context'
import { createAuthMiddleware } from './auth-middleware'
import { AuthOptions } from '../types/auth'
import { SystemRole, UserCapability, SYSTEM_ROLES, USER_CAPABILITIES } from '../roles/roles'

export interface AuthorizationResult {
  authorized: boolean
  message?: string
}

// Route-based role requirements
export function getRequiredRole(pathname: string): SystemRole | undefined {
  if (pathname.match(/\/dashboard\/admin(.*)/)) return SYSTEM_ROLES.SYSTEM_OWNER
  if (pathname.match(/\/dashboard\/coach(.*)/)) return SYSTEM_ROLES.USER
  if (pathname.match(/\/dashboard\/mentee(.*)/)) return SYSTEM_ROLES.USER
  return undefined
}

// Route-based capability requirements
export function getRequiredCapabilities(pathname: string): UserCapability[] {
  if (pathname.match(/\/dashboard\/coach(.*)/)) return [USER_CAPABILITIES.COACH]
  if (pathname.match(/\/dashboard\/mentee(.*)/)) return [USER_CAPABILITIES.MENTEE]
  return []
}

// Handle auth errors in middleware
export function handleAuthError(error: Error, req: Request) {
  console.error('[AUTH_ERROR]', error)
  const url = new URL('/not-authorized', req.url)
  return Response.redirect(url)
}

/**
 * Check if the current user is authorized based on the provided options
 */
export async function isAuthorized(options: AuthOptions = {}): Promise<AuthorizationResult> {
  try {
    const context = await getAuthContext()
    const middleware = createAuthMiddleware(options)
    await middleware(context)
    
    return {
      authorized: true
    }
  } catch (error) {
    return {
      authorized: false,
      message: error instanceof Error ? error.message : 'Authorization failed'
    }
  }
} 