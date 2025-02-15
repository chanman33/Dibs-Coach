import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { 
  ApiResponse,
  EventCancellationSchema,
  CalendlyScheduledEvent,
  CalendlyScheduledEventSchema
} from '@/utils/types/calendly'

export async function POST(request: Request) {
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
    // Validate request body
    const body = await request.json()
    const requestResult = EventCancellationSchema.safeParse(body)

    if (!requestResult.success) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request body',
          details: requestResult.error.flatten()
        }
      }, { status: 400 })
    }

    const { uuid, reason } = requestResult.data

    // Cancel the event
    const calendly = new CalendlyService()
    await calendly.init()
    const response = await calendly.cancelEvent(uuid, reason)
    
    // Validate response data
    const eventResult = CalendlyScheduledEventSchema.safeParse(response)
    if (!eventResult.success) {
      console.error('[CALENDLY_ERROR] Invalid event data:', eventResult.error)
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Invalid event data received from Calendly',
          details: eventResult.error.flatten()
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<CalendlyScheduledEvent>>({
      data: eventResult.data,
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_EVENT_CANCEL_ERROR]', error)
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: {
        code: 'CANCEL_ERROR',
        message: 'Failed to cancel event',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
} 