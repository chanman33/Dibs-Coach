import { NextResponse } from 'next/server'
import { ApiResponse } from '@/utils/types/api'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'
import { ROLES } from '@/utils/roles/roles'
import { addDays } from 'date-fns'
import { 
  PayoutRequestSchema, 
  PayoutSchema,
  type PayoutResponse 
} from '@/utils/types/payout'
import { generateULID } from '@/utils/ulid'

export const POST = withApiAuth<PayoutResponse>(async (req, { userUlid }) => {
  try {
    // Validate request body
    const body = await req.json()
    const validatedData = PayoutRequestSchema.parse(body)

    const supabase = await createAuthClient()

    // Calculate available balance from completed unpaid sessions
    const { data: completedUnpaidSessions } = await supabase
      .from('Session')
      .select('Payment(amount)')
      .eq('coachUlid', userUlid)
      .eq('status', 'COMPLETED')
      .eq('Payment.payoutStatus', 'pending')

    const availableBalance = completedUnpaidSessions?.reduce((sum: number, session: any) => {
      return sum + Number(session.Payment?.amount || 0)
    }, 0) || 0

    if (availableBalance < validatedData.amount) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: 'Insufficient available balance'
        }
      }, { status: 400 })
    }

    // Check recent payout requests (limit to 2 per 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: recentPayoutCount } = await supabase
      .from('Payout')
      .select('*', { count: 'exact', head: true })
      .eq('payeeUlid', userUlid)
      .gte('createdAt', thirtyDaysAgo.toISOString())

    if (recentPayoutCount && recentPayoutCount >= 2) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'LIMIT_EXCEEDED',
          message: 'Maximum early payout requests reached. Please wait for the scheduled bi-weekly payout.'
        }
      }, { status: 400 })
    }

    // Create payout record
    const payoutUlid = generateULID()
    const now = new Date()
    const scheduledDate = addDays(now, 2) // Early payouts processed within 2 business days

    const { data: payout, error: payoutError } = await supabase
      .from('Payout')
      .insert({
        ulid: payoutUlid,
        payeeUlid: userUlid,
        amount: validatedData.amount,
        currency: 'USD',
        status: 'pending',
        scheduledDate: scheduledDate.toISOString(),
        processedAt: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      })
      .select()
      .single()

    if (payoutError) {
      console.error('[PAYOUT_CREATE_ERROR]', { userUlid, error: payoutError })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create payout request'
        }
      }, { status: 500 })
    }

    // Update payment statuses
    const { error: updateError } = await supabase
      .from('Payment')
      .update({
        payoutStatus: 'processing',
        payoutUlid: payoutUlid
      })
      .eq('payeeUlid', userUlid)
      .eq('payoutStatus', 'pending')
      .eq('status', 'completed')

    if (updateError) {
      console.error('[PAYMENT_UPDATE_ERROR]', { userUlid, error: updateError })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update payment statuses'
        }
      }, { status: 500 })
    }

    // Validate final payout data
    const validatedPayout = PayoutSchema.parse(payout)

    return NextResponse.json<ApiResponse<PayoutResponse>>({
      data: {
        payout: validatedPayout,
        availableBalance,
        recentPayoutCount: recentPayoutCount || 0
      },
      error: null
    })
  } catch (error) {
    console.error('[PAYOUT_REQUEST_ERROR]', error)
    if (error instanceof Error) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      }, { status: 400 })
    }
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 })
  }
}, { requiredRoles: [ROLES.COACH] }) 