import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CalendlyService } from '@/lib/calendly/calendly-service'
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

    // If no integration found, return not connected
    if (error?.code === 'PGRST116' || !integration) {
      return NextResponse.json<ApiResponse<CalendlyStatus>>({
        data: { connected: false },
        error: null
      })
    }

    // If other database error, return error
    if (error) {
      console.error('[CALENDLY_STATUS_ERROR] Database error:', error)
      const apiError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch integration status'
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: apiError 
      }, { status: 500 })
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

    // Test connection by making a simple API call
    try {
      const calendly = new CalendlyService()
      const userInfo = await calendly.getUserInfo()
      
      // If we get here, the connection is working
      return NextResponse.json<ApiResponse<CalendlyStatus>>({
        data: {
          connected: true,
          schedulingUrl: integrationResult.data.schedulingUrl,
          organizationUrl: integrationResult.data.organizationUrl
        },
        error: null
      })
    } catch (error: unknown) {
      // If it's a 401 or 403, the token is invalid/expired
      if (error instanceof Error && 
          (error.message.includes('401') || error.message.includes('403'))) {
        console.error('[CALENDLY_STATUS_ERROR] Authentication failed:', error)
        return NextResponse.json<ApiResponse<CalendlyStatus>>({
          data: { connected: false },
          error: null
        })
      }

      // For other API errors, log but don't expose to client
      console.error('[CALENDLY_STATUS_ERROR] API test failed:', error)
      return NextResponse.json<ApiResponse<CalendlyStatus>>({
        data: { connected: false },
        error: null
      })
    }
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