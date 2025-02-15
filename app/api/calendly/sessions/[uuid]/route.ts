import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { 
  ApiResponse,
  CalendlyScheduledEvent,
  CalendlyScheduledEventSchema
} from '@/utils/types/calendly'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'

export const GET = withApiAuth<CalendlyScheduledEvent>(async (req: Request, context) => {
  const { userUlid } = context
  const uuid = req.url.split('/').pop() // Get UUID from URL

  if (!uuid) {
    const error = {
      code: 'INVALID_PARAMS',
      message: 'Missing session UUID'
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error 
    }, { status: 400 })
  }

  try {
    // Get Calendly integration
    const supabase = await createAuthClient()
    const { data: integration, error: integrationError } = await supabase
      .from('CalendlyIntegration')
      .select('accessToken, refreshToken, expiresAt')
      .eq('userUlid', userUlid)
      .single()

    if (integrationError || !integration) {
      console.error('[CALENDLY_SESSION_ERROR] Integration not found:', { 
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

    // Initialize Calendly service
    const calendly = new CalendlyService()
    await calendly.init()

    // Get scheduled events and find the one we want
    const events = await calendly.getScheduledEvents({
      status: 'active'
    })

    const event = events.find(e => e.uri.includes(uuid))
    if (!event) {
      const error = {
        code: 'EVENT_NOT_FOUND',
        message: 'Scheduled event not found'
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 404 })
    }

    // Validate event data
    const eventResult = CalendlyScheduledEventSchema.safeParse(event)
    if (!eventResult.success) {
      console.error('[CALENDLY_SESSION_ERROR] Invalid event data:', {
        userUlid,
        uuid,
        errors: eventResult.error.flatten()
      })
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
}) 