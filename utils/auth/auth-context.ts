import { cache } from 'react'
import { auth } from '@clerk/nextjs/server'
import { createAuthClient } from './auth-client'
import { cookies } from 'next/headers'
import { AuthContext, UnauthorizedError, authContextSchema } from '../types/auth'
import { generateUlid } from '../ulid'
import { 
  SYSTEM_ROLES, 
  USER_CAPABILITIES, 
  isValidSystemRole,
  isValidCapability,
  isValidOrgRole,
  isValidOrgLevel
} from '../roles/roles'
import { SystemRole, UserCapability, OrgRole, OrgLevel } from '../roles/roles'
import { UserRole } from '@prisma/client'

// Cache duration in seconds
const CACHE_DURATION = 60

// Type guard for SystemRole
function assertSystemRole(role: string): asserts role is SystemRole {
  if (!isValidSystemRole(role)) {
    throw new Error(`Invalid system role: ${role}`)
  }
}

// Type for raw Supabase response
type UserResponse = {
  ulid: string
  userId: string
  systemRole: string
  capabilities: string[]
  organizationMember?: Array<{
    role: string
    scope: string
    organization: {
      level: string
      status: string
    }
  }>
  subscription?: Array<{
    status: string
    plan: {
      planId: string
    }
  }>
}

// Custom error for missing users
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found in database. UserId: ${userId}`)
    this.name = 'UserNotFoundError'
  }
}

/**
 * Gets the auth context for the current user.
 * Uses Clerk for auth and Supabase for user data/roles.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const { userId } = await auth()
  if (!userId) {
    return null
  }

  // Get user data from Supabase
  const supabase = createAuthClient()
  const { data: user, error } = await supabase
    .from('User')
    .select('ulid, systemRole, capabilities')
    .eq('userId', userId)
    .single()

  if (error) {
    console.error('[AUTH_ERROR]', {
      code: 'DB_QUERY_ERROR',
      message: error.message,
      context: { userId },
      timestamp: new Date().toISOString()
    })
    throw error
  }

  if (!user) {
    throw new UserNotFoundError(userId)
  }

  return {
    userId,
    userUlid: user.ulid,
    systemRole: user.systemRole || SYSTEM_ROLES.USER,
    capabilities: user.capabilities || []
  }
})

// React hook for client components
export function useAuthContext() {
  return cache(getAuthContext)
}

// Metrics tracking
const metrics = new Map<string, {
  hits: number
  misses: number
  errors: number
  latency: number[]
}>()

export function getAuthMetrics() {
  return Object.fromEntries(metrics)
}
