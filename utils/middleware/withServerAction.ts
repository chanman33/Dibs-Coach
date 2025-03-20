import { auth } from "@clerk/nextjs/server"
import { createAuthClient } from '@/utils/auth/auth-client'
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
  isValidOrgLevel,
  SYSTEM_ROLES,
  ORG_ROLES
} from "@/utils/roles/roles"
import { generateUlid } from '@/utils/ulid'
import { ApiResponse } from '@/utils/types/api'
import { permissionService } from '@/utils/auth'
import { AuthOptions } from '@/utils/types/auth'

export interface ServerActionContext {
  userId: string           // Clerk ID
  userUlid: string        // Database ULID
  systemRole: SystemRole  // System-level role
  roleContext: UserRoleContext // Full role context including org roles
  organizationUlid?: string // Organization ULID if user has active membership
  organizationName?: string // Organization name if user has active membership
}

interface ServerActionOptions {
  requiredSystemRole?: SystemRole
  requiredOrgRole?: OrgRole
  requiredOrgLevel?: OrgLevel
  requiredPermissions?: Permission[]
  requiredCapabilities?: UserCapability[]
  requireAll?: boolean
  requireOrganization?: boolean
}

interface OrganizationData {
  role: string
  scope: string
  customPermissions?: Permission[]
  organizationUlid: string
  organization: {
    ulid: string
    level: string
    status: string
    type: string
  }
}

type ServerAction<T, P = any> = (
  params: P,
  ctx: ServerActionContext
) => Promise<ApiResponse<T>>

/**
 * Server action wrapper that handles authentication and authorization.
 * Uses cached auth context and unified middleware for protection.
 */
export function withServerAction<T, P = any>(
  action: ServerAction<T, P>,
  options: AuthOptions = {}
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
        console.error('[SERVER_ACTION_USER_ERROR]', {
          error: userError,
          userId: session.userId,
          timestamp: new Date().toISOString()
        });
        
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
        console.error('[SERVER_ACTION_INVALID_ROLE]', {
          systemRole: userData.systemRole,
          userId: session.userId,
          timestamp: new Date().toISOString()
        });
        
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
            type,
            name
          )
        `)
        .eq('userUlid', userData.ulid)
        .eq('status', 'ACTIVE')
        .maybeSingle() 

      // Log organization membership info
      if (orgError) {
        console.error('[SERVER_ACTION_ORG_ERROR]', {
          error: orgError,
          userUlid: userData.ulid,
          userId: session.userId,
          timestamp: new Date().toISOString()
        });
      } else if (orgData) {
        console.log('[SERVER_ACTION_ORG_INFO]', {
          userUlid: userData.ulid,
          userId: session.userId,
          organizationUlid: orgData.organizationUlid,
          organizationName: orgData.organization.name,
          role: orgData.role,
          scope: orgData.scope,
          orgStatus: orgData.organization.status,
          orgLevel: orgData.organization.level,
          orgType: orgData.organization.type,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('[SERVER_ACTION_NO_ORG]', {
          message: 'User has no organization membership',
          userUlid: userData.ulid,
          userId: session.userId,
          timestamp: new Date().toISOString()
        });
      }

      // Handle organization requirements for organization-specific routes
      if (options.requireOrganization && !orgData) {
        // System owners bypass organization requirements
        if (userData.systemRole === 'SYSTEM_OWNER') {
          console.log('[SERVER_ACTION] System owner bypassing organization requirement');
        } else {
          return {
            data: null,
            error: {
              code: 'FORBIDDEN',
              message: 'Organization membership required'
            }
          }
        }
      }

      // Validate org data if it exists
      if (orgData) {
        // Check organization status
        if (orgData.organization.status !== 'ACTIVE') {
          console.error('[SERVER_ACTION_INACTIVE_ORG]', {
            userId: session.userId,
            organizationUlid: orgData.organizationUlid,
            status: orgData.organization.status,
            timestamp: new Date().toISOString()
          });
          
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
          console.error('[SERVER_ACTION_INVALID_ORG_ROLE]', {
            userId: session.userId,
            orgRole: orgData.role,
            orgLevel: orgData.organization.level,
            timestamp: new Date().toISOString()
          });
          
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

      // Create user context for permission service
      const userContext = {
        userId: session.userId,
        userUlid: userData.ulid,
        systemRole: userData.systemRole as SystemRole,
        capabilities: (userData.capabilities || []) as UserCapability[],
        orgRole: orgData?.role as OrgRole | undefined,
        orgLevel: orgData?.organization?.level as OrgLevel | undefined,
        organizationUlid: orgData?.organizationUlid,
        organizationName: orgData?.organization?.name,
        customPermissions: orgData?.customPermissions as Permission[] | undefined
      }

      console.log('[SERVER_ACTION_USER_CONTEXT]', {
        userId: session.userId,
        userUlid: userData.ulid,
        capabilities: userData.capabilities || [],
        orgRole: orgData?.role || 'none',
        organizationUlid: orgData?.organizationUlid || 'none',
        organizationName: orgData?.organization?.name || 'none',
        timestamp: new Date().toISOString()
      });

      // SIMPLIFIED PERMISSION MODEL FOR DEVELOPMENT:
      // During development phase, follow the same logic as client-side permission service
      const hasOrgMembership = !!orgData?.organizationUlid && !!orgData?.role;
      const isSystemOwner = userData.systemRole === 'SYSTEM_OWNER';
      
      // For business portal endpoints, organization membership is required with a valid role
      // This logic should match the client-side canAccessBusinessDashboard() function
      const hasValidOrgRole = !!orgData?.role && 
        businessDashboardRoles.includes(orgData.role as OrgRole);
        
      const hasValidPermission = isSystemOwner || (hasOrgMembership && hasValidOrgRole);
      
      if (!hasValidPermission) {
        console.error('[SERVER_ACTION_PERMISSION_DENIED]', {
          userId: session.userId,
          userUlid: userData.ulid,
          orgRole: orgData?.role || 'none',
          isSystemOwner,
          hasOrgMembership,
          hasValidOrgRole,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions'
          }
        }
      }
      
      console.log('[SERVER_ACTION_PERMISSION_GRANTED]', {
        userId: session.userId,
        hasOrgMembership,
        isSystemOwner,
        orgRole: orgData?.role || 'none',
        hasValidOrgRole,
        timestamp: new Date().toISOString()
      });

      return action(params, {
        userId: session.userId,
        userUlid: userData.ulid,
        systemRole: userData.systemRole as SystemRole,
        roleContext,
        organizationUlid: orgData?.organizationUlid,
        organizationName: orgData?.organization?.name
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

// Business roles that have access to business dashboard
// This should match the same constant in permission-service.ts
const businessDashboardRoles = [
  ORG_ROLES.OWNER,
  ORG_ROLES.DIRECTOR,
  ORG_ROLES.MANAGER
] as readonly OrgRole[];

