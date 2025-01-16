import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { 
  ApiResponse,
  CalendlyAvailabilitySchedule,
  AvailabilityScheduleQuerySchema
} from '@/utils/types/calendly'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const queryResult = AvailabilityScheduleQuerySchema.safeParse({
      userUri: searchParams.get('userUri')
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
    const response = await calendly.getUserAvailabilitySchedules(queryResult.data.userUri) as { collection: CalendlyAvailabilitySchedule[] }
    const schedules = response.collection

    return NextResponse.json<ApiResponse<CalendlyAvailabilitySchedule[]>>({
      data: schedules,
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_AVAILABILITY_SCHEDULES_ERROR]', error)
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
} 