import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { CalendlyStatus } from '@/utils/types/calendly'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'
import { ApiResponse } from '@/utils/types/api'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: Request) {
  try {
    // Get the user ID from Clerk
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json<ApiResponse<CalendlyStatus>>({ 
        data: null, 
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, { status: 401 })
    }
    
    // Get the user ULID from the database
    const supabase = await createAuthClient()
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()
      
    if (userError || !user) {
      return NextResponse.json<ApiResponse<CalendlyStatus>>({ 
        data: null, 
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, { status: 404 })
    }
    
    const userUlid = user.ulid

    // Get Calendly integration
    const { data: integration, error: integrationError } = await supabase
      .from('CalendlyIntegration')
      .select('accessToken, refreshToken, expiresAt, schedulingUrl')
      .eq('userUlid', userUlid)
      .single()

    // If no integration found, return not connected status
    if (integrationError?.code === 'PGRST116' || !integration) {
      return NextResponse.json({
        connected: false,
        message: 'Calendly account not connected'
      })
    }

    // Initialize Calendly service with ULID
    const calendly = new CalendlyService(userUlid)
    await calendly.init()

    // Get full status from Calendly service without fetching event types
    const status = await calendly.getStatus(false)

    // Return status with local integration data
    return NextResponse.json({
      ...status,
      connected: true,
      expiresAt: integration.expiresAt,
      schedulingUrl: integration.schedulingUrl || status.schedulingUrl
    })

  } catch (error) {
    console.error('[CALENDLY_STATUS_ERROR]', error)
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('token') || error.message.includes('auth')) {
        return NextResponse.json({
          connected: false,
          message: 'Calendly authentication expired. Please reconnect your account.'
        })
      }
      
      if (error.message.includes('not found') || error.message.includes('404')) {
        return NextResponse.json({
          connected: false,
          message: 'Calendly account not found. Please connect your account.'
        })
      }
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to check Calendly status'
    }, { status: 500 })
  }
} 