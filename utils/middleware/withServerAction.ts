import { auth } from "@clerk/nextjs/server"
import { createAuthClient } from "@/utils/auth"
import { Permission, UserRole, hasAnyRole, hasPermissions } from "@/utils/roles/roles"
import { ApiResponse } from "@/utils/types/api"

export interface ServerActionContext {
  userId: string
  userUlid: string
  role: UserRole
}

interface ServerActionOptions {
  requiredRoles?: UserRole[]
  requiredPermissions?: Permission[]
  requireAll?: boolean
}

type ServerAction<T, P = any> = (
  params: P,
  ctx: ServerActionContext
) => Promise<ApiResponse<T>>

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
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('ulid, role')
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

      // Role validation
      if (options.requiredRoles?.length) {
        const hasRoles = options.requireAll
          ? hasAnyRole([userData.role], options.requiredRoles)
          : hasAnyRole([userData.role], options.requiredRoles)

        if (!hasRoles) {
          return {
            data: null,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient role permissions'
            }
          }
        }
      }

      return action(params, {
        userId: session.userId,
        userUlid: userData.ulid,
        role: userData.role
      })
    } catch (error) {
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

