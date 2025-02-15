import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { 
  ApiResponse,
  CalendlyInvitee,
  CalendlyInviteeSchema
} from '@/utils/types/calendly'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'
import { z } from 'zod'

interface PaginatedInvitees {
  invitees: CalendlyInvitee[]
  pagination: {
    next_page: boolean
    next_page_token: string | null
    previous_page_token: string | null
  }
}

const QueryParamsSchema = z.object({
  page_token: z.string().optional()
})

export const GET = withApiAuth<PaginatedInvitees>(async (req, { userUlid }) => {
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

    // Get event UUID from params
    const uuid = req.url.split('/').slice(-2)[0]
    if (!uuid) {
      const error = {
        code: 'MISSING_UUID',
        message: 'Event UUID is required'
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 400 })
    }

    // Validate query parameters
    const { searchParams } = new URL(req.url)
    const queryResult = QueryParamsSchema.safeParse({
      page_token: searchParams.get('page_token')
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

    // Get invitees
    const response = await calendly.getEventInvitees(
      uuid,
      10, // Default count
      queryResult.data.page_token
    )

    const data = response as { 
      collection: unknown[], 
      pagination: { 
        next_page: boolean,
        next_page_token: string | null,
        previous_page_token: string | null
      }
    }
    
    // Validate response data
    const invitees = await Promise.all(
      data.collection.map(async (invitee: unknown) => {
        const result = await CalendlyInviteeSchema.safeParseAsync(invitee)
        if (!result.success) {
          console.error('[CALENDLY_ERROR] Invalid invitee data:', result.error)
          throw new Error('Invalid invitee data received from Calendly')
        }
        return result.data
      })
    )

    const response_data: PaginatedInvitees = {
      invitees,
      pagination: {
        next_page: !!data.pagination.next_page,
        next_page_token: data.pagination.next_page_token,
        previous_page_token: data.pagination.previous_page_token
      }
    }

    return NextResponse.json<ApiResponse<PaginatedInvitees>>({
      data: response_data,
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_INVITEES_ERROR]', error)
    const apiError = {
      code: 'FETCH_ERROR',
      message: 'Failed to fetch invitees',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
}) 