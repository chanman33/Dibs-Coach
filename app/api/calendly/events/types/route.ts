import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly-service'
import { 
  ApiResponse, 
  EventTypesQuery, 
  EventTypesQuerySchema,
  CalendlyEventType,
  CalendlyErrorSchema 
} from '@/utils/types/calendly'

export async function GET(request: Request) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryResult = EventTypesQuerySchema.safeParse({
      count: searchParams.get('count') ? parseInt(searchParams.get('count')!) : undefined,
      pageToken: searchParams.get('pageToken')
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

    // Get event types with validated parameters
    const calendly = new CalendlyService()
    const eventTypes = await calendly.getEventTypes(
      queryResult.data.count,
      queryResult.data.pageToken
    )

    return NextResponse.json<ApiResponse<CalendlyEventType[]>>({ 
      data: eventTypes,
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_EVENT_TYPES_ERROR]', error)
    
    const apiError = {
      code: 'FETCH_ERROR',
      message: 'Failed to fetch event types',
      details: error instanceof Error ? { message: error.message } : undefined
    }

    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
} 