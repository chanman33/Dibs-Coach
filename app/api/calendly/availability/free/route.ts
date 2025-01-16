import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { 
  ApiResponse,
  CalendlyAvailableTime,
  FreeTimesQuerySchema
} from '@/utils/types/calendly'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const queryResult = FreeTimesQuerySchema.safeParse({
      eventUri: searchParams.get('eventUri'),
      startTime: searchParams.get('startTime'),
      endTime: searchParams.get('endTime')
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
    const response = await calendly.getEventTypeAvailableTimes(queryResult.data) as { collection: CalendlyAvailableTime[] }
    const availableTimes = response.collection

    return NextResponse.json<ApiResponse<CalendlyAvailableTime[]>>({
      data: availableTimes,
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_AVAILABLE_TIMES_ERROR]', error)
    const apiError = {
      code: 'FETCH_ERROR',
      message: 'Failed to fetch available times',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
} 