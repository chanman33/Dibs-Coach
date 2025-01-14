import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCalendlyConfig } from '@/lib/calendly/calendly-api'
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

    // Get Calendly config
    const config = await getCalendlyConfig()
    
    // Cancel the event
    const response = await fetch(
      `${process.env.CALENDLY_API_BASE}/scheduled_events/${uuid}/cancellation`,
      {
        method: 'POST',
        headers: {
          ...config.headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to cancel event:', await response.text())
      throw new Error('Failed to cancel event')
    }

    const data = await response.json()
    
    // Validate response data
    const eventResult = CalendlyScheduledEventSchema.safeParse(data.resource)
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