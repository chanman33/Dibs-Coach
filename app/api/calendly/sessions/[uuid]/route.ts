import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCalendlyConfig } from '@/lib/calendly/calendly-api'
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
    const { uuid } = params
    const config = await getCalendlyConfig()
    
    const response = await fetch(
      `${process.env.CALENDLY_API_BASE}/scheduled_events/${uuid}`,
      { headers: config.headers }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to fetch session:', await response.text())
      throw new Error('Failed to fetch session details')
    }

    const data = await response.json()
    
    // Validate response data
    const sessionResult = CalendlyScheduledEventSchema.safeParse(data.resource)
    if (!sessionResult.success) {
      console.error('[CALENDLY_ERROR] Invalid session data:', sessionResult.error)
      const error = {
        code: 'INVALID_RESPONSE',
        message: 'Invalid session data received from Calendly',
        details: sessionResult.error.flatten()
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<CalendlyScheduledEvent>>({
      data: sessionResult.data,
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_SESSION_ERROR]', error)
    const apiError = {
      code: 'FETCH_ERROR',
      message: 'Failed to fetch session details',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
} 