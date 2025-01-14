import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCalendlyConfig } from '@/lib/calendly-api'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageToken = searchParams.get('page_token')
    const status = searchParams.get('status')
    const sort = searchParams.get('sort')

    const config = await getCalendlyConfig()
    
    const queryParams = new URLSearchParams()
    if (pageToken) {
      queryParams.append('page_token', pageToken)
    }
    if (status) {
      queryParams.append('status', status)
    }
    if (sort) {
      queryParams.append('sort', sort)
    }

    const response = await fetch(
      `${process.env.CALENDLY_API_BASE}/scheduled_events?${queryParams}`,
      { headers: config.headers }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to fetch events:', await response.text())
      throw new Error('Failed to fetch scheduled events')
    }

    const data = await response.json()
    
    // Transform the data to match our session format
    const events = data.collection.map((event: any) => ({
      uri: event.uri,
      name: event.name,
      start_time: event.start_time,
      end_time: event.end_time,
      start_time_formatted: new Date(event.start_time).toLocaleTimeString(),
      end_time_formatted: new Date(event.end_time).toLocaleTimeString(),
      date: new Date(event.start_time).toLocaleDateString(),
      status: event.status
    }))

    return NextResponse.json({
      events,
      pagination: {
        next_page: !!data.pagination.next_page,
        next_page_token: data.pagination.next_page_token,
        previous_page_token: data.pagination.previous_page_token
      }
    })
  } catch (error) {
    console.error('[CALENDLY_EVENTS_ERROR]', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error'
      },
      { status: 500 }
    )
  }
} 