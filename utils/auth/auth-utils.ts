import { auth } from '@clerk/nextjs/server'
import type { SystemRole, UserCapability } from '../roles/roles'

export interface AuthResult {
  authenticated: boolean
  userId?: string | null
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