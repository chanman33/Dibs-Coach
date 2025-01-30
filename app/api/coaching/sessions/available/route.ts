import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { startOfDay, endOfDay, addDays, parseISO, isWithinInterval } from 'date-fns'
import { z } from 'zod'

// Validation schema for query parameters
const QuerySchema = z.object({
  coachId: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  duration: z.string().regex(/^\d+$/).transform(Number).optional()
})

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const coachId = searchParams.get('coachId')
    const startDate = searchParams.get('startDate')
    
    if (!coachId || !startDate) {
      return new NextResponse('Missing required parameters', { status: 400 })
    }
    
    const validatedParams = QuerySchema.parse({
      coachId,
      startDate,
      endDate: searchParams.get('endDate') || addDays(new Date(startDate), 30).toISOString(),
      duration: searchParams.get('duration') || '60'
    }) as z.infer<typeof QuerySchema> & { endDate: string, duration: number }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    )

    // Get coach's database ID and verify they are a coach
    const { data: coach, error: coachError } = await supabase
      .from('User')
      .select(`
        id,
        role,
        coachingSchedules (
          id,
          rules,
          timezone
        )
      `)
      .eq('userId', validatedParams.coachId)
      .single()

    if (coachError || !coach) {
      return new NextResponse(coachError ? 'Error fetching coach data' : 'Coach not found', { 
        status: coachError ? 500 : 404 
      })
    }

    if (!coach.role.includes('coach')) {
      return new NextResponse('Invalid coach ID', { status: 400 })
    }

    // Get existing sessions in the date range
    const { data: existingSessions, error: sessionsError } = await supabase
      .from('Session')
      .select('startTime, endTime')
      .eq('coachDbId', coach.id)
      .gte('startTime', validatedParams.startDate)
      .lte('endTime', validatedParams.endDate)
      .neq('status', 'cancelled')

    if (sessionsError) {
      return new NextResponse('Error fetching existing sessions', { status: 500 })
    }

    // Process availability rules and existing sessions to generate available slots
    const availableSlots = []
    const startDateObj = parseISO(validatedParams.startDate)
    const endDateObj = parseISO(validatedParams.endDate)
    const durationMinutes = validatedParams.duration

    // For each day in the range
    for (let date = startDateObj; date <= endDateObj; date = addDays(date, 1)) {
      const dayOfWeek = date.getDay()
      
      // Find applicable rules for this day
      const dayRules = coach.coachingSchedules
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
            slotEnd.setMinutes(slotStart.getMinutes() + durationMinutes)

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
                endTime: slotEnd.toISOString()
              })
            }

            slotStart = new Date(slotEnd)
          }
        }
      }
    }

    return NextResponse.json({ 
      data: {
        availableSlots,
        timezone: coach.coachingSchedules[0]?.timezone
      }
    })

  } catch (error) {
    console.error('[AVAILABLE_SESSIONS_ERROR]', error)
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    return new NextResponse('Internal server error', { status: 500 })
  }
} 
