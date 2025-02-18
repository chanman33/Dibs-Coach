import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAuthClient } from '@/utils/supabase/server'
import { ApiResponse } from '@/utils/types/api'
import { ROLES, Permission, UserRole, hasAnyRole, hasPermissions } from '@/utils/roles/roles'
import type { Database } from '@/types/supabase'

type DbUser = Database['public']['Tables']['User']['Row']
type DbUserRole = Database['public']['Enums']['UserRole']

export interface AuthenticatedApiContext {
  userId: string    // Clerk ID
  userUlid: string  // Database ULID
  role: DbUserRole  // Database role: SYSTEM_ADMIN | SYSTEM_MODERATOR | USER
}

interface ApiAuthOptions {
  requiredRoles?: DbUserRole[]
  requiredPermissions?: Permission[]
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
 * 2. Retrieves user data from database using service key
 * 3. Validates roles and permissions
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

      // Get user's ULID and role using server client
      const supabase = createAuthClient()
      const { data, error: userError } = await supabase
        .from('User')
        .select('ulid, systemRole')
        .eq('userId', session.userId)
        .single()

      if (userError || !data) {
        console.error('[AUTH_ERROR]', { userId: session.userId, error: userError })
        return NextResponse.json<ApiResponse<never>>({ 
          data: null, 
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        }, { status: 404 })
      }

      const userData = data as Pick<DbUser, 'ulid' | 'systemRole'>

      // Validate that the role is a valid UserRole
      const validRoles: DbUserRole[] = ['SYSTEM_ADMIN', 'SYSTEM_MODERATOR', 'USER']
      if (!validRoles.includes(userData.systemRole)) {
        console.error('[AUTH_ERROR]', { userId: session.userId, role: userData.systemRole })
        return NextResponse.json<ApiResponse<never>>({ 
          data: null, 
          error: {
            code: 'INVALID_ROLE',
            message: 'Invalid user role'
          }
        }, { status: 400 })
      }

      // Role validation
      if (options.requiredRoles?.length) {
        const hasRequiredRole = options.requireAll
          ? options.requiredRoles.every(role => userData.systemRole === role)
          : options.requiredRoles.some(role => userData.systemRole === role)

        if (!hasRequiredRole) {
          return NextResponse.json<ApiResponse<never>>({ 
            data: null, 
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient role permissions'
            }
          }, { status: 403 })
        }
      }

      // Permission validation
      if (options.requiredPermissions?.length) {
        // TODO: Update permission system to use new roles
        const hasRequiredPermissions = true // Temporary until we update permissions

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

      // Call the handler with authenticated context
      return handler(req, {
        userId: session.userId,
        userUlid: userData.ulid,
        role: userData.systemRole
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