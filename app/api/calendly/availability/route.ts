import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getEventTypes, getEventTypeAvailability } from '@/lib/calendly-api'

const LOW_AVAILABILITY_THRESHOLD = 3 // Configurable threshold for low availability alert

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startTime = searchParams.get('start_time')
    const endTime = searchParams.get('end_time')

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: 'start_time and end_time are required' },
        { status: 400 }
      )
    }

    // Validate date range (max 7 days as per Calendly's requirements)
    const start = new Date(startTime)
    const end = new Date(endTime)
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysDiff > 7) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 7 days' },
        { status: 400 }
      )
    }

    // Get user's database ID
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

    // Get event types
    const eventTypes = await getEventTypes()
    
    // Get availability for each event type
    const availability = await Promise.all(
      eventTypes.map(async (eventType) => {
        const times = await getEventTypeAvailability(
          eventType.uri,
          startTime,
          endTime
        )

        return {
          eventType: {
            uri: eventType.uri,
            name: eventType.name,
            duration: eventType.duration,
            description: eventType.description_plain,
            scheduling_url: eventType.scheduling_url,
          },
          availableTimes: times,
          hasLowAvailability: times.length < LOW_AVAILABILITY_THRESHOLD
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: availability
    })
  } catch (error) {
    console.error('[CALENDLY_AVAILABILITY_ERROR]', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error'
      },
      { status: 500 }
    )
  }
} 