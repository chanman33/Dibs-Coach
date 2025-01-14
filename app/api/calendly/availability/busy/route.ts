import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { 
  ApiResponse,
  CalendlyBusyTime,
  BusyTimesQuerySchema
} from '@/utils/types/calendly'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const queryResult = BusyTimesQuerySchema.safeParse({
      userUri: searchParams.get('userUri'),
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
    const busyTimes = await calendly.getUserBusyTimes(queryResult.data)

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
} 