import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { createSingleUseSchedulingLink } from '@/utils/calendly'
import { sendSessionConfirmationEmails } from '@/utils/email'

// Validation schema for booking request
const BookingSchema = z.object({
  coachId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  durationMinutes: z.number().int().positive(),
  rate: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'GBP'])
})

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const validatedData = BookingSchema.parse(body)

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    )

    // Get coach's data and verify they are a coach
    const { data: coach, error: coachError } = await supabase
      .from('User')
      .select(`
        id, 
        role,
        firstName,
        lastName,
        email,
        calendlyIntegration:CalendlyIntegration!inner (
          userId,
          eventTypeId
        ),
        RealtorCoachProfile!inner (
          defaultDuration,
          allowCustomDuration,
          minimumDuration,
          maximumDuration
        ),
        CoachSessionConfig!inner (
          durations,
          rates,
          currency,
          isActive
        )
      `)
      .eq('userId', validatedData.coachId)
      .single()

    if (coachError || !coach) {
      return new NextResponse(coachError ? 'Error fetching coach data' : 'Coach not found', { 
        status: coachError ? 500 : 404 
      })
    }

    if (!coach.role.includes('coach')) {
      return new NextResponse('Invalid coach ID', { status: 400 })
    }

    // Validate session configuration
    const coachConfig = coach.CoachSessionConfig[0]
    const coachProfile = coach.RealtorCoachProfile[0]

    if (!coachConfig.isActive) {
      return new NextResponse('Coach is not accepting bookings', { status: 400 })
    }

    // Validate duration
    if (!coachConfig.durations.includes(validatedData.durationMinutes) && !coachProfile.allowCustomDuration) {
      return new NextResponse('Invalid session duration', { status: 400 })
    }

    if (validatedData.durationMinutes < coachProfile.minimumDuration || 
        validatedData.durationMinutes > coachProfile.maximumDuration) {
      return new NextResponse('Session duration outside allowed range', { status: 400 })
    }

    // Validate rate and currency
    const expectedRate = coachConfig.rates[validatedData.durationMinutes.toString()] || 
      (validatedData.durationMinutes / 60) * coachConfig.rates['60']
    
    if (validatedData.rate !== expectedRate) {
      return new NextResponse('Invalid session rate', { status: 400 })
    }

    if (validatedData.currency !== coachConfig.currency) {
      return new NextResponse('Invalid currency', { status: 400 })
    }

    const calendlyEventTypeId = coach.calendlyIntegration?.[0]?.eventTypeId
    if (!calendlyEventTypeId) {
      return new NextResponse('Coach has not configured their event type', { status: 400 })
    }

    // Get mentee's database ID
    const { data: mentee, error: menteeError } = await supabase
      .from('User')
      .select('id, email, firstName, lastName')
      .eq('userId', userId)
      .single()

    if (menteeError || !mentee) {
      return new NextResponse(menteeError ? 'Error fetching user data' : 'User not found', { 
        status: menteeError ? 500 : 404 
      })
    }

    // Check for scheduling conflicts
    const { data: existingSessions, error: conflictError } = await supabase
      .from('Session')
      .select('id')
      .eq('coachDbId', coach.id)
      .or(`startTime.lte.${validatedData.endTime},endTime.gte.${validatedData.startTime}`)
      .neq('status', 'cancelled')

    if (conflictError) {
      return new NextResponse('Error checking schedule conflicts', { status: 500 })
    }

    if (existingSessions && existingSessions.length > 0) {
      return new NextResponse('Time slot is no longer available', { status: 409 })
    }

    // Create single-use scheduling link
    const schedulingLink = await createSingleUseSchedulingLink({
      eventTypeId: calendlyEventTypeId
    })

    // Create the session
    const { data: session, error: sessionError } = await supabase
      .from('Session')
      .insert({
        coachDbId: coach.id,
        menteeDbId: mentee.id,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        durationMinutes: validatedData.durationMinutes,
        rateAtBooking: validatedData.rate,
        currencyCode: validatedData.currency,
        status: 'scheduled',
        calendlySchedulingLink: schedulingLink.booking_url,
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('[BOOKING_ERROR]', sessionError)
      return new NextResponse('Failed to create session', { status: 500 })
    }

    // Send confirmation emails
    await sendSessionConfirmationEmails({
      startTime: validatedData.startTime,
      endTime: validatedData.endTime,
      durationMinutes: validatedData.durationMinutes,
      schedulingUrl: schedulingLink.booking_url,
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

    return NextResponse.json({ 
      data: {
        ...session,
        schedulingUrl: schedulingLink.booking_url
      }
    })

  } catch (error) {
    console.error('[BOOKING_ERROR]', error)
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    return new NextResponse('Internal server error', { status: 500 })
  }
} 
