import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { 
  ApiResponse,
  CalendlyScheduledEvent,
  ScheduledEventsQuerySchema
} from '@/utils/types/calendly'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const queryResult = ScheduledEventsQuerySchema.safeParse({
      count: searchParams.get('count') ? parseInt(searchParams.get('count')!) : undefined,
      pageToken: searchParams.get('pageToken'),
      status: searchParams.get('status'),
      minStartTime: searchParams.get('minStartTime'),
      maxStartTime: searchParams.get('maxStartTime')
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

    const calendly = new CalendlyService()
    const response = await calendly.getScheduledEvents(queryResult.data) as { collection: CalendlyScheduledEvent[] }
    const events = response.collection

    return NextResponse.json<ApiResponse<CalendlyScheduledEvent[]>>({
      data: events,
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_SCHEDULED_EVENTS_ERROR]', error)
    const apiError = {
      code: 'FETCH_ERROR',
      message: 'Failed to fetch scheduled events',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
} 