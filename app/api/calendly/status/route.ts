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
    // Get Clerk auth ID
    const { userId: clerkId } = await auth()
    if (!clerkId) {
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

    // Convert Clerk ID to database ID early
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', clerkId)
      .single()

    if (userError || !userData) {
      console.error('[CALENDLY_STATUS_ERROR] User not found in database:', { clerkId, error: userError })
      return NextResponse.json({ 
        data: null,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found in database. Please complete onboarding first.',
          details: userError?.message
        }
      }, { status: 404 })
    }

    const userDbId = userData.id

    // Use database ID for all subsequent operations
    const { data: integration, error: integrationError } = await supabase
      .from('CalendlyIntegration')
      .select('*')
      .eq('userDbId', userDbId)
      .single()

    // If no integration found, return not connected
    if (integrationError?.code === 'PGRST116' || !integration) {
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