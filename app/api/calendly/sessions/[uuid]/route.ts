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
    const config = await getCalendlyConfig()
    
    const response = await fetch(
      `${process.env.CALENDLY_API_BASE}/scheduled_events/${uuid}`,
      { headers: config.headers }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to fetch session:', await response.text())
      throw new Error('Failed to fetch session details')
    }

    const data = await response.json()
    
    // Transform the data to match our session format
    const session = {
      uri: data.resource.uri,
      name: data.resource.name,
      start_time: data.resource.start_time,
      end_time: data.resource.end_time,
      date: new Date(data.resource.start_time).toLocaleDateString(),
      status: data.resource.status,
      location: data.resource.location,
      invitees_counter: {
        active: data.resource.invitees_counter.active,
        limit: data.resource.invitees_counter.limit
      },
      event_guests: data.resource.event_guests || []
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('[CALENDLY_SESSION_ERROR]', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error'
      },
      { status: 500 }
    )
  }
} 