import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { 
  getOrganizationMemberships, 
  getUserAvailabilitySchedules, 
  getUserBusyTimes 
} from '@/lib/calendly-api'

export async function GET(request: Request) {
  try {
    // Get coach ID from query params
    const { searchParams } = new URL(request.url)
    const coachId = searchParams.get('coachId')
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')

    if (!coachId || !startTime || !endTime) {
      return new NextResponse('Missing required parameters', { status: 400 })
    }

    // Validate date range (must be within 7 days)
    const start = new Date(startTime)
    const end = new Date(endTime)
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysDiff > 7) {
      return new NextResponse('Date range cannot exceed 7 days', { status: 400 })
    }

    // Get coach's Calendly info from database
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    const { data: coach, error: coachError } = await supabase
      .from('User')
      .select('calendly_uri')
      .eq('id', coachId)
      .single()

    if (coachError || !coach?.calendly_uri) {
      return new NextResponse('Coach not found or no Calendly integration', { status: 404 })
    }

    // Get availability data
    const [availabilitySchedules, busyTimes] = await Promise.all([
      getUserAvailabilitySchedules(coach.calendly_uri),
      getUserBusyTimes(coach.calendly_uri, startTime, endTime)
    ])

    return NextResponse.json({
      availabilitySchedules,
      busyTimes
    })
  } catch (error) {
    console.error('[CALENDLY_AVAILABILITY_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 