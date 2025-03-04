import { cache } from 'react'
import { auth, currentUser } from '@clerk/nextjs/server'
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

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const session = await auth()
  if (!session?.userId) {
    throw new UnauthorizedError()
  }

  const supabase = await createAuthClient()
  
  // Efficient single query with all needed data
  const { data, error } = await supabase
    .from('User')
    .select(`
      ulid,
      userId,
      systemRole,
      capabilities,
      organizationMember:OrganizationMember!inner (
        role,
        scope,
        organization:organizationUlid (
          level,
          status
        )
      ),
      subscription:Subscription!inner (
        status,
        plan:planUlid (
          planId
        )
      )
    `)
    .eq('userId', session.userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return createNewUser(session.userId)
    }
    throw error
  }

  // Validate and transform system role
  if (!isValidSystemRole(data.systemRole)) {
    throw new Error(`Invalid system role: ${data.systemRole}`)
  }

  // Filter and validate capabilities
  const capabilities = Array.isArray(data.capabilities) 
    ? data.capabilities.filter(isValidCapability)
    : []

  // Validate org role and level if present
  const orgRole = data.organizationMember?.[0]?.role
  const orgLevel = data.organizationMember?.[0]?.organization?.level

  if (orgRole && !isValidOrgRole(orgRole)) {
    throw new Error(`Invalid org role: ${orgRole}`)
  }

  if (orgLevel && !isValidOrgLevel(orgLevel)) {
    throw new Error(`Invalid org level: ${orgLevel}`)
  }

  // Let schema validation handle all type narrowing
  return authContextSchema.parse({
    userId: session.userId,
    userUlid: data.ulid,
    systemRole: data.systemRole,
    capabilities,
    orgRole,
    orgLevel,
    subscription: data.subscription?.[0] ? {
      status: data.subscription[0].status,
      planId: data.subscription[0].plan?.planId
    } : undefined
  })
})

async function createNewUser(userId: string): Promise<AuthContext> {
  const supabase = await createAuthClient();
  const user = await currentUser();
  
  if (!user) {
    throw new Error('User data not available');
  }

  const newUser = {
    ulid: generateUlid(),
    userId: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.firstName && user.lastName ? 
      `${user.firstName} ${user.lastName}`.trim() : 
      user.emailAddresses[0]?.emailAddress?.split('@')[0],
    profileImageUrl: user.imageUrl,
    systemRole: SYSTEM_ROLES.USER,
    capabilities: [USER_CAPABILITIES.MENTEE],
    isCoach: false,
    isMentee: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('User')
    .insert(newUser)
    .select(`
      ulid,
      userId,
      systemRole,
      capabilities
    `)
    .single();

  if (error) {
    console.error('[AUTH_ERROR] Failed to create user:', error);
    throw error;
  }

  return {
    userId: user.id,
    userUlid: data.ulid,
    systemRole: data.systemRole,
    capabilities: data.capabilities || []
  };
}

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
