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

    // If no integration found, return not connected
    if (integrationError?.code === 'PGRST116' || !integration) {
      return NextResponse.json<ApiResponse<CalendlyStatus>>({
        data: { connected: false },
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
        expiresAt: integration.expiresAt,
        schedulingUrl: integration.schedulingUrl || status.schedulingUrl
      },
      error: null
    })

  } catch (error) {
    console.error('[CALENDLY_STATUS_ERROR]', error)
    return NextResponse.json<ApiResponse<CalendlyStatus>>({ 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to check Calendly status'
    }, { status: 500 })
  }
}) 