import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { ApiResponse } from '@/utils/types/api'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { startOfDay, endOfDay, addDays, parseISO, isWithinInterval } from 'date-fns'
import { z } from 'zod'
import { ulidSchema } from '@/utils/types/auth'

// Validation schema for query parameters
const QuerySchema = z.object({
  coachUlid: ulidSchema,
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  duration: z.string().regex(/^\d+$/).transform(Number).optional()
})

interface AvailableSlot {
  startTime: string
  endTime: string
  rate: number
  currency: string
}

interface SessionConfig {
  durations: number[]
  rates: Record<string, number>
  currency: string
  defaultDuration: number
  allowCustomDuration: boolean
  minimumDuration: number
  maximumDuration: number
}

interface AvailabilityResponse {
  availableSlots: AvailableSlot[]
  timezone: string
  sessionConfig: SessionConfig
}

export const GET = withApiAuth<AvailabilityResponse>(async (req, { userUlid }) => {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(req.url)
    const coachUlid = searchParams.get('coachUlid')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate') || addDays(new Date(startDate || ''), 30).toISOString()
    const duration = searchParams.get('duration')
    
    if (!coachUlid || !startDate) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Missing required parameters'
        }
      }, { status: 400 })
    }
    
    const validatedParams = QuerySchema.parse({
      coachUlid,
      startDate,
      endDate,
      duration: duration || undefined
    })

    const supabase = await createAuthClient()

    // Get coach's data and verify they are a coach
    const { data: coach, error: coachError } = await supabase
      .from('User')
      .select(`
        ulid,
        role,
        CoachingAvailabilitySchedule (
          ulid,
          rules,
          timezone
        ),
        CoachProfile!inner (
          defaultDuration,
          allowCustomDuration,
          minimumDuration,
          maximumDuration
        ),
        CoachConfig!inner (
          durations,
          rates,
          currency,
          isActive
        )
      `)
      .eq('ulid', validatedParams.coachUlid)
      .single()

    if (coachError || !coach) {
      console.error('[AVAILABLE_SESSIONS_ERROR] Failed to fetch coach data:', {
        coachUlid: validatedParams.coachUlid,
        error: coachError
      })
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: coachError ? 'FETCH_ERROR' : 'NOT_FOUND',
          message: coachError ? 'Failed to fetch coach data' : 'Coach not found'
        }
      }, { status: coachError ? 500 : 404 })
    }

    if (!coach.role.includes('COACH')) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'INVALID_ROLE',
          message: 'Invalid coach ID'
        }
      }, { status: 400 })
    }

    // Get existing sessions in the date range
    const { data: existingSessions, error: sessionsError } = await supabase
      .from('Session')
      .select('startTime, endTime')
      .eq('coachUlid', coach.ulid)
      .gte('startTime', validatedParams.startDate)
      .lte('endTime', validatedParams.endDate)
      .neq('status', 'CANCELLED')

    if (sessionsError) {
      console.error('[AVAILABLE_SESSIONS_ERROR] Failed to fetch existing sessions:', {
        coachUlid: validatedParams.coachUlid,
        error: sessionsError
      })
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch existing sessions'
        }
      }, { status: 500 })
    }

    // Process availability rules and existing sessions to generate available slots
    const availableSlots: AvailableSlot[] = []
    const startDateObj = parseISO(validatedParams.startDate)
    const endDateObj = parseISO(validatedParams.endDate)
    const requestedDuration = validatedParams.duration || coach.CoachProfile[0].defaultDuration

    // Validate requested duration
    const coachConfig = coach.CoachConfig[0]
    if (!coachConfig.isActive) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'COACH_UNAVAILABLE',
          message: 'Coach is not accepting bookings'
        }
      }, { status: 400 })
    }

    if (!coachConfig.durations.includes(requestedDuration) && !coach.CoachProfile[0].allowCustomDuration) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'INVALID_DURATION',
          message: 'Invalid session duration'
        }
      }, { status: 400 })
    }

    const rate = coachConfig.rates[requestedDuration.toString()] || 
      (requestedDuration / 60) * coachConfig.rates['60'] // Calculate rate based on hourly rate if custom duration

    // For each day in the range
    for (let date = startDateObj; date <= endDateObj; date = addDays(date, 1)) {
      const dayOfWeek = date.getDay()
      
      // Find applicable rules for this day
      const dayRules = coach.CoachingAvailabilitySchedule
        .flatMap(schedule => schedule.rules)
        .filter(rule => 
          (rule.type === 'wday' && rule.wday === dayOfWeek) ||
          (rule.type === 'date' && rule.date === date.toISOString().split('T')[0])
        )

      // Process each rule's intervals
      for (const rule of dayRules) {
        for (const interval of rule.intervals) {
          const [startHour, startMinute] = interval.from.split(':').map(Number)
          const [endHour, endMinute] = interval.to.split(':').map(Number)

          let slotStart = new Date(date)
          slotStart.setHours(startHour, startMinute, 0, 0)

          const intervalEnd = new Date(date)
          intervalEnd.setHours(endHour, endMinute, 0, 0)

          // Generate slots within the interval
          while (slotStart < intervalEnd) {
            const slotEnd = new Date(slotStart)
            slotEnd.setMinutes(slotStart.getMinutes() + requestedDuration)

            // Check if slot conflicts with existing sessions
            const hasConflict = existingSessions.some(session => {
              const sessionStart = new Date(session.startTime)
              const sessionEnd = new Date(session.endTime)
              return isWithinInterval(slotStart, { start: sessionStart, end: sessionEnd }) ||
                     isWithinInterval(slotEnd, { start: sessionStart, end: sessionEnd })
            })

            if (!hasConflict && slotEnd <= intervalEnd) {
              availableSlots.push({
                startTime: slotStart.toISOString(),
                endTime: slotEnd.toISOString(),
                rate,
                currency: coachConfig.currency
              })
            }

            slotStart = new Date(slotEnd)
          }
        }
      }
    }

    return NextResponse.json<ApiResponse<AvailabilityResponse>>({
      data: {
        availableSlots,
        timezone: coach.CoachingAvailabilitySchedule[0]?.timezone,
        sessionConfig: {
          durations: coachConfig.durations,
          rates: coachConfig.rates,
          currency: coachConfig.currency,
          defaultDuration: coach.CoachProfile[0].defaultDuration,
          allowCustomDuration: coach.CoachProfile[0].allowCustomDuration,
          minimumDuration: coach.CoachProfile[0].minimumDuration,
          maximumDuration: coach.CoachProfile[0].maximumDuration
        }
      },
      error: null
    })
  } catch (error) {
    console.error('[AVAILABLE_SESSIONS_ERROR]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid parameters',
          details: error.flatten()
        }
      }, { status: 400 })
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
}) 
