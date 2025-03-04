// Auth context exports
export { getAuthContext, useAuthContext } from './auth-context'

// Auth client exports
export { createAuthClient } from './auth-client'

// Auth middleware exports
export { createAuthMiddleware } from './auth-middleware'

// Auth utilities exports
export { 
  isAuthorized,
  getRequiredRole,
  getRequiredCapabilities,
  handleAuthError
} from './auth-utils'

// Re-export types
export type { AuthorizationResult } from './auth-utils'
import { AuthContext } from '../types/auth'

// Import what we need for the functions
import { getAuthContext } from './auth-context'
import { createAuthClient } from './auth-client'

// User management functions
export async function ensureUserExists(userId: string): Promise<AuthContext> {
  const supabase = await createAuthClient()
  
  // First try to find the existing user
  const { data: existingUser, error: lookupError } = await supabase
    .from('User')
    .select(`
      ulid,
      userId,
      systemRole,
      capabilities,
      organizationMember:OrganizationMember (
        role,
        scope,
        organization:organizationUlid (
          level,
          status
        )
      ),
      subscription:Subscription (
        status,
        plan:planUlid (
          planId
        )
      )
    `)
    .eq('userId', userId)
    .single()
    
  if (lookupError) {
    if (lookupError.code === 'PGRST116') {
      // User doesn't exist - they need to complete signup
      throw new Error('User not found - please complete the signup process')
    }
    console.error('[AUTH_ERROR] Error looking up user:', lookupError)
    throw lookupError
  }
  
  if (!existingUser) {
    throw new Error('User not found - please complete the signup process')
  }

  // Return user data
  return {
    userId: existingUser.userId,
    userUlid: existingUser.ulid,
    systemRole: existingUser.systemRole,
    capabilities: existingUser.capabilities || [],
    orgRole: existingUser.organizationMember?.[0]?.role,
    orgLevel: existingUser.organizationMember?.[0]?.organization?.level,
    subscription: existingUser.subscription?.[0] ? {
      status: existingUser.subscription[0].status,
      planId: existingUser.subscription[0].plan?.planId
    } : undefined
  }
}

export async function getAuthUser() {
  return getAuthContext()
} 