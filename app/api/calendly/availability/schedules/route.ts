import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { 
  ApiResponse,
  BusyTimeFilters,
  CalendlyAvailabilitySchedule
} from '@/utils/types/calendly'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { z } from 'zod'
import { ulidSchema } from '@/utils/types/auth'

// Query parameter validation schema
const SchedulesQuerySchema = z.object({
  type: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  calendar: z.string().optional(),
  userUlid: ulidSchema.optional() // Add optional userUlid for fetching other users' schedules
})

export const GET = withApiAuth<CalendlyAvailabilitySchedule[]>(async (req, { userUlid, role }) => {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url)
    const now = new Date()
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    
    const queryResult = SchedulesQuerySchema.safeParse({
      type: searchParams.get('type'),
      startDate: searchParams.get('startDate') || now.toISOString(),
      endDate: searchParams.get('endDate') || thirtyDaysFromNow.toISOString(),
      calendar: searchParams.get('calendar'),
      userUlid: searchParams.get('userUlid')
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

    // Determine which user's schedules to fetch
    const targetUlid = queryResult.data.userUlid || userUlid

    // Get Calendly integration
    const supabase = await createAuthClient()
    const { data: integration, error: integrationError } = await supabase
      .from('CalendlyIntegration')
      .select('accessToken, refreshToken, expiresAt')
      .eq('userUlid', targetUlid)
      .single()

    if (integrationError || !integration) {
      console.error('[CALENDLY_INTEGRATION_ERROR]', { 
        targetUlid, 
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

    // Get user's availability schedules
    const response = await calendly.getUserAvailability(integration.accessToken)
    const schedules = response || []

    return NextResponse.json<ApiResponse<CalendlyAvailabilitySchedule[]>>({
      data: schedules,
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_SCHEDULES_ERROR]', error)
    const apiError = {
      code: 'FETCH_ERROR',
      message: 'Failed to fetch availability schedules',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
}) 