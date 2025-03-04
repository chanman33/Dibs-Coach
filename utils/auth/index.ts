// Auth context exports
export { getAuthContext } from './auth-context'
export { UserNotFoundError } from './auth-context'

// Auth client exports
export { createAuthClient } from './auth-client'

// Auth utilities exports
export {
  verifyAuth,
  isAuthorized,
  getCurrentUserId,
  handleAuthError
} from './auth-utils'

// Re-export types
export type { AuthResult, AuthorizationResult } from './auth-utils'
import { AuthContext } from '../types/auth'

// Import what we need for the functions
import { getAuthContext } from './auth-context'
import { createAuthClient } from './auth-client'
import { generateUlid } from '../ulid'
import { SYSTEM_ROLES, USER_CAPABILITIES } from '../roles/roles'
import { currentUser } from '@clerk/nextjs/server'

// User management functions
export async function ensureUserExists(userId: string): Promise<AuthContext> {
  const supabase = await createAuthClient()
  
  // Get user details from Clerk
  const user = await currentUser()
  if (!user) {
    throw new Error('No authenticated user found')
  }

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
    
  if (lookupError && lookupError.code !== 'PGRST116') {
    console.error('[AUTH_ERROR] Error looking up user:', lookupError)
    throw lookupError
  }
  
  // If user doesn't exist, create them with default role and capabilities
  if (!existingUser) {
    const newUserUlid = generateUlid()
    const { data: newUser, error: createError } = await supabase
      .from('User')
      .insert({
        ulid: newUserUlid,
        userId: userId,
        email: user.emailAddresses[0]?.emailAddress || 'pending@example.com',
        systemRole: SYSTEM_ROLES.USER,
        capabilities: [USER_CAPABILITIES.MENTEE],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select(`        ulid,
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
      .single()

    if (createError) {
      console.error('[AUTH_ERROR] Error creating user:', createError)
      throw createError
    }

    return {
      userId: newUser.userId,
      userUlid: newUser.ulid,
      systemRole: newUser.systemRole,
      capabilities: newUser.capabilities || [USER_CAPABILITIES.MENTEE],
      orgRole: undefined,
      orgLevel: undefined,
      subscription: undefined
    }
  }

  // Return existing user data
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
