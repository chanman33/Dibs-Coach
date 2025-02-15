import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { ApiResponse } from '@/utils/types/calendly'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'
import { z } from 'zod'

// Input validation schemas
const NoShowRequestSchema = z.object({
  inviteeUri: z.string().url('Invalid invitee URI')
})

type NoShowRequest = z.infer<typeof NoShowRequestSchema>

export const POST = withApiAuth<{ success: true }>(async (req, { userUlid }) => {
  try {
    // Get Calendly integration
    const supabase = await createAuthClient()
    const { data: integration, error: integrationError } = await supabase
      .from('CalendlyIntegration')
      .select('accessToken, refreshToken, expiresAt')
      .eq('userUlid', userUlid)
      .single()

    if (integrationError || !integration) {
      console.error('[CALENDLY_NO_SHOW_ERROR] Integration not found:', { 
        userUlid, 
        error: integrationError 
      })
      const error = {
        code: 'INTEGRATION_NOT_FOUND',
        message: 'Calendly integration not found'
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 404 })
    }

    // Parse and validate request body
    const body = await req.json()
    const requestResult = NoShowRequestSchema.safeParse(body)

    if (!requestResult.success) {
      const error = {
        code: 'INVALID_REQUEST',
        message: 'Invalid request body',
        details: requestResult.error.flatten()
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 400 })
    }

    const { inviteeUri } = requestResult.data

    // Initialize Calendly service
    const calendly = new CalendlyService()
    await calendly.init()

    // Mark invitee as no-show
    await calendly.markInviteeAsNoShow(inviteeUri)

    // Log the no-show action
    const { error: logError } = await supabase
      .from('CalendlyWebhookEvent')
      .insert({
        eventType: 'invitee.no_show',
        payload: {
          inviteeUri,
          markedAt: new Date().toISOString(),
          markedBy: userUlid
        },
        processedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

    if (logError) {
      console.error('[CALENDLY_NO_SHOW_ERROR] Failed to log no-show:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json<ApiResponse<{ success: true }>>({
      data: { success: true },
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_NO_SHOW_ERROR]', error)
    const apiError = {
      code: 'NO_SHOW_ERROR',
      message: 'Failed to mark invitee as no-show',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
})

export const DELETE = withApiAuth<{ success: true }>(async (req, { userUlid }) => {
  const uuid = req.url.split('/').pop()

  if (!uuid) {
    const error = {
      code: 'MISSING_UUID',
      message: 'Invitee UUID is required'
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error 
    }, { status: 400 })
  }

  try {
    // Get Calendly integration
    const supabase = await createAuthClient()
    const { data: integration, error: integrationError } = await supabase
      .from('CalendlyIntegration')
      .select('accessToken, refreshToken, expiresAt')
      .eq('userUlid', userUlid)
      .single()

    if (integrationError || !integration) {
      console.error('[CALENDLY_NO_SHOW_ERROR] Integration not found:', { 
        userUlid, 
        error: integrationError 
      })
      const error = {
        code: 'INTEGRATION_NOT_FOUND',
        message: 'Calendly integration not found'
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 404 })
    }

    // Initialize Calendly service
    const calendly = new CalendlyService()
    await calendly.init()

    // Undo no-show status
    await calendly.undoInviteeNoShow(uuid)

    // Log the undo action
    const { error: logError } = await supabase
      .from('CalendlyWebhookEvent')
      .insert({
        eventType: 'invitee.no_show_undone',
        payload: {
          inviteeUuid: uuid,
          undoneAt: new Date().toISOString(),
          undoneBy: userUlid
        },
        processedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

    if (logError) {
      console.error('[CALENDLY_NO_SHOW_ERROR] Failed to log undo action:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json<ApiResponse<{ success: true }>>({
      data: { success: true },
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_NO_SHOW_ERROR]', error)
    const apiError = {
      code: 'UNDO_NO_SHOW_ERROR',
      message: 'Failed to undo no-show status',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
}) 