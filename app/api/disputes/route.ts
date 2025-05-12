import { NextResponse } from 'next/server'
import { ApiResponse, ApiError, ApiErrorCode } from "@/utils/types/api"
import { withApiAuth } from "@/utils/middleware/withApiAuth"
import { createAuthClient } from "@/utils/auth"
import { z } from 'zod'
import { ulidSchema } from "@/utils/types/auth"
import { StripeDisputeService } from '@/lib/stripe/stripe-disputes'
import { SYSTEM_ROLES } from "@/utils/roles/roles"

export const dynamic = 'force-dynamic';

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

const DisputeStatusEnum = z.enum(['NEEDS_RESPONSE', 'UNDER_REVIEW', 'WON', 'LOST', 'WARNING_CLOSED'])
export type DisputeStatus = z.infer<typeof DisputeStatusEnum>

const DisputeSchema = z.object({
  ulid: ulidSchema,
  sessionUlid: ulidSchema,
  stripeDisputeId: z.string(),
  status: DisputeStatusEnum,
  evidence: evidenceSchema.optional(),
  amount: z.number(),
  currency: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  reason: z.string().optional(),
  evidenceDueBy: z.string().datetime().optional(),
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

// Helper to map Stripe dispute data to our Dispute type
function mapStripeToDbDispute(dbData: any, stripeData: any): Dispute {
  // Validate and map Stripe status to our enum
  let mappedStatus: DisputeStatus = 'NEEDS_RESPONSE'; // Default or handle error
  const parseResult = DisputeStatusEnum.safeParse(stripeData.status.toUpperCase().replace(/\s+/g, '_'));
  if (parseResult.success) {
    mappedStatus = parseResult.data;
  } else {
    console.warn(`[DISPUTES_MAPPER] Unknown Stripe dispute status: ${stripeData.status}`);
    // Fallback or throw error if critical. For now, using a default and original if not mappable.
    // A more robust solution might map specific known Stripe statuses.
    if (dbData.status && DisputeStatusEnum.safeParse(dbData.status).success) {
        mappedStatus = dbData.status // Use DB status if Stripe one is unknown and DB one is valid
    }
  }

  return {
    ulid: dbData.ulid,
    sessionUlid: dbData.sessionUlid,
    stripeDisputeId: stripeData.id, // Use Stripe's ID for stripeDisputeId
    status: mappedStatus,
    evidence: dbData.evidence, // Evidence from our DB
    amount: stripeData.amount / 100, // Assuming Stripe amount is in cents
    currency: stripeData.currency.toUpperCase(),
    createdAt: dbData.createdAt, // Use DB createdAt
    updatedAt: dbData.updatedAt, // Use DB updatedAt
    reason: stripeData.reason,
    evidenceDueBy: stripeData.evidence_details?.due_by ? new Date(stripeData.evidence_details.due_by * 1000).toISOString() : undefined,
  }
}

export const GET = withApiAuth<Dispute | Dispute[]>(async (req, { userUlid }) => {
  try {
    const supabase = await createAuthClient()
    // Fetch user's system role
    const { data: userProfile, error: userProfileError } = await supabase
      .from("User")
      .select("systemRole")
      .eq("ulid", userUlid)
      .single()

    if (userProfileError || !userProfile) {
      return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'USER_NOT_FOUND', message: 'User profile not found.' } }, { status: 404 });
    }
    const userSystemRole = userProfile.systemRole;

    const { searchParams } = new URL(req.url)
    const disputeUlid = searchParams.get('ulid')
    const sessionUlid = searchParams.get('sessionUlid')

    if (!disputeUlid && !sessionUlid) {
      return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Either dispute ULID or session ULID is required' } }, { status: 400 })
    }

    if (disputeUlid) {
      const { data: dbDispute, error: dbError } = await supabase
        .from('Dispute')
        .select('*, session:sessionUlid(coachUlid, menteeUlid)')
        .eq('ulid', disputeUlid)
        .single()

      if (dbError || !dbDispute) {
        console.error('[DISPUTES_ERROR] Failed to fetch DB dispute:', { userUlid, disputeUlid, error: dbError })
        return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'NOT_FOUND', message: 'Dispute not found in database' } }, { status: 404 })
      }
      
      if (!dbDispute.session) {
        console.error('[DISPUTES_ERROR] Dispute found but session data is missing:', { userUlid, disputeUlid })
        return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Dispute session data missing' } }, { status: 500 })
      }

      if (userSystemRole !== SYSTEM_ROLES.SYSTEM_OWNER && 
          userSystemRole !== SYSTEM_ROLES.SYSTEM_MODERATOR &&
          userUlid !== dbDispute.session.coachUlid && 
          userUlid !== dbDispute.session.menteeUlid) {
        return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'FORBIDDEN', message: 'Not authorized to view this dispute' } }, { status: 403 })
      }

      const stripeResult = await disputeService.getDispute(dbDispute.stripeDisputeId)
      if (stripeResult.error || !stripeResult.data) {
        return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'INTERNAL_ERROR', message: `Stripe: ${stripeResult.error?.message || 'Failed to fetch dispute from Stripe'}` } }, { status: 500 })
      }

      return NextResponse.json<ApiResponse<Dispute>>({ data: mapStripeToDbDispute(dbDispute, stripeResult.data), error: null })
    }

    if (sessionUlid) {
      const { data: session, error: sessionError } = await supabase
        .from('Session')
        .select('coachUlid, menteeUlid')
        .eq('ulid', sessionUlid)
        .single()

      if (sessionError || !session) {
        console.error('[DISPUTES_ERROR] Failed to fetch session:', { userUlid, sessionUlid, error: sessionError })
        return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'NOT_FOUND', message: 'Session not found' } }, { status: 404 })
      }

      if (userSystemRole !== SYSTEM_ROLES.SYSTEM_OWNER && 
          userSystemRole !== SYSTEM_ROLES.SYSTEM_MODERATOR &&
          userUlid !== session.coachUlid && 
          userUlid !== session.menteeUlid) {
        return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'FORBIDDEN', message: 'Not authorized to view disputes for this session' } }, { status: 403 })
      }

      const { data: dbDisputes, error: dbDisputesError } = await supabase
        .from('Dispute')
        .select('*')
        .eq('sessionUlid', sessionUlid)

      if (dbDisputesError) {
        console.error('[DISPUTES_ERROR] Failed to fetch disputes from DB:', { userUlid, sessionUlid, error: dbDisputesError })
        return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'FETCH_ERROR', message: 'Failed to fetch disputes from database' } }, { status: 500 })
      }
      if (!dbDisputes) {
        return NextResponse.json<ApiResponse<Dispute[]>>({ data: [], error: null }); // No disputes in DB for this session
      }

      const mergedDisputes: Dispute[] = [];
      for (const dbDispute of dbDisputes) {
        const stripeResult = await disputeService.getDispute(dbDispute.stripeDisputeId);
        if (stripeResult.data) {
          mergedDisputes.push(mapStripeToDbDispute(dbDispute, stripeResult.data));
        } else {
          console.warn(`[DISPUTES_WARN] Could not fetch Stripe details for dispute ${dbDispute.stripeDisputeId}`);
           if (!dbDispute.sessionUlid) { 
            console.error("[DISPUTES_ERROR] DB Dispute has null sessionUlid, skipping:", { disputeUlid: dbDispute.ulid });
            continue; 
           }
           const parseStatus = DisputeStatusEnum.safeParse(dbDispute.status);
           if(parseStatus.success){
            mergedDisputes.push({
              ulid: dbDispute.ulid,
              sessionUlid: dbDispute.sessionUlid, 
              stripeDisputeId: dbDispute.stripeDisputeId,
              status: parseStatus.data,
              amount: typeof dbDispute.amount === 'number' ? dbDispute.amount : 0, 
              currency: typeof dbDispute.currency === 'string' ? dbDispute.currency : 'USD', 
              createdAt: dbDispute.createdAt,
              updatedAt: dbDispute.updatedAt,
              evidence: undefined, // Set to undefined as dbDispute.evidence may not match evidenceSchema
              reason: typeof dbDispute.reason === 'string' ? dbDispute.reason : undefined,
              evidenceDueBy: typeof dbDispute.evidenceDueBy === 'string' ? dbDispute.evidenceDueBy : undefined,
            });
           } else {
            console.error("[DISPUTES_ERROR] DB Dispute has invalid status", {dbDisputeStatus: dbDispute.status })
           }
        }
      }
      return NextResponse.json<ApiResponse<Dispute[]>>({ data: mergedDisputes, error: null })
    }

    return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid request parameters' } }, { status: 400 })
  } catch (error) {
    console.error('[DISPUTES_ERROR] GET Handler:', error)
    const apiError: ApiError = { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred in GET handler', details: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) };
    return NextResponse.json<ApiResponse<never>>({ data: null, error: apiError }, { status: 500 })
  }
})

export const POST = withApiAuth<Dispute>(async (req, { userUlid }) => {
  try {
    const supabase = await createAuthClient();
    const { data: userProfile, error: userProfileError } = await supabase
      .from("User")
      .select("systemRole")
      .eq("ulid", userUlid)
      .single();

    if (userProfileError || !userProfile) {
      return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'USER_NOT_FOUND', message: 'User profile not found.'} }, { status: 404 });
    }
    const userSystemRole = userProfile.systemRole;

    const body = await req.json()
    const validationResult = SubmitEvidenceSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid dispute evidence data', details: validationResult.error.flatten() } }, { status: 400 })
    }

    const { disputeUlid, evidence } = validationResult.data
    
    const { data: dbDispute, error: dbError } = await supabase
      .from('Dispute')
      .select('*, session:sessionUlid(coachUlid, menteeUlid)')
      .eq('ulid', disputeUlid)
      .single()

    if (dbError || !dbDispute) {
      return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'NOT_FOUND', message: 'Dispute not found' } }, { status: 404 })
    }

    if (!dbDispute.session) {
      return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Dispute session data missing' } }, { status: 500 })
    }

    if (userSystemRole !== SYSTEM_ROLES.SYSTEM_OWNER && 
        userSystemRole !== SYSTEM_ROLES.SYSTEM_MODERATOR && 
        userUlid !== dbDispute.session.coachUlid) {
      return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'FORBIDDEN', message: 'Only the coach or admin can submit dispute evidence' } }, { status: 403 })
    }

    const stripeResult = await disputeService.submitEvidence(dbDispute.stripeDisputeId, evidence)

    if (stripeResult.error || !stripeResult.data) {
      return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'INTERNAL_ERROR', message: `Stripe: ${stripeResult.error?.message || 'Failed to submit evidence to Stripe'}` } }, { status: 500 })
    }

    const updatedDbDisputeStatus = 'UNDER_REVIEW';
    const { data: updatedDbDispute, error: updateError } = await supabase
      .from('Dispute')
      .update({
        evidence,
        status: updatedDbDisputeStatus,
        updatedAt: new Date().toISOString()
      })
      .eq('ulid', disputeUlid)
      .select()
      .single()

    if (updateError || !updatedDbDispute) {
      return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'UPDATE_ERROR', message: 'Failed to update dispute in database' } }, { status: 500 })
    }
    
    return NextResponse.json<ApiResponse<Dispute>>({ data: mapStripeToDbDispute(updatedDbDispute, stripeResult.data), error: null })

  } catch (error) {
    console.error('[DISPUTES_ERROR] POST Handler:', error)
    const apiError: ApiError = { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred in POST handler', details: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) };
    return NextResponse.json<ApiResponse<never>>({ data: null, error: apiError }, { status: 500 })
  }
})

export const PUT = withApiAuth<Dispute>(async (req, { userUlid }) => {
  try {
    const supabase = await createAuthClient();
    const { data: userProfile, error: userProfileError } = await supabase
      .from("User")
      .select("systemRole")
      .eq("ulid", userUlid)
      .single();

    if (userProfileError || !userProfile) {
       return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'USER_NOT_FOUND', message: 'User profile not found.'} }, { status: 404 });
    }
    const userSystemRole = userProfile.systemRole;

    const body = await req.json()
    const validationResult = ProcessRefundSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid refund data', details: validationResult.error.flatten() } }, { status: 400 })
    }

    const { disputeUlid, amount } = validationResult.data
    
    const { data: dbDispute, error: dbError } = await supabase
      .from('Dispute')
      .select('*, session:sessionUlid(coachUlid, menteeUlid)')
      .eq('ulid', disputeUlid)
      .single()

    if (dbError || !dbDispute) {
      return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'NOT_FOUND', message: 'Dispute not found' } }, { status: 404 })
    }
    if (!dbDispute.session) {
      return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Dispute session data missing' } }, { status: 500 })
    }

    if (userSystemRole !== SYSTEM_ROLES.SYSTEM_OWNER && 
        userSystemRole !== SYSTEM_ROLES.SYSTEM_MODERATOR && 
        userUlid !== dbDispute.session.coachUlid) {
      return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'FORBIDDEN', message: 'Only the coach or admin can process refunds' } }, { status: 403 })
    }

    const stripeResult = await disputeService.processRefund(dbDispute.stripeDisputeId, amount)

    if (stripeResult.error || !stripeResult.data) {
      return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'INTERNAL_ERROR', message: `Stripe: ${stripeResult.error?.message || 'Failed to process refund via Stripe'}` } }, { status: 500 })
    }

    const updatedDbDisputeStatus = 'WON'; 
    const { data: updatedDbDispute, error: updateError } = await supabase
      .from('Dispute')
      .update({
        status: updatedDbDisputeStatus, 
        updatedAt: new Date().toISOString()
      })
      .eq('ulid', disputeUlid)
      .select()
      .single()

    if (updateError || !updatedDbDispute) {
      return NextResponse.json<ApiResponse<never>>({ data: null, error: { code: 'UPDATE_ERROR', message: 'Failed to update dispute status in database' } }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<Dispute>>({ data: mapStripeToDbDispute(updatedDbDispute, stripeResult.data), error: null })

  } catch (error) {
    console.error('[DISPUTES_ERROR] PUT Handler:', error)
    const apiError: ApiError = { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred in PUT handler', details: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) };
    return NextResponse.json<ApiResponse<never>>({ data: null, error: apiError }, { status: 500 })
  }
}) 