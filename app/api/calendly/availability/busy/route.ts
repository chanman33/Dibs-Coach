import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { 
  ApiResponse,
  BusyTimeFilters,
  CalendlyBusyTime
} from '@/utils/types/calendly'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { z } from 'zod'

// Query parameter validation schema
const BusyTimeQuerySchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  calendar: z.boolean().optional()
})

export const GET = withApiAuth<CalendlyBusyTime[]>(async (req, { userUlid }) => {
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
    const queryResult = BusyTimeQuerySchema.safeParse({
      startTime: searchParams.get('start_time'),
      endTime: searchParams.get('end_time'),
      calendar: searchParams.get('calendar') === 'true'
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

    // Get user's busy times
    const filters: BusyTimeFilters = {
      startDate: new Date(queryResult.data.startTime),
      endDate: new Date(queryResult.data.endTime),
      calendar: queryResult.data.calendar ? 'google' : undefined
    }

    const response = await calendly.getBusyTimes(
      queryResult.data.startTime,
      queryResult.data.endTime
    )
    const busyTimes = response.collection || []

    return NextResponse.json<ApiResponse<CalendlyBusyTime[]>>({
      data: busyTimes,
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_BUSY_TIMES_ERROR]', error)
    const apiError = {
      code: 'FETCH_ERROR',
      message: 'Failed to fetch busy times',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
}) 