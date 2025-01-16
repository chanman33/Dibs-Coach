import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { 
  ApiResponse,
  CalendlyScheduledEvent,
  CalendlyScheduledEventSchema
} from '@/utils/types/calendly'

export async function GET(
  request: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const calendly = new CalendlyService()
    const event = await calendly.getScheduledEvent(params.uuid)

    // Validate event data
    const eventResult = CalendlyScheduledEventSchema.safeParse(event)
    if (!eventResult.success) {
      const error = {
        code: 'INVALID_EVENT',
        message: 'Invalid event data',
        details: eventResult.error.flatten()
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 400 })
    }

    return NextResponse.json<ApiResponse<CalendlyScheduledEvent>>({
      data: eventResult.data,
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_SESSION_ERROR]', error)
    const apiError = {
      code: 'FETCH_ERROR',
      message: 'Failed to fetch session',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
} 