import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCalendlyConfig } from '@/lib/calendly-api'

export async function POST(
  request: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const { uuid } = params
    const { reason } = await request.json()

    const config = await getCalendlyConfig()
    
    const response = await fetch(
      `${process.env.CALENDLY_API_BASE}/scheduled_events/${uuid}/cancellation`,
      {
        method: 'POST',
        headers: {
          ...config.headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to cancel event:', await response.text())
      throw new Error('Failed to cancel session')
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[CALENDLY_CANCEL_ERROR]', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error'
      },
      { status: 500 }
    )
  }
} 