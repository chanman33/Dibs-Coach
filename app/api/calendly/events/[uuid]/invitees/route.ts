import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCalendlyConfig } from '@/lib/calendly/calendly-api'
import { 
  ApiResponse,
  CalendlyInvitee,
  CalendlyInviteeSchema
} from '@/utils/types/calendly'
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

export async function GET(
  request: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const { uuid } = params
    const { searchParams } = new URL(request.url)
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

    const config = await getCalendlyConfig()
    
    const queryParams = new URLSearchParams()
    if (queryResult.data.page_token) {
      queryParams.append('page_token', queryResult.data.page_token)
    }

    const response = await fetch(
      `${process.env.CALENDLY_API_BASE}/scheduled_events/${uuid}/invitees?${queryParams}`,
      { headers: config.headers }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to fetch invitees:', await response.text())
      throw new Error('Failed to fetch invitees')
    }

    const data = await response.json()
    
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
} 