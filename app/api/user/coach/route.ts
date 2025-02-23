import { NextResponse } from 'next/server'
import { ApiResponse } from '@/utils/types/api'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'
import { USER_CAPABILITIES } from '@/utils/roles/roles'

interface CoachUserResponse {
  ulid: string
  systemRole: string
  email: string
  firstName: string | null
  lastName: string | null
  profileImageUrl: string | null
  capabilities: string[]
}

export const GET = withApiAuth<CoachUserResponse>(async (req, { userUlid }) => {
  try {
    const supabase = await createAuthClient()

    const { data: user, error } = await supabase
      .from('User')
      .select(`
        ulid,
        systemRole,
        email,
        firstName,
        lastName,
        profileImageUrl,
        capabilities
      `)
      .eq('ulid', userUlid)
      .single()

    if (error) {
      console.error('[COACH_USER_ERROR] Failed to fetch user:', { userUlid, error })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch user data'
        }
      }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      }, { status: 404 })
    }

    if (!user.capabilities?.includes(USER_CAPABILITIES.COACH)) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'User is not a coach'
        }
      }, { status: 403 })
    }

    return NextResponse.json<ApiResponse<CoachUserResponse>>({
      data: {
        ulid: user.ulid,
        systemRole: user.systemRole,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        capabilities: user.capabilities || []
      },
      error: null
    })
  } catch (error) {
    console.error('[COACH_USER_ERROR] Unexpected error:', { userUlid, error })
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 })
  }
}, { requiredCapabilities: [USER_CAPABILITIES.COACH] }) 