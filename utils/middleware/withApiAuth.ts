import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAuthClient } from '@/utils/auth'
import { ApiResponse } from '@/utils/types/api'
import { Permission, UserRole, hasAnyRole, hasPermissions } from '@/utils/roles/roles'

export interface AuthenticatedApiContext {
  userId: string
  userUlid: string
  role: UserRole
}

interface ApiAuthOptions {
  requiredRoles?: UserRole[]
  requiredPermissions?: Permission[]
  requireAll?: boolean
}

type ApiHandler<T = any> = (
  req: Request,
  ctx: AuthenticatedApiContext
) => Promise<NextResponse<ApiResponse<T>>>

export function withApiAuth<T>(handler: ApiHandler<T>, options: ApiAuthOptions = {}): ApiHandler<T> {
  return async (req: Request) => {
    try {
      // Auth check
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

      // Get user's ULID and role
      const supabase = await createAuthClient()
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('ulid, role')
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

      // Role validation
      if (options.requiredRoles?.length) {
        const hasRoles = options.requireAll
          ? hasAnyRole([userData.role], options.requiredRoles)
          : hasAnyRole([userData.role], options.requiredRoles)

        if (!hasRoles) {
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
        const hasRequiredPermissions = hasPermissions(
          [userData.role],
          options.requiredPermissions
        )

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
        role: userData.role
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