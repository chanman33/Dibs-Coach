import { auth } from "@clerk/nextjs/server"
import { createAuthClient } from "@/utils/auth"
import { 
  SystemRole,
  OrgRole,
  OrgLevel,
  Permission,
  UserCapability,
  hasSystemRole,
  hasOrgRole,
  hasPermission,
  hasCapability,
  UserRoleContext,
  isValidSystemRole,
  isValidOrgRole,
  isValidOrgLevel
} from "@/utils/roles/roles"
import { ApiResponse } from "@/utils/types/api"
import { generateUlid } from '@/utils/ulid'

export interface ServerActionContext {
  userId: string           // Clerk ID
  userUlid: string        // Database ULID
  systemRole: SystemRole  // System-level role
  roleContext: UserRoleContext // Full role context including org roles
  organizationUlid?: string // Organization ULID if user has active membership
}

interface ServerActionOptions {
  requiredSystemRole?: SystemRole
  requiredOrgRole?: OrgRole
  requiredOrgLevel?: OrgLevel
  requiredPermissions?: Permission[]
  requiredCapabilities?: UserCapability[]
  requireAll?: boolean
  requireOrganization?: boolean // Whether the action requires an organization context
}

interface OrganizationData {
  role: string;
  scope: string;
  customPermissions?: Permission[];
  organizationUlid: string;
  organization: {
    ulid: string;
    level: string;
    status: string;
    type: string;
  };
}

type ServerAction<T, P = any> = (
  params: P,
  ctx: ServerActionContext
) => Promise<ApiResponse<T>>

/**
 * Ensures ULIDs are present in data for Supabase operations
 */
const ensureUlids = (data: any): any => {
  if (!data) return data

  // Handle array of records
  if (Array.isArray(data)) {
    return data.map(item => ({
      ...item,
      ulid: item.ulid || generateUlid()
    }))
  }

  // Handle single record
  return {
    ...data,
    ulid: data.ulid || generateUlid()
  }
}

export function withServerAction<T, P = any>(
  action: ServerAction<T, P>,
  options: ServerActionOptions = {}
) {
  return async (params: P): Promise<ApiResponse<T>> => {
    try {
      const session = await auth()
      if (!session?.userId) {
        return {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        }
      }

      const supabase = await createAuthClient()
      
      // First get the user's basic info and system role
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select(`
          ulid,
          systemRole,
          capabilities
        `)
        .eq('userId', session.userId)
        .single()

      if (userError || !userData) {
        return {
          data: null,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        }
      }

      // Validate system role
      if (!isValidSystemRole(userData.systemRole)) {
        return {
          data: null,
          error: {
            code: 'INVALID_ROLE',
            message: 'Invalid system role'
          }
        }
      }

      // Then get the user's organization memberships if they exist
      const { data: orgData, error: orgError } = await supabase
        .from('OrganizationMember')
        .select(`
          role,
          scope,
          customPermissions,
          organizationUlid,
          organization:organizationUlid!inner (
            ulid,
            level,
            status,
            type
          )
        `)
        .eq('userUlid', userData.ulid)
        .eq('status', 'ACTIVE')
        .maybeSingle() as { data: OrganizationData | null, error: any }

      // Handle org membership validation
      if (options.requireOrganization && !orgData) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Organization membership required'
          }
        }
      }

      // Validate org data if it exists
      if (orgData) {
        // Check organization status
        if (orgData.organization.status !== 'ACTIVE') {
          return {
            data: null,
            error: {
              code: 'FORBIDDEN',
              message: 'Organization is not active'
            }
          }
        }

        // Validate org role and level
        if (!isValidOrgRole(orgData.role) || !isValidOrgLevel(orgData.organization.level)) {
          return {
            data: null,
            error: {
              code: 'INVALID_ROLE',
              message: 'Invalid organization role or level'
            }
          }
        }
      }

      // Build the role context
      const roleContext: UserRoleContext = {
        systemRole: userData.systemRole as SystemRole,
        capabilities: (userData.capabilities || []) as UserCapability[],
        orgRole: orgData?.role as OrgRole | undefined,
        orgLevel: orgData?.organization?.level as OrgLevel | undefined,
        customPermissions: orgData?.customPermissions as Permission[] | undefined
      }

      // System role validation
      if (options.requiredSystemRole && !hasSystemRole(roleContext.systemRole, options.requiredSystemRole)) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient system role'
          }
        }
      }

      // Organization role validation
      if (options.requiredOrgRole && options.requiredOrgLevel) {
        if (!roleContext.orgRole || !roleContext.orgLevel) {
          return {
            data: null,
            error: {
              code: 'FORBIDDEN',
              message: 'Organization role required'
            }
          }
        }

        if (!hasOrgRole(roleContext.orgRole, options.requiredOrgRole, roleContext.orgLevel, options.requiredOrgLevel)) {
          return {
            data: null,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient organization role'
            }
          }
        }
      }

      // Permission validation
      if (options.requiredPermissions?.length) {
        const hasRequiredPermissions = options.requireAll
          ? options.requiredPermissions.every(p => hasPermission(roleContext, p))
          : options.requiredPermissions.some(p => hasPermission(roleContext, p))

        if (!hasRequiredPermissions) {
          return {
            data: null,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions'
            }
          }
        }
      }

      // Capability validation
      if (options.requiredCapabilities?.length) {
        const hasRequiredCapabilities = options.requireAll
          ? options.requiredCapabilities.every(c => hasCapability(roleContext, c))
          : options.requiredCapabilities.some(c => hasCapability(roleContext, c))

        if (!hasRequiredCapabilities) {
          return {
            data: null,
            error: {
              code: 'FORBIDDEN',
              message: 'Required capabilities not found'
            }
          }
        }
      }

      return action(params, {
        userId: session.userId,
        userUlid: userData.ulid,
        systemRole: userData.systemRole as SystemRole,
        roleContext,
        organizationUlid: orgData?.organizationUlid
      })
    } catch (error) {
      console.error('[SERVER_ACTION_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Action failed',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
}

