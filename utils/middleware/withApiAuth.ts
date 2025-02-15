import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAuthClient } from '@/utils/auth'
import { ApiResponse } from '@/utils/types/calendly'

export interface AuthenticatedApiContext {
  userId: string
  userUlid: string
  role: string
}

type ApiHandler<T = any> = (
  req: Request,
  ctx: AuthenticatedApiContext
) => Promise<NextResponse<ApiResponse<T>>>

export function withApiAuth<T>(handler: ApiHandler<T>): ApiHandler<T> {
  return async (req: Request) => {
    try {
      // Auth check
      const session = await auth()
      if (!session?.userId) {
        const error = {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
        return NextResponse.json<ApiResponse<never>>({ 
          data: null, 
          error 
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
        const error = {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
        return NextResponse.json<ApiResponse<never>>({ 
          data: null, 
          error 
        }, { status: 404 })
      }

      // Call the handler with authenticated context
      return handler(req, {
        userId: session.userId,
        userUlid: userData.ulid,
        role: userData.role
      })
    } catch (error) {
      console.error('[API_AUTH_ERROR]', error)
      const apiError = {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        details: error instanceof Error ? { message: error.message } : undefined
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: apiError 
      }, { status: 500 })
    }
  }
} 