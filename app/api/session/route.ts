import { NextResponse } from "next/server"
import { ApiResponse } from "@/utils/types/api"
import { withApiAuth } from "@/utils/middleware/withApiAuth"
import { createAuthClient } from "@/utils/auth"
import { z } from "zod"
import { ulidSchema } from "@/utils/types/auth"
import { ROLES } from "@/utils/roles/roles"

// Validation schemas
const SessionRateSchema = z.object({
  baseRate: z.number().positive(),
  amount: z.number().positive(),
  currency: z.enum(["USD", "EUR", "GBP"])
})

const SessionSchema = z.object({
  ulid: ulidSchema,
  coachUlid: ulidSchema,
  menteeUlid: ulidSchema,
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  durationMinutes: z.number().int().positive(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
  notes: z.string().optional(),
  zoomMeetingId: z.string().optional(),
  zoomJoinUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

const CreateSessionSchema = SessionSchema.omit({ 
  ulid: true,
  createdAt: true,
  updatedAt: true 
})

const UpdateSessionSchema = SessionSchema.partial().extend({
  ulid: ulidSchema
})

type Session = z.infer<typeof SessionSchema>
type CreateSession = z.infer<typeof CreateSessionSchema>
type UpdateSession = z.infer<typeof UpdateSessionSchema>

// Helper function to calculate session rate
async function calculateSessionRate(coachUlid: string, durationMinutes: number) {
  const supabase = await createAuthClient()

  const { data: coach } = await supabase
    .from("CoachProfile")
    .select("hourlyRate")
    .eq("userUlid", coachUlid)
    .single()

  if (!coach?.hourlyRate) return null

  return {
    baseRate: Number(coach.hourlyRate),
    amount: (Number(coach.hourlyRate) / 60) * durationMinutes,
    currency: "USD"
  }
}

export const GET = withApiAuth<Session[]>(async (req, { userUlid, role }) => {
  try {
    const supabase = await createAuthClient()

    // Build query based on role
    let query = supabase
      .from("Session")
      .select(`
        *,
        coach:coachUlid(
          ulid,
          firstName,
          lastName,
          email,
          profileImageUrl
        ),
        mentee:menteeUlid(
          ulid,
          firstName,
          lastName,
          email,
          profileImageUrl
        ),
        payment(
          ulid,
          amount,
          currency,
          status
        )
      `)

    if (role === ROLES.COACH) {
      query = query.eq("coachUlid", userUlid)
    } else if (role === ROLES.MENTEE) {
      query = query.eq("menteeUlid", userUlid)
    } else {
      query = query.or(`coachUlid.eq.${userUlid},menteeUlid.eq.${userUlid}`)
    }

    const { data, error } = await query.order("startTime", { ascending: false })

    if (error) {
      console.error("[SESSION_ERROR] Failed to fetch sessions:", { userUlid, error })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch sessions'
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<Session[]>>({
      data: data || [],
      error: null
    })
  } catch (error) {
    console.error("[SESSION_ERROR]", error)
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

export const POST = withApiAuth<Session>(async (req, { userUlid }) => {
  try {
    const body = await req.json()
    const validationResult = CreateSessionSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid session data',
          details: validationResult.error.flatten()
        }
      }, { status: 400 })
    }

    const sessionData = validationResult.data

    // Verify user is either the coach or mentee
    if (userUlid !== sessionData.coachUlid && userUlid !== sessionData.menteeUlid) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to create this session'
        }
      }, { status: 403 })
    }

    const supabase = await createAuthClient()

    // Calculate session rate
    const rate = await calculateSessionRate(
      sessionData.coachUlid,
      sessionData.durationMinutes
    )

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from("Session")
      .insert({
        ...sessionData,
        status: "SCHEDULED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select(`
        *,
        coach:coachUlid(
          ulid,
          firstName,
          lastName,
          email,
          profileImageUrl
        ),
        mentee:menteeUlid(
          ulid,
          firstName,
          lastName,
          email,
          profileImageUrl
        )
      `)
      .single()

    if (sessionError) {
      console.error("[SESSION_ERROR] Failed to create session:", { userUlid, error: sessionError })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create session'
        }
      }, { status: 500 })
    }

    // Create payment if rate exists
    if (rate) {
      const { error: paymentError } = await supabase
        .from("Payment")
        .insert({
          sessionUlid: session.ulid,
          payerUlid: sessionData.menteeUlid,
          payeeUlid: sessionData.coachUlid,
          amount: rate.amount,
          currency: rate.currency,
          status: "PENDING",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })

      if (paymentError) {
        console.error("[SESSION_ERROR] Failed to create payment:", { 
          userUlid,
          sessionUlid: session.ulid,
          error: paymentError 
        })
      }
    }

    return NextResponse.json<ApiResponse<Session>>({
      data: session,
      error: null
    })
  } catch (error) {
    console.error("[SESSION_ERROR]", error)
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

export const PUT = withApiAuth<Session>(async (req, { userUlid }) => {
  try {
    const body = await req.json()
    const validationResult = UpdateSessionSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid session data',
          details: validationResult.error.flatten()
        }
      }, { status: 400 })
    }

    const sessionData = validationResult.data
    const supabase = await createAuthClient()

    // Verify session ownership
    const { data: existing, error: existingError } = await supabase
      .from("Session")
      .select("coachUlid, menteeUlid")
      .eq("ulid", sessionData.ulid)
      .single()

    if (existingError || !existing) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found'
        }
      }, { status: 404 })
    }

    if (userUlid !== existing.coachUlid && userUlid !== existing.menteeUlid) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to update this session'
        }
      }, { status: 403 })
    }

    // Update session
    const { data: updated, error: updateError } = await supabase
      .from("Session")
      .update({
        ...sessionData,
        updatedAt: new Date().toISOString()
      })
      .eq("ulid", sessionData.ulid)
      .select(`
        *,
        coach:coachUlid(
          ulid,
          firstName,
          lastName,
          email,
          profileImageUrl
        ),
        mentee:menteeUlid(
          ulid,
          firstName,
          lastName,
          email,
          profileImageUrl
        ),
        payment(
          ulid,
          amount,
          currency,
          status
        )
      `)
      .single()

    if (updateError) {
      console.error("[SESSION_ERROR] Failed to update session:", { 
        userUlid,
        sessionUlid: sessionData.ulid,
        error: updateError 
      })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update session'
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<Session>>({
      data: updated,
      error: null
    })
  } catch (error) {
    console.error("[SESSION_ERROR]", error)
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