import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { 
  ApiResponse,
  CalendlyAvailableTime,
  CalendlyEventType
} from '@/utils/types/calendly'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { z } from 'zod'

// Query parameter validation schema
const FreeTimeQuerySchema = z.object({
  eventTypeUri: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  timezone: z.string()
})

export const GET = withApiAuth<CalendlyAvailableTime[]>(async (req, { userUlid }) => {
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
    const queryResult = FreeTimeQuerySchema.safeParse({
      eventTypeUri: searchParams.get('event_type_uri'),
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

    // Initialize Calendly service
    const calendly = new CalendlyService()
    await calendly.init()

    // Get event types to find the requested one
    const eventTypes = await calendly.getEventTypes(integration.accessToken)
    const eventType = eventTypes.find(et => et.uri === queryResult.data.eventTypeUri)
    
    if (!eventType) {
      const error = {
        code: 'EVENT_TYPE_NOT_FOUND',
        message: 'Event type not found'
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 404 })
    }

    // Get available times
    const response = await calendly.getEventTypeAvailableTimes({
      eventUri: eventType.uri,
      startTime: queryResult.data.startTime,
      endTime: queryResult.data.endTime
    })
    const availableTimes = response.collection || []

    return NextResponse.json<ApiResponse<CalendlyAvailableTime[]>>({
      data: availableTimes,
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_FREE_TIMES_ERROR]', error)
    const apiError = {
      code: 'FETCH_ERROR',
      message: 'Failed to fetch available times',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
}) 