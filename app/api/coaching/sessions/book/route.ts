import { NextResponse } from 'next/server'
import { ApiResponse, ApiErrorCode } from '@/utils/types/api'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'
import { z } from 'zod'
import { sendSessionConfirmationEmails } from '@/utils/email'
import { UserCapability } from '@prisma/client'
import { ulid } from 'ulid'

// Validation schema for booking request
const BookingSchema = z.object({
  coachUlid: z.string().length(26, 'Invalid coach ULID'),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  durationMinutes: z.number().int().positive(),
  rate: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'GBP'])
})

interface BookingResponse {
  session: {
    ulid: string
    startTime: string
    endTime: string
    durationMinutes: number
    rateAtBooking: number
    currencyCode: string
    status: string
  }
}

export const POST = withApiAuth<BookingResponse>(async (request, { userUlid }) => {
  try {
    const body = await request.json()
    const validatedData = BookingSchema.parse(body)
    const supabase = await createAuthClient()

    // Get coach's data and verify they are a coach
    const { data: coach, error: coachError } = await supabase
      .from('User')
      .select(`
        ulid,
        capabilities,
        firstName,
        lastName,
        email,
        coachProfile:CoachProfile!inner (
          defaultDuration,
          allowCustomDuration,
          minimumDuration,
          maximumDuration,
          hourlyRate,
          isActive
        )
      `)
      .eq('ulid', validatedData.coachUlid)
      .single()

    if (coachError) {
      console.error('[BOOKING_ERROR] Failed to fetch coach:', {
        coachUlid: validatedData.coachUlid,
        error: coachError
      })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch coach data'
        }
      }, { status: 500 })
    }

    if (!coach) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Coach not found'
        }
      }, { status: 404 })
    }

    if (!coach.capabilities?.includes('COACH')) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'INVALID_ROLE',
          message: 'Invalid coach ID'
        }
      }, { status: 400 })
    }

    const coachProfile = coach.coachProfile[0]

    if (!coachProfile?.isActive) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'COACH_UNAVAILABLE',
          message: 'Coach is not accepting bookings'
        }
      }, { status: 400 })
    }

    if (!coachProfile.allowCustomDuration && validatedData.durationMinutes !== coachProfile.defaultDuration) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'INVALID_DURATION',
          message: 'Invalid session duration'
        }
      }, { status: 400 })
    }

    if (validatedData.durationMinutes < coachProfile.minimumDuration || 
        validatedData.durationMinutes > coachProfile.maximumDuration) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'DURATION_OUT_OF_RANGE',
          message: 'Session duration outside allowed range'
        }
      }, { status: 400 })
    }

    // Validate rate
    const expectedRate = coachProfile.hourlyRate ? (validatedData.durationMinutes / 60) * coachProfile.hourlyRate : null
    
    if (!expectedRate || validatedData.rate !== expectedRate) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid session rate'
        }
      }, { status: 400 })
    }

    // Check for scheduling conflicts
    const { data: existingSessions, error: conflictError } = await supabase
      .from('Session')
      .select('ulid')
      .eq('coachId', coach.ulid)
      .or(`startTime.lte.${validatedData.endTime},endTime.gte.${validatedData.startTime}`)
      .neq('status', 'CANCELLED')

    if (conflictError) {
      console.error('[BOOKING_ERROR] Failed to check conflicts:', {
        coachUlid: coach.ulid,
        error: conflictError
      })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'CONFLICT_CHECK_ERROR',
          message: 'Error checking schedule conflicts'
        }
      }, { status: 500 })
    }

    if (existingSessions && existingSessions.length > 0) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'TIME_SLOT_TAKEN',
          message: 'Time slot is no longer available'
        }
      }, { status: 409 })
    }

    // Create the session
    const sessionUlid = ulid()
    const { data: session, error: sessionError } = await supabase
      .from('Session')
      .insert({
        ulid: sessionUlid,
        coachUlid: coach.ulid,
        menteeUlid: userUlid,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        priceAmount: validatedData.rate,
        currency: validatedData.currency,
        status: 'SCHEDULED',
        sessionType: 'MENTORSHIP',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('[BOOKING_ERROR] Failed to create session:', {
        coachUlid: coach.ulid,
        menteeUlid: userUlid,
        error: sessionError
      })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create session'
        }
      }, { status: 500 })
    }

    // Get mentee's data
    const { data: mentee, error: menteeError } = await supabase
      .from('User')
      .select('firstName, lastName, email')
      .eq('ulid', userUlid)
      .single()

    if (menteeError) {
      console.error('[BOOKING_ERROR] Failed to fetch mentee:', {
        menteeUlid: userUlid,
        error: menteeError
      })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch mentee data'
        }
      }, { status: 500 })
    }

    // Send confirmation emails
    await sendSessionConfirmationEmails({
      startTime: validatedData.startTime,
      endTime: validatedData.endTime,
      durationMinutes: validatedData.durationMinutes,
      schedulingUrl: `/dashboard/sessions/${sessionUlid}`,
      rate: validatedData.rate,
      currency: validatedData.currency,
      coach: {
        firstName: coach.firstName || '',
        lastName: coach.lastName || '',
        email: coach.email
      },
      mentee: {
        firstName: mentee.firstName || '',
        lastName: mentee.lastName || '',
        email: mentee.email
      }
    })

    return NextResponse.json<ApiResponse<BookingResponse>>({
      data: {
        session: {
          ulid: session.ulid,
          startTime: session.startTime,
          endTime: session.endTime,
          durationMinutes: validatedData.durationMinutes,
          rateAtBooking: validatedData.rate,
          currencyCode: validatedData.currency,
          status: session.status
        }
      },
      error: null
    })

  } catch (error) {
    console.error('[BOOKING_ERROR] Unexpected error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.flatten()
        }
      }, { status: 400 })
    }
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
