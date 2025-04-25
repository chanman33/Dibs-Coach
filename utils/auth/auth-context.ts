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
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // ms
  
  // Helper function to create a delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Retry loop
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { userId } = await safeAuth()
      
      if (!userId) {
        console.log('[AUTH_CONTEXT] No user ID found, returning null');
        return null
      }

      try {
        // Try to get existing user first
        const existingUser = await getUserById(userId)
        
        if (existingUser) {
          console.log('[AUTH_CONTEXT] Found existing user:', {
            userId: existingUser.userId,
            userUlid: existingUser.userUlid,
            systemRole: existingUser.systemRole,
            capabilities: existingUser.capabilities,
            attempt
          });
          return existingUser
        }
        
        // If user doesn't exist, create them
        console.log('[AUTH_CONTEXT] User not found, creating new user:', {
          userId,
          attempt
        });
        
        const newUser = await createUserIfNotExists(userId)
        
        console.log('[AUTH_CONTEXT] Created new user:', {
          userId: newUser.userId,
          userUlid: newUser.userUlid,
          systemRole: newUser.systemRole,
          capabilities: newUser.capabilities,
          attempt
        });
        
        return newUser
      } catch (error) {
        // Always log errors
        console.error('[AUTH_CONTEXT] Error retrieving auth context:', {
          userId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          attempt
        })
        
        // If this is the last attempt, return a minimal context as fallback
        if (attempt === MAX_RETRIES) {
          console.log('[AUTH_CONTEXT] Returning minimal context as fallback after all retries failed');
          return {
            userId,
            userUlid: '',
            systemRole: SYSTEM_ROLES.USER,
            capabilities: [USER_CAPABILITIES.MENTEE],
            isNewUser: true
          }
        }
        
        // Otherwise, wait and retry
        console.log(`[AUTH_CONTEXT] Retrying in ${RETRY_DELAY * attempt}ms (attempt ${attempt}/${MAX_RETRIES})`);
        await delay(RETRY_DELAY * attempt);
      }
    } catch (error) {
      console.error('[AUTH_CONTEXT] Error in auth():', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        attempt
      })
      
      // If this is the last attempt, return null
      if (attempt === MAX_RETRIES) {
        return null
      }
      
      // Otherwise, wait and retry
      console.log(`[AUTH_CONTEXT] Retrying in ${RETRY_DELAY * attempt}ms (attempt ${attempt}/${MAX_RETRIES})`);
      await delay(RETRY_DELAY * attempt);
    }
  }
  
  // If all retries failed, return null
  console.error('[AUTH_CONTEXT] All retries failed, returning null');
  return null
})

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
