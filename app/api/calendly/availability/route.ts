import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getEventTypes, getEventTypeAvailability } from '@/lib/calendly-api'
import { 
  ApiResponse,
  AvailabilityQuerySchema,
  CalendlyEventType,
  CalendlyAvailableTime
} from '@/utils/types/calendly'

const LOW_AVAILABILITY_THRESHOLD = 3 // Configurable threshold for low availability alert

interface AvailabilityResponse {
  eventType: Pick<CalendlyEventType, 'uri' | 'name' | 'duration' | 'description' | 'scheduling_url'>
  availableTimes: CalendlyAvailableTime[]
  hasLowAvailability: boolean
}

export async function GET(request: Request) {
  try {
    // Auth check
    const { userId } = await auth()
    if (!userId) {
      const error = {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 401 })
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url)
    const queryResult = AvailabilityQuerySchema.safeParse({
      startTime: searchParams.get('start_time'),
      endTime: searchParams.get('end_time'),
      timezone: searchParams.get('timezone')
    })

    if (!queryResult.success) {
      const error = {
        code: 'INVALID_PARAMETERS',
        message: 'Invalid query parameters',
        details: queryResult.error.flatten()
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 400 })
    }

    // Validate date range (max 7 days as per Calendly's requirements)
    const start = new Date(queryResult.data.startTime)
    const end = new Date(queryResult.data.endTime)
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysDiff > 7) {
      const error = {
        code: 'INVALID_DATE_RANGE',
        message: 'Date range cannot exceed 7 days'
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 400 })
    }

    // Get event types
    const eventTypes = await getEventTypes()
    
    // Get availability for each event type
    const availability = await Promise.all(
      eventTypes.map(async (eventType): Promise<AvailabilityResponse> => {
        const times = await getEventTypeAvailability(
          eventType.uri,
          queryResult.data.startTime,
          queryResult.data.endTime
        )

        return {
          eventType: {
            uri: eventType.uri,
            name: eventType.name,
            duration: eventType.duration,
            description: eventType.description,
            scheduling_url: eventType.scheduling_url,
          },
          availableTimes: times,
          hasLowAvailability: times.length < LOW_AVAILABILITY_THRESHOLD
        }
      })
    )

    return NextResponse.json<ApiResponse<AvailabilityResponse[]>>({
      data: availability,
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_AVAILABILITY_ERROR]', error)
    
    const apiError = {
      code: 'FETCH_ERROR',
      message: 'Failed to fetch availability',
      details: error instanceof Error ? { message: error.message } : undefined
    }

    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
} 