import { cache } from 'react'
import { auth } from '@clerk/nextjs/server'
import { createUserIfNotExists, getUserById, type UserContext } from './user-management'
import { SYSTEM_ROLES, USER_CAPABILITIES } from '../roles/roles'

// Custom error for unauthorized access
export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized access') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

/**
 * Helper function to safely call Clerk's auth function
 * Catches errors from headers() not being awaited in Next.js 15+
 */
async function safeAuth() {
  try {
    return await auth()
  } catch (error) {
    console.error('[AUTH_CONTEXT] Error in auth():', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    if (error instanceof Error && error.message.includes('headers()')) {
      console.warn('[AUTH_CONTEXT] Next.js 15 headers() error detected, returning empty auth')
    }
    
    return { userId: null }
  }
}

/**
 * Gets the auth context for the current user.
 * Uses Clerk for auth and Supabase for user data/roles.
 * This function is cached to improve performance.
 */
export const getAuthContext = cache(async (): Promise<UserContext | null> => {
  try {
    const { userId } = await safeAuth()
    
    if (!userId) {
      return null
    }

    try {
      // Try to get existing user first
      const existingUser = await getUserById(userId)
      
      if (existingUser) {
        return existingUser
      }
      
      // If user doesn't exist, create them
      const newUser = await createUserIfNotExists(userId)
      
      return newUser
    } catch (error) {
      // Always log errors
      console.error('[AUTH_CONTEXT] Error retrieving auth context:', {
        userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      
      // Return a minimal context as fallback
      return {
        userId,
        userUlid: '',
        systemRole: SYSTEM_ROLES.USER,
        capabilities: [USER_CAPABILITIES.MENTEE],
        isNewUser: true
      }
    }
  } catch (error) {
    console.error('[AUTH_CONTEXT] Error in auth():', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return null
  }
})

/**
 * React hook for client components to access auth context
 */
export function useAuthContext() {
  return cache(getAuthContext)
}

/**
 * Gets the current user's ID if authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { userId } = await safeAuth()
    return userId
  } catch (error) {
    console.error('[AUTH_CONTEXT] Error getting current user ID:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return null
  }
}
