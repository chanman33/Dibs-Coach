import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { 
  ApiResponse, 
  CalendlyEventType
} from '@/utils/types/calendly'
import { z } from 'zod'

const EventTypesQuerySchema = z.object({
  count: z.number().optional(),
  pageToken: z.string().optional()
})

type EventTypesQuery = z.infer<typeof EventTypesQuerySchema>

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated'
      }
    }, { status: 401 })
  }

  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryResult = EventTypesQuerySchema.safeParse({
      count: searchParams.get('count') ? parseInt(searchParams.get('count')!) : undefined,
      pageToken: searchParams.get('pageToken')
    })

    if (!queryResult.success) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Invalid query parameters',
          details: queryResult.error.flatten()
        }
      }, { status: 400 })
    }

    // Get event types with validated parameters
    const calendly = new CalendlyService()
    await calendly.init()
    const eventTypes = await calendly.getEventTypes(
      undefined, // access token not needed since we're using the service
      queryResult.data.count,
      queryResult.data.pageToken
    )

    return NextResponse.json<ApiResponse<CalendlyEventType[]>>({ 
      data: eventTypes,
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_EVENT_TYPES_ERROR]', error)
    
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch event types',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
} 