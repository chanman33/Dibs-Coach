import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { 
  ApiResponse,
  CalendlyScheduledEvent,
  ScheduledEventsQuerySchema
} from '@/utils/types/calendly'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated'
      }
    }, { status: 401 })
  }

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
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Invalid query parameters',
          details: queryResult.error.flatten()
        }
      }, { status: 400 })
    }

    const calendly = new CalendlyService()
    await calendly.init()
    const events = await calendly.getScheduledEvents({
      startTime: queryResult.data.minStartTime,
      endTime: queryResult.data.maxStartTime,
      status: queryResult.data.status
    })

    return NextResponse.json<ApiResponse<CalendlyScheduledEvent[]>>({
      data: events,
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_SCHEDULED_EVENTS_ERROR]', error)
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch scheduled events',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
} 