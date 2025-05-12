import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ApiResponse } from '@/utils/types'
import { getUserById } from '@/utils/auth/user-management'

type ApiHandler<T> = (req: NextRequest, context: { userUlid: string }) => Promise<NextResponse<ApiResponse<T>>>

interface WithApiAuthOptions {
  requiredRoles?: string[]
}

export function withApiAuth<T>(
  handler: ApiHandler<T>,
  options: WithApiAuthOptions = {}
) {
  return async (req: NextRequest) => {
    try {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json<ApiResponse<never>>({
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        }, { status: 401 })
      }

      // Get user's database ID and role
      const userContext = await getUserById(userId)
      if (!userContext) {
        return NextResponse.json<ApiResponse<never>>({
          data: null,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        }, { status: 404 })
      }
      const { userUlid, systemRole } = userContext

      // Check role requirements if specified
      if (options.requiredRoles && !options.requiredRoles.includes(systemRole)) {
        return NextResponse.json<ApiResponse<never>>({
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions'
          }
        }, { status: 403 })
      }

      return handler(req, { userUlid })
    } catch (error) {
      console.error('[API_AUTH_ERROR]', error)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      }, { status: 500 })
    }
  }
} 