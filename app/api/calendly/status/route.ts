import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CalendlyService } from '@/lib/calendly/calendly-service'

interface CalendlyStatus {
  connected: boolean
  schedulingUrl?: string
  expiresAt?: string
  isExpired?: boolean
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ 
        data: { connected: false },
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      }, { status: 401 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get user's database ID
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ 
        data: { connected: false },
        error: null
      })
    }

    // Get Calendly integration
    const { data: integration, error } = await supabase
      .from('CalendlyIntegration')
      .select('*')
      .eq('userDbId', user.id)
      .single()

    // If no integration found, return not connected
    if (error?.code === 'PGRST116' || !integration) {
      return NextResponse.json<{ data: CalendlyStatus }>({
        data: { connected: false }
      })
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(integration.expiresAt)
    const isExpired = now > expiresAt

    return NextResponse.json<{ data: CalendlyStatus }>({
      data: {
        connected: true,
        schedulingUrl: integration.schedulingUrl,
        expiresAt: integration.expiresAt,
        isExpired
      }
    })

  } catch (error) {
    console.error('[CALENDLY_STATUS_ERROR]', error)
    return NextResponse.json({ 
      data: null, 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check Calendly status',
        details: error instanceof Error ? error.message : undefined
      }
    }, { status: 500 })
  }
} 