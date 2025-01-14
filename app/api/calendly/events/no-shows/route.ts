import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCalendlyConfig } from '@/lib/calendly/calendly-api'
import { 
  ApiResponse,
  NoShowRequestSchema,
  CalendlyInvitee,
  CalendlyInviteeSchema
} from '@/utils/types/calendly'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const requestResult = NoShowRequestSchema.safeParse(body)

    if (!requestResult.success) {
      const error = {
        code: 'INVALID_REQUEST',
        message: 'Invalid request body',
        details: requestResult.error.flatten()
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 400 })
    }

    const config = await getCalendlyConfig()
    
    const response = await fetch(
      `${process.env.CALENDLY_API_BASE}/no_shows`,
      {
        method: 'POST',
        headers: {
          ...config.headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ invitee: requestResult.data.inviteeUri })
      }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to create no-show:', await response.text())
      throw new Error('Failed to create no-show')
    }

    const data = await response.json()
    const inviteeResult = CalendlyInviteeSchema.safeParse(data.resource)
    if (!inviteeResult.success) {
      console.error('[CALENDLY_ERROR] Invalid invitee data:', inviteeResult.error)
      throw new Error('Invalid invitee data received from Calendly')
    }

    return NextResponse.json<ApiResponse<CalendlyInvitee>>({
      data: inviteeResult.data,
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_NO_SHOW_ERROR]', error)
    const apiError = {
      code: 'NO_SHOW_ERROR',
      message: 'Failed to create no-show',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id) {
      const error = {
        code: 'MISSING_ID',
        message: 'No-show ID is required'
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 400 })
    }

    const config = await getCalendlyConfig()
    
    const response = await fetch(
      `${process.env.CALENDLY_API_BASE}/no_shows/${params.id}`,
      {
        method: 'DELETE',
        headers: config.headers
      }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to delete no-show:', await response.text())
      throw new Error('Failed to delete no-show')
    }

    return NextResponse.json<ApiResponse<{ success: true }>>({
      data: { success: true },
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_NO_SHOW_DELETE_ERROR]', error)
    const apiError = {
      code: 'NO_SHOW_DELETE_ERROR',
      message: 'Failed to delete no-show',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
} 