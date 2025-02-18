import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAuthClient } from '@/utils/supabase/server'
import { ApiResponse } from '@/utils/types/api'
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
  UserRoleContext
} from '@/utils/roles/roles'
import type { Database } from '@/types/supabase'

type DbUser = Database['public']['Tables']['User']['Row']

export interface AuthenticatedApiContext {
  userId: string           // Clerk ID
  userUlid: string        // Database ULID
  systemRole: SystemRole  // System-level role
  roleContext: UserRoleContext // Full role context including org roles
}

interface ApiAuthOptions {
  requiredSystemRole?: SystemRole
  requiredOrgRole?: OrgRole
  requiredOrgLevel?: OrgLevel
  requiredPermissions?: Permission[]
  requiredCapabilities?: UserCapability[]
  requireAll?: boolean
}

type ApiHandler<T = any> = (
  req: Request,
  ctx: AuthenticatedApiContext
) => Promise<NextResponse<ApiResponse<T>>>

/**
 * API route wrapper that handles authentication and authorization.
 * Uses server-side Supabase client for secure database operations.
 * 
 * Pattern:
 * 1. Validates Clerk session
 * 2. Retrieves user data and role context from database
 * 3. Validates roles, permissions, and capabilities
 * 4. Provides authenticated context to handler
 * 
 * Security:
 * - Uses service key for database access
 * - Never exposes database credentials
 * - Validates auth before any operations
 * - Enforces role-based access control
 */
export function withApiAuth<T>(handler: ApiHandler<T>, options: ApiAuthOptions = {}): ApiHandler<T> {
  return async (req: Request) => {
    try {
      const session = await auth()
      if (!session?.userId) {
        return NextResponse.json<ApiResponse<never>>({ 
          data: null, 
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        }, { status: 401 })
      }

      // Get user's role context using server client
      const supabase = createAuthClient()
      
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
        console.error('[AUTH_ERROR]', { userId: session.userId, error: userError })
        return NextResponse.json<ApiResponse<never>>({ 
          data: null, 
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        }, { status: 404 })
      }

      // Then get the user's organization memberships if they exist
      const { data: orgMembership, error: orgError } = await supabase
        .from('OrganizationMember')
        .select(`
          role,
          scope,
          customPermissions,
          organization:organizationUlid (
            level
          )
        `)
        .eq('userUlid', userData.ulid)
        .eq('status', 'ACTIVE')
        .single()

      // Build the role context
      const roleContext: UserRoleContext = {
        systemRole: userData.systemRole,
        capabilities: userData.capabilities || [],
        orgRole: orgMembership?.role,
        orgLevel: orgMembership?.organization?.level,
        customPermissions: orgMembership?.customPermissions as Permission[] | undefined
      }

      // System role validation
      if (options.requiredSystemRole && !hasSystemRole(roleContext.systemRole, options.requiredSystemRole)) {
        return NextResponse.json<ApiResponse<never>>({ 
          data: null, 
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient system role'
          }
        }, { status: 403 })
      }

      // Organization role validation
      if (options.requiredOrgRole && options.requiredOrgLevel) {
        if (!roleContext.orgRole || !roleContext.orgLevel) {
          return NextResponse.json<ApiResponse<never>>({ 
            data: null, 
            error: {
              code: 'FORBIDDEN',
              message: 'Organization role required'
            }
          }, { status: 403 })
        }

        if (!hasOrgRole(roleContext.orgRole, options.requiredOrgRole, roleContext.orgLevel, options.requiredOrgLevel)) {
          return NextResponse.json<ApiResponse<never>>({ 
            data: null, 
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient organization role'
            }
          }, { status: 403 })
        }
      }

      // Permission validation
      if (options.requiredPermissions?.length) {
        const hasRequiredPermissions = options.requireAll
          ? options.requiredPermissions.every(p => hasPermission(roleContext, p))
          : options.requiredPermissions.some(p => hasPermission(roleContext, p))

        if (!hasRequiredPermissions) {
          return NextResponse.json<ApiResponse<never>>({ 
            data: null, 
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions'
            }
          }, { status: 403 })
        }
      }

      // Capability validation
      if (options.requiredCapabilities?.length) {
        const hasRequiredCapabilities = options.requireAll
          ? options.requiredCapabilities.every(c => hasCapability(roleContext, c))
          : options.requiredCapabilities.some(c => hasCapability(roleContext, c))

        if (!hasRequiredCapabilities) {
          return NextResponse.json<ApiResponse<never>>({ 
            data: null, 
            error: {
              code: 'FORBIDDEN',
              message: 'Required capabilities not found'
            }
          }, { status: 403 })
        }
      }

      // Call the handler with authenticated context
      return handler(req, {
        userId: session.userId,
        userUlid: userData.ulid,
        systemRole: userData.systemRole,
        roleContext
      })
    } catch (error) {
      console.error('[API_AUTH_ERROR]', error)
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication failed',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }, { status: 500 })
    }
  }
} 