import { NextResponse } from "next/server"
import { ApiResponse } from "@/utils/types/api"
import { withApiAuth } from "@/utils/middleware/withApiAuth"
import { createAuthClient } from "@/utils/auth"
import { z } from "zod"
import { ulidSchema } from "@/utils/types/auth"
import { USER_CAPABILITIES, SYSTEM_ROLES } from "@/utils/roles/roles"
import { generateUlid } from "@/utils/ulid"

// Validation schemas
const SessionRateSchema = z.object({
  baseRate: z.number().positive(),
  amount: z.number().positive().nullable(),
  currency: z.enum(["USD", "EUR", "GBP"])
})

const SessionSchema = z.object({
  ulid: ulidSchema,
  coachUlid: ulidSchema,
  menteeUlid: ulidSchema,
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "ABSENT", "RESCHEDULED"]),
  zoomMeetingId: z.string().nullable(),
  zoomJoinUrl: z.string().url().nullable(),
  sessionType: z.enum(["MANAGED", "OFFICE_HOURS", "GROUP_SESSION"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

const CreateSessionSchema = SessionSchema.omit({
  ulid: true,
  createdAt: true,
  updatedAt: true
}).extend({
  zoomMeetingId: z.string().nullable().optional(),
  zoomJoinUrl: z.string().url().nullable().optional(),
})

const UpdateSessionSchema = SessionSchema.partial().extend({
  ulid: ulidSchema
})

type Session = z.infer<typeof SessionSchema>
type CreateSession = z.infer<typeof CreateSessionSchema>
type UpdateSession = z.infer<typeof UpdateSessionSchema>

// Helper function to calculate session rate
async function calculateSessionRate(coachUlid: string) {
  const supabase = await createAuthClient()

  const { data: coach } = await supabase
    .from("CoachProfile")
    .select("hourlyRate")
    .eq("userUlid", coachUlid)
    .single()

  if (!coach?.hourlyRate) return null

  return {
    baseRate: Number(coach.hourlyRate),
    amount: null,
    currency: "USD" as "USD" | "EUR" | "GBP"
  }
}

export const GET = withApiAuth<Session[]>(async (req, { userUlid }) => {
  try {
    const supabase = await createAuthClient()

    const { data: userProfile, error: userProfileError } = await supabase
      .from("User")
      .select("systemRole, capabilities")
      .eq("ulid", userUlid)
      .single()

    if (userProfileError || !userProfile) {
      console.error("[SESSION_ERROR] Failed to fetch user profile:", { userUlid, error: userProfileError })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch user profile'
        }
      }, { status: 500 })
    }

    const { systemRole, capabilities } = userProfile
    const userCapabilities = (capabilities as string[] | null) || []

    let query = supabase
      .from("Session")
      .select(`
        ulid, coachUlid, menteeUlid, startTime, endTime, status, zoomMeetingId, zoomJoinUrl, sessionType, createdAt, updatedAt,
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

    if (systemRole === SYSTEM_ROLES.SYSTEM_OWNER || systemRole === SYSTEM_ROLES.SYSTEM_MODERATOR) {
      // System admins can see all sessions (or define more specific logic if needed)
    } else if (userCapabilities.includes(USER_CAPABILITIES.COACH) && userCapabilities.includes(USER_CAPABILITIES.MENTEE)) {
      // User is both Coach and Mentee
      query = query.or(`coachUlid.eq.${userUlid},menteeUlid.eq.${userUlid}`)
    } else if (userCapabilities.includes(USER_CAPABILITIES.COACH)) {
      query = query.eq("coachUlid", userUlid)
    } else if (userCapabilities.includes(USER_CAPABILITIES.MENTEE)) {
      query = query.eq("menteeUlid", userUlid)
    } else {
      // User is not a coach or mentee, but might be associated with sessions directly
      // Or, if they should not see any sessions, return empty or error
      query = query.or(`coachUlid.eq.${userUlid},menteeUlid.eq.${userUlid}`) // Default: can see sessions they are part of
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
    const newSessionUlid = generateUlid()

    // Calculate session rate
    const rate = await calculateSessionRate(sessionData.coachUlid)

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from("Session")
      .insert({
        ulid: newSessionUlid,
        ...sessionData,
        status: "SCHEDULED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select(`
        ulid, coachUlid, menteeUlid, startTime, endTime, status, zoomMeetingId, zoomJoinUrl, sessionType, createdAt, updatedAt,
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
      console.error("[SESSION_ERROR] Failed to create session:", { userUlid, error: sessionError, sessionData })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create session'
        }
      }, { status: 500 })
    }

    // Create payment if rate exists
    if (rate && rate.amount !== null) {
      const newPaymentUlid = generateUlid()
      const { error: paymentError } = await supabase
        .from("Payment")
        .insert({
          ulid: newPaymentUlid,
          sessionUlid: newSessionUlid,
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
          sessionUlid: newSessionUlid,
          error: paymentError
        })
      }
    } else if (rate && rate.amount === null) {
      console.warn("[SESSION_ERROR] Payment not created because session amount could not be calculated (durationMinutes missing?)", { sessionUlid: newSessionUlid });
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
        ulid, coachUlid, menteeUlid, startTime, endTime, status, zoomMeetingId, zoomJoinUrl, sessionType, createdAt, updatedAt,
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