import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getCalendlyConfig } from '@/lib/calendly-api'

const CALENDLY_API_BASE = 'https://api.calendly.com/v2'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Initialize Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    // Get user's Calendly integration
    const { data: integration, error } = await supabase
      .from('CalendlyIntegration')
      .select('*')
      .eq('userDbId', userId)
      .single()

    if (error || !integration) {
      return NextResponse.json({
        connected: false
      })
    }

    // Get Calendly config with valid token
    const config = await getCalendlyConfig()

    // Fetch user's event types
    const response = await fetch(
      `${CALENDLY_API_BASE}/event_types?user=${integration.schedulingUrl}`,
      { headers: config.headers }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to fetch event types:', await response.text())
      throw new Error('Failed to fetch event types')
    }

    const data = await response.json()

    return NextResponse.json({
      connected: true,
      schedulingUrl: integration.schedulingUrl,
      eventTypes: data.collection.map((eventType: any) => ({
        uri: eventType.uri,
        name: eventType.name,
        duration: eventType.duration,
        url: eventType.scheduling_url
      }))
    })
  } catch (error) {
    console.error('[CALENDLY_EVENT_TYPES_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 