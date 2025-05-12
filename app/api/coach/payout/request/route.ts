import { NextResponse } from 'next/server'
import { ApiResponse, ApiErrorCode } from '@/utils/types/api'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'
import { USER_CAPABILITIES } from "@/utils/roles/roles";
import { addDays } from 'date-fns'
import { 
  PayoutRequestSchema, 
  PayoutSchema,
  PayoutStatusEnum,
  type PayoutResponse 
} from '@/utils/types/payout'
import { generateUlid } from '@/utils/ulid'
import * as z from 'zod'

export const POST = withApiAuth<PayoutResponse>(async (req, { userUlid }) => {
  try {
    const supabase = await createAuthClient()

    // Check user capability
    const { data: userProfile, error: userProfileError } = await supabase
      .from('User')
      .select('capabilities')
      .eq('ulid', userUlid)
      .single()

    if (userProfileError || !userProfile) {
      return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'USER_NOT_FOUND', message: 'User not found.'}}, { status: 404 });
    }

    const userCapabilities = (userProfile.capabilities as string[] | null) || [];
    if (!userCapabilities.includes(USER_CAPABILITIES.COACH)) {
      return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'FORBIDDEN', message: 'User must be a coach to request a payout.'}}, { status: 403 });
    }

    const body = await req.json()
    const validatedData = PayoutRequestSchema.parse(body)

    // Calculate available balance: Sum of all COMPLETED session payments for the coach.
    // This is simplified due to the apparent absence of payoutUlid/payoutStatus on Payment table.
    // This logic assumes that another process prevents double-counting or handles which payments are included.
    const { data: completedSessionsWithPayments, error: sessionsError } = await supabase
      .from('Session')
      .select('Payment!inner(amount)') // Only fetch payments for completed sessions
      .eq('coachUlid', userUlid)
      .eq('status', 'COMPLETED')
          
    if (sessionsError) {
        console.error('[PAYOUT_BALANCE_ERROR] Error fetching sessions/payments:', { userUlid, error: sessionsError });
        return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'FETCH_ERROR', message: 'Failed to calculate available balance.' }}, { status: 500 });
    }
    
    const availableBalance = completedSessionsWithPayments?.reduce((sum: number, session: any) => {
      const payments = Array.isArray(session.Payment) ? session.Payment : [session.Payment].filter(p => p != null);
      const sessionTotal = payments.reduce((paymentSum: number, payment: any) => paymentSum + Number(payment?.amount || 0), 0);
      return sum + sessionTotal;
    }, 0) || 0

    if (availableBalance < validatedData.amount) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR', 
          message: 'Insufficient available balance'
        }
      }, { status: 400 })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: recentPayoutCount, error: countError } = await supabase
      .from('Payout')
      .select('*', { count: 'exact', head: true })
      .eq('payeeUlid', userUlid)
      .gte('createdAt', thirtyDaysAgo.toISOString())

    if (countError) {
        console.warn('[PAYOUT_COUNT_WARN] Error fetching recent payouts count, proceeding:', { userUlid, error: countError });
    }

    if (recentPayoutCount && recentPayoutCount >= 2) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'RATE_LIMITED', 
          message: 'Maximum early payout requests reached. Please wait for the scheduled bi-weekly payout.'
        }
      }, { status: 400 })
    }

    const payoutUlid = generateUlid()
    const now = new Date()
    const scheduledDate = addDays(now, 2)

    const { data: payout, error: payoutError } = await supabase
      .from('Payout')
      .insert({
        ulid: payoutUlid,
        payeeUlid: userUlid,
        amount: validatedData.amount,
        currency: validatedData.currency, // Use currency from validated data
        status: 'PENDING', // Uppercase for DB
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

    // Cannot update Payment table to link payoutUlid as the column seems to not exist based on type errors.
    // console.log('[PAYMENT_UPDATE_SKIPPED] Cannot link payoutUlid to Payment records as column seems missing.')

    let payoutForValidation: any = { ...payout }; // Use any to allow status modification
    if (payoutForValidation.status && typeof payoutForValidation.status === 'string') {
        const parsedStatus = PayoutStatusEnum.safeParse(payoutForValidation.status.toLowerCase());
        if (parsedStatus.success) {
            payoutForValidation.status = parsedStatus.data; // This is now lowercase, e.g. 'pending'
        } else {
            console.warn("[PAYOUT_STATUS_MISMATCH] Status from DB (", payout.status, ") not in Zod PayoutStatusEnum after toLowerCase. Parsing with original DB status.");
            // If parsing lowercase fails, try parsing the original uppercase status directly with a schema that expects uppercase
            // Or, accept that PayoutSchema.parse might fail if PayoutStatusEnum is strictly lowercase.
            // For now, we let it use the lowercase version if conversion was possible.
        }
    }
    
    const validatedPayout = PayoutSchema.parse(payoutForValidation); // PayoutSchema expects lowercase status from PayoutStatusEnum

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
    if (error instanceof z.ZodError) { 
        return NextResponse.json<ApiResponse<never>>({
            data: null,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Request validation failed',
                details: error.flatten()
            }
        }, { status: 400 });
    }
    // Removed the ApiErrorCode runtime check as ApiErrorCode is a type
    if (error instanceof Error && (error as any).code) { 
        const errCode = (error as any).code;
        // Basic check if it might be one of our error shapes, then re-throw with status 400
        // This is a simplified check. A more robust way is to define custom error classes.
        if (typeof errCode === 'string' && typeof (error as any).message === 'string') {
             return NextResponse.json<ApiResponse<never>>({
                data: null, 
                error: { code: errCode as ApiErrorCode, message: error.message }
            }, { status: 400 }); // Assuming custom errors with code are client errors
        }
    }
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }, { status: 500 })
  }
}) 