import { auth } from '@clerk/nextjs/server'
import { getAuthContext, UnauthorizedError } from './auth-context'
import { getUserById } from './user-management'
import type { SystemRole, UserCapability } from '../roles/roles'

export interface AuthResult {
  authenticated: boolean
  userId?: string | null
  message: string
}

export interface AuthorizationResult {
  authorized: boolean
  message: string
}

/**
 * Verifies if the current user is authenticated
 */
export async function verifyAuth(): Promise<AuthResult> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return {
        authenticated: false,
        message: 'Authentication required'
      }
    }

    return {
      authenticated: true,
      userId,
      message: 'Authenticated'
    }
  } catch (error) {
    console.error('[AUTH_ERROR]', {
      code: 'AUTH_VERIFICATION_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
    return {
      authenticated: false,
      message: 'Authentication failed'
    }
  }
}

/**
 * Verifies if the current user is authorized (authenticated and has required role/capabilities)
 */
export async function isAuthorized(options?: {
  requiredSystemRole?: SystemRole
  requiredCapabilities?: UserCapability[]
  requireAll?: boolean
}): Promise<AuthorizationResult> {
  try {
    const authResult = await verifyAuth()
    if (!authResult.authenticated || !authResult.userId) {
      return {
        authorized: false,
        message: authResult.message
      }
    }

    // If no specific requirements, just being authenticated is enough
    if (!options || (!options.requiredSystemRole && !options.requiredCapabilities)) {
      return {
        authorized: true,
        message: 'User is authorized'
      }
    }

    // Get user's context
    const userContext = await getAuthContext()
    if (!userContext) {
      return {
        authorized: false,
        message: 'User context not found'
      }
    }

    // Check system role if required
    if (options.requiredSystemRole && userContext.systemRole !== options.requiredSystemRole) {
      return {
        authorized: false,
        message: `Required role ${options.requiredSystemRole} not found`
      }
    }

    // Check capabilities if required
    if (options.requiredCapabilities && options.requiredCapabilities.length > 0) {
      const hasAllRequired = options.requiredCapabilities.every(cap => 
        userContext.capabilities.includes(cap)
      )
      
      const hasAnyRequired = options.requiredCapabilities.some(cap => 
        userContext.capabilities.includes(cap)
      )
      
      const requireAll = options.requireAll ?? true
      
      if ((requireAll && !hasAllRequired) || (!requireAll && !hasAnyRequired)) {
        return {
          authorized: false,
          message: `Required capabilities not found`
        }
      }
    }

    return {
      authorized: true,
      message: 'User is authorized'
    }
  } catch (error) {
    console.error('[AUTH_ERROR]', {
      code: 'AUTHORIZATION_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
    return {
      authorized: false,
      message: 'Authorization check failed'
    }
  }
}

/**
 * Get the current user's ID if authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

/**
 * Handle auth errors in middleware
 */
export function handleAuthError(error: Error, req: Request) {
  console.error('[AUTH_ERROR]', {
    code: 'AUTH_ERROR',
    message: error.message,
    timestamp: new Date().toISOString()
  })
  const url = new URL('/sign-in', req.url)
  return Response.redirect(url)
} 