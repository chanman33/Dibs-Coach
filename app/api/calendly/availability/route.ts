import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { 
  ApiResponse,
  CalendlyEventType,
  CalendlyAvailableTime
} from '@/utils/types/calendly'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { z } from 'zod'

// Query parameter validation schema
const AvailabilityQuerySchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  timezone: z.string()
})

const LOW_AVAILABILITY_THRESHOLD = 3 // Configurable threshold for low availability alert

interface AvailabilityResponse {
  eventType: Pick<CalendlyEventType, 'uri' | 'name' | 'duration' | 'description' | 'scheduling_url'>
  availableTimes: CalendlyAvailableTime[]
  hasLowAvailability: boolean
}

export const GET = withApiAuth<AvailabilityResponse[]>(async (req, { userUlid }) => {
  try {
    // Get Calendly integration
    const supabase = await createAuthClient()
    const { data: integration, error: integrationError } = await supabase
      .from('CalendlyIntegration')
      .select('accessToken, refreshToken, expiresAt')
      .eq('userUlid', userUlid)
      .single()

    if (integrationError || !integration) {
      console.error('[CALENDLY_INTEGRATION_ERROR]', { 
        userUlid, 
        error: integrationError 
      })
      const error = {
        code: 'INTEGRATION_NOT_FOUND',
        message: 'Calendly integration not found'
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 404 })
    }

    // Validate query parameters
    const { searchParams } = new URL(req.url)
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

    // Initialize Calendly service
    const calendly = new CalendlyService()
    await calendly.init()

    // Get event types
    const eventTypes = await calendly.getEventTypes()
    
    // Get availability for each event type
    const availability = await Promise.all(
      eventTypes.map(async (eventType): Promise<AvailabilityResponse> => {
        const availabilityData = await calendly.getUserAvailability(integration.accessToken)
        const times = availabilityData.collection || []

        return {
          eventType: {
            uri: eventType.uri,
            name: eventType.name,
            duration: eventType.duration,
            description: eventType.description || '',
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
}) 