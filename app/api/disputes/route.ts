import { NextResponse } from 'next/server'
import { ApiResponse } from "@/utils/types/api"
import { withApiAuth } from "@/utils/middleware/withApiAuth"
import { createAuthClient } from "@/utils/auth"
import { z } from 'zod'
import { ulidSchema } from "@/utils/types/auth"
import { StripeDisputeService } from '@/lib/stripe-disputes'
import { ROLES } from "@/utils/roles/roles"

const disputeService = new StripeDisputeService()

// Validation schemas
const evidenceSchema = z.object({
  customerName: z.string().optional(),
  customerEmailAddress: z.string().email().optional(),
  billingAddress: z.string().optional(),
  serviceDate: z.string().datetime().optional(),
  productDescription: z.string().optional(),
  customerSignature: z.string().optional(),
  customerPurchaseIp: z.string().optional(),
  customerCommunication: z.string().optional(),
  uncategorizedText: z.string().optional(),
})

const DisputeSchema = z.object({
  ulid: ulidSchema,
  sessionUlid: ulidSchema,
  stripeDisputeId: z.string(),
  status: z.enum(['NEEDS_RESPONSE', 'UNDER_REVIEW', 'WON', 'LOST', 'WARNING_CLOSED']),
  evidence: evidenceSchema.optional(),
  amount: z.number(),
  currency: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

const SubmitEvidenceSchema = z.object({
  disputeUlid: ulidSchema,
  evidence: evidenceSchema,
})

const ProcessRefundSchema = z.object({
  disputeUlid: ulidSchema,
  amount: z.number().positive().optional(),
})

type Dispute = z.infer<typeof DisputeSchema>
type SubmitEvidence = z.infer<typeof SubmitEvidenceSchema>
type ProcessRefund = z.infer<typeof ProcessRefundSchema>

export const GET = withApiAuth<Dispute | Dispute[]>(async (req, { userUlid, role }) => {
  try {
    const { searchParams } = new URL(req.url)
    const disputeUlid = searchParams.get('ulid')
    const sessionUlid = searchParams.get('sessionUlid')

    if (!disputeUlid && !sessionUlid) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Either dispute ULID or session ULID is required'
        }
      }, { status: 400 })
    }

    const supabase = await createAuthClient()

    // Verify ownership/access
    if (disputeUlid) {
      const { data: dispute, error } = await supabase
        .from('Dispute')
        .select(`
          *,
          session:sessionUlid(
            coachUlid,
            menteeUlid
          )
        `)
        .eq('ulid', disputeUlid)
        .single()

      if (error || !dispute) {
        console.error('[DISPUTES_ERROR] Failed to fetch dispute:', { userUlid, disputeUlid, error })
        return NextResponse.json<ApiResponse<never>>({
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Dispute not found'
          }
        }, { status: 404 })
      }

      // Verify user has access to this dispute
      if (role !== ROLES.ADMIN && 
          userUlid !== dispute.session.coachUlid && 
          userUlid !== dispute.session.menteeUlid) {
        return NextResponse.json<ApiResponse<never>>({
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Not authorized to view this dispute'
          }
        }, { status: 403 })
      }

      const result = await disputeService.getDispute(dispute.stripeDisputeId)
      if (result.error) {
        return NextResponse.json<ApiResponse<never>>({
          data: null,
          error: {
            code: 'STRIPE_ERROR',
            message: result.error.message
          }
        }, { status: 400 })
      }

      return NextResponse.json<ApiResponse<Dispute>>({
        data: {
          ...dispute,
          ...result.data
        },
        error: null
      })
    }

    // Get disputes by session
    if (sessionUlid) {
      const { data: session, error: sessionError } = await supabase
        .from('Session')
        .select('coachUlid, menteeUlid')
        .eq('ulid', sessionUlid)
        .single()

      if (sessionError || !session) {
        console.error('[DISPUTES_ERROR] Failed to fetch session:', { userUlid, sessionUlid, error: sessionError })
        return NextResponse.json<ApiResponse<never>>({
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Session not found'
          }
        }, { status: 404 })
      }

      // Verify user has access to this session
      if (role !== ROLES.ADMIN && 
          userUlid !== session.coachUlid && 
          userUlid !== session.menteeUlid) {
        return NextResponse.json<ApiResponse<never>>({
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Not authorized to view disputes for this session'
          }
        }, { status: 403 })
      }

      // Get disputes from database first
      const { data: disputes, error: disputesError } = await supabase
        .from('Dispute')
        .select('*')
        .eq('sessionUlid', sessionUlid)

      if (disputesError) {
        console.error('[DISPUTES_ERROR] Failed to fetch disputes:', { userUlid, sessionUlid, error: disputesError })
        return NextResponse.json<ApiResponse<never>>({
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch disputes'
          }
        }, { status: 500 })
      }

      // Then get Stripe details and merge
      const result = await disputeService.getDisputesBySession(sessionUlid)
      if (result.error) {
        return NextResponse.json<ApiResponse<never>>({
          data: null,
          error: {
            code: 'STRIPE_ERROR',
            message: result.error.message
          }
        }, { status: 400 })
      }

      // Merge database and Stripe data
      const mergedDisputes = disputes.map(dbDispute => {
        const stripeDispute = result.data?.find(d => d.id === dbDispute.stripeDisputeId)
        return {
          ...dbDispute,
          ...stripeDispute
        }
      })

      return NextResponse.json<ApiResponse<Dispute[]>>({
        data: mergedDisputes,
        error: null
      })
    }

    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters'
      }
    }, { status: 400 })
  } catch (error) {
    console.error('[DISPUTES_ERROR]', error)
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

export const POST = withApiAuth<Dispute>(async (req, { userUlid, role }) => {
  try {
    const body = await req.json()
    const validationResult = SubmitEvidenceSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid dispute evidence data',
          details: validationResult.error.flatten()
        }
      }, { status: 400 })
    }

    const { disputeUlid, evidence } = validationResult.data
    const supabase = await createAuthClient()

    // Verify dispute ownership/access
    const { data: dispute, error } = await supabase
      .from('Dispute')
      .select(`
        *,
        session:sessionUlid(
          coachUlid,
          menteeUlid
        )
      `)
      .eq('ulid', disputeUlid)
      .single()

    if (error || !dispute) {
      console.error('[DISPUTES_ERROR] Failed to fetch dispute:', { userUlid, disputeUlid, error })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Dispute not found'
        }
      }, { status: 404 })
    }

    // Only coach can submit evidence
    if (role !== ROLES.ADMIN && userUlid !== dispute.session.coachUlid) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the coach can submit dispute evidence'
        }
      }, { status: 403 })
    }

    const result = await disputeService.submitEvidence(
      dispute.stripeDisputeId,
      evidence
    )

    if (result.error) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'STRIPE_ERROR',
          message: result.error.message
        }
      }, { status: 400 })
    }

    // Update dispute in database
    const { data: updated, error: updateError } = await supabase
      .from('Dispute')
      .update({
        evidence,
        status: 'UNDER_REVIEW',
        updatedAt: new Date().toISOString()
      })
      .eq('ulid', disputeUlid)
      .select()
      .single()

    if (updateError) {
      console.error('[DISPUTES_ERROR] Failed to update dispute:', { userUlid, disputeUlid, error: updateError })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update dispute'
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<Dispute>>({
      data: {
        ...updated,
        ...result.data
      },
      error: null
    })
  } catch (error) {
    console.error('[DISPUTES_ERROR]', error)
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

export const PUT = withApiAuth<Dispute>(async (req, { userUlid, role }) => {
  try {
    const body = await req.json()
    const validationResult = ProcessRefundSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid refund data',
          details: validationResult.error.flatten()
        }
      }, { status: 400 })
    }

    const { disputeUlid, amount } = validationResult.data
    const supabase = await createAuthClient()

    // Verify dispute ownership/access
    const { data: dispute, error } = await supabase
      .from('Dispute')
      .select(`
        *,
        session:sessionUlid(
          coachUlid,
          menteeUlid
        )
      `)
      .eq('ulid', disputeUlid)
      .single()

    if (error || !dispute) {
      console.error('[DISPUTES_ERROR] Failed to fetch dispute:', { userUlid, disputeUlid, error })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Dispute not found'
        }
      }, { status: 404 })
    }

    // Only coach can process refund
    if (role !== ROLES.ADMIN && userUlid !== dispute.session.coachUlid) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the coach can process refunds'
        }
      }, { status: 403 })
    }

    const result = await disputeService.processRefund(
      dispute.stripeDisputeId,
      amount
    )

    if (result.error) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'STRIPE_ERROR',
          message: result.error.message
        }
      }, { status: 400 })
    }

    // Update dispute status
    const { data: updated, error: updateError } = await supabase
      .from('Dispute')
      .update({
        status: 'WON',
        updatedAt: new Date().toISOString()
      })
      .eq('ulid', disputeUlid)
      .select()
      .single()

    if (updateError) {
      console.error('[DISPUTES_ERROR] Failed to update dispute:', { userUlid, disputeUlid, error: updateError })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update dispute'
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<Dispute>>({
      data: {
        ...updated,
        ...result.data
      },
      error: null
    })
  } catch (error) {
    console.error('[DISPUTES_ERROR]', error)
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