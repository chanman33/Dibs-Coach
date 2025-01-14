import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCalendlyConfig } from '@/lib/calendly-api'

export async function GET(
  request: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const { uuid } = params
    const { searchParams } = new URL(request.url)
    const pageToken = searchParams.get('page_token')

    const config = await getCalendlyConfig()
    
    const queryParams = new URLSearchParams()
    if (pageToken) {
      queryParams.append('page_token', pageToken)
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
    
    return NextResponse.json({
      invitees: data.collection,
      pagination: {
        next_page: !!data.pagination.next_page,
        next_page_token: data.pagination.next_page_token,
        previous_page_token: data.pagination.previous_page_token
      }
    })
  } catch (error) {
    console.error('[CALENDLY_INVITEES_ERROR]', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error'
      },
      { status: 500 }
    )
  }
} 