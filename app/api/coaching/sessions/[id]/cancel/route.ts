import { NextResponse } from 'next/server'
import { ApiResponse } from '@/utils/types/api'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'
import { z } from 'zod'

// Validation schema for session ID
const SessionParamsSchema = z.object({
  id: z.string().length(26, 'Invalid ULID format')
})

interface CancelSessionResponse {
  success: true
}

export const PUT = withApiAuth<CancelSessionResponse>(async (
  request: Request,
  ctx: { userUlid: string }
) => {
  try {
    // Validate session ID
    const id = request.url.split('/').slice(-2)[0]
    const validationResult = SessionParamsSchema.safeParse({ id })
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid session ID format',
          details: validationResult.error.flatten()
        }
      }, { status: 400 })
    }

    const sessionUlid = id
    const supabase = await createAuthClient()

    // Get session and verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('Session')
      .select('*')
      .eq('ulid', sessionUlid)
      .single()

    if (sessionError) {
      console.error('[CANCEL_SESSION_ERROR] Failed to fetch session:', { 
        userUlid: ctx.userUlid,
        sessionUlid,
        error: sessionError 
      })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch session'
        }
      }, { status: 500 })
    }

    if (!session) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found'
        }
      }, { status: 404 })
    }

    // Verify user is either the coach or mentee
    if (session.coachUlid !== ctx.userUlid && session.menteeUlid !== ctx.userUlid) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to cancel this session'
        }
      }, { status: 403 })
    }

    // Verify session can be cancelled
    if (session.status !== 'SCHEDULED') {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'INVALID_STATUS',
          message: `Cannot cancel a session that is ${session.status.toLowerCase()}`
        }
      }, { status: 400 })
    }

    // Cancel the session
    const { error: updateError } = await supabase
      .from('Session')
      .update({
        status: 'CANCELLED',
        updatedAt: new Date().toISOString()
      })
      .eq('ulid', sessionUlid)

    if (updateError) {
      console.error('[CANCEL_SESSION_ERROR] Failed to update session:', {
        userUlid: ctx.userUlid,
        sessionUlid,
        error: updateError
      })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to cancel session'
        }
      }, { status: 500 })
    }

    // TODO: Handle refund if payment was made
    // TODO: Send cancellation notifications
    // TODO: Remove calendar invites

    return NextResponse.json<ApiResponse<{ success: true }>>({
      data: { success: true },
      error: null
    })
  } catch (error) {
    console.error('[CANCEL_SESSION_ERROR] Unexpected error:', error)
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
}) 