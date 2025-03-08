import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { CalendlyStatus } from '@/utils/types/calendly'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'
import { ApiResponse } from '@/utils/types/api'

export const GET = withApiAuth<CalendlyStatus>(async (req, { userUlid }) => {
  try {
    // Get Calendly integration
    const supabase = await createAuthClient()
    const { data: integration, error: integrationError } = await supabase
      .from('CalendlyIntegration')
      .select('accessToken, refreshToken, expiresAt, schedulingUrl')
      .eq('userUlid', userUlid)
      .single()

    // If no integration found, return not connected status
    if (integrationError?.code === 'PGRST116' || !integration) {
      return NextResponse.json<ApiResponse<CalendlyStatus>>({
        data: { 
          connected: false,
          message: 'Calendly account not connected'
        },
        error: null
      })
    }

    // Initialize Calendly service with ULID
    const calendly = new CalendlyService(userUlid)
    await calendly.init()

    // Get full status from Calendly service
    const status = await calendly.getStatus()

    // Return status with local integration data
    return NextResponse.json<ApiResponse<CalendlyStatus>>({
      data: {
        ...status,
        connected: true,
        expiresAt: integration.expiresAt,
        schedulingUrl: integration.schedulingUrl || status.schedulingUrl
      },
      error: null
    })

  } catch (error) {
    console.error('[CALENDLY_STATUS_ERROR]', error)
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('token') || error.message.includes('auth')) {
        return NextResponse.json<ApiResponse<CalendlyStatus>>({
          data: { 
            connected: false,
            message: 'Calendly authentication expired. Please reconnect your account.'
          },
          error: null
        })
      }
      
      if (error.message.includes('not found') || error.message.includes('404')) {
        return NextResponse.json<ApiResponse<CalendlyStatus>>({
          data: { 
            connected: false,
            message: 'Calendly account not found. Please connect your account.'
          },
          error: null
        })
      }
    }
    
    return NextResponse.json<ApiResponse<CalendlyStatus>>({ 
      data: null, 
      error: error instanceof Error ? {
        code: 'INTERNAL_ERROR',
        message: error.message
      } : {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check Calendly status'
      }
    }, { status: 500 })
  }
}) 