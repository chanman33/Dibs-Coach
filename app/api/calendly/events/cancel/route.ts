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

    // Validate request body
    const body = await request.json()
    const requestResult = EventCancellationSchema.safeParse(body)

    if (!requestResult.success) {
      const error = {
        code: 'INVALID_REQUEST',
        message: 'Invalid request body',
        details: requestResult.error.flatten()
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 400 })
    }

    const { uuid, reason } = requestResult.data

    // Cancel the event
    const calendly = new CalendlyService()
    const response = await calendly.cancelEvent(uuid, reason)
    
    // Validate response data
    const eventResult = CalendlyScheduledEventSchema.safeParse(response)
    if (!eventResult.success) {
      console.error('[CALENDLY_ERROR] Invalid event data:', eventResult.error)
      throw new Error('Invalid event data received from Calendly')
    }

    return NextResponse.json<ApiResponse<CalendlyScheduledEvent>>({
      data: eventResult.data,
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_EVENT_CANCEL_ERROR]', error)
    const apiError = {
      code: 'CANCEL_ERROR',
      message: 'Failed to cancel event',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
} 