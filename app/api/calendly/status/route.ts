import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'
import { 
  ApiResponse,
  CalendlyIntegration,
  CalendlyIntegrationSchema
} from '@/utils/types/calendly'

interface CalendlyStatus {
  connected: boolean
  schedulingUrl?: string
  organizationUrl?: string
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      const error = {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 401 })
    }

    // Get user's database ID first
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          },
        },
      }
    )

    // First get the user's database ID
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json<ApiResponse<CalendlyStatus>>({
        data: { connected: false },
        error: null
      })
    }

    // Then get the Calendly integration using the database ID
    const { data: integration, error } = await supabase
      .from('CalendlyIntegration')
      .select('*')
      .eq('userDbId', user.id)
      .single()

    if (error || !integration) {
      return NextResponse.json<ApiResponse<CalendlyStatus>>({
        data: { connected: false },
        error: null
      })
    }

    // Validate integration data
    const integrationResult = CalendlyIntegrationSchema.safeParse(integration)
    if (!integrationResult.success) {
      console.error('[CALENDLY_STATUS_ERROR] Invalid integration data:', integrationResult.error)
      const error = {
        code: 'INVALID_INTEGRATION',
        message: 'Invalid Calendly integration data',
        details: integrationResult.error.flatten()
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<CalendlyStatus>>({
      data: {
        connected: true,
        schedulingUrl: integrationResult.data.schedulingUrl,
        organizationUrl: integrationResult.data.organizationUrl
      },
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_STATUS_ERROR]', error)
    const apiError = {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
} 