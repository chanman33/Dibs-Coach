import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { CALENDLY_CONFIG } from '@/lib/calendly/calendly-config'
import { ApiResponse } from '@/utils/types/calendly'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'
import { z } from 'zod'

// Webhook subscription response schema
const WebhookSubscriptionSchema = z.object({
  uri: z.string(),
  url: z.string().url(),
  organization: z.string(),
  user: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  events: z.array(z.string()),
  scope: z.string()
})

type WebhookSubscription = z.infer<typeof WebhookSubscriptionSchema>

export const POST = withApiAuth<{ subscription: WebhookSubscription, webhookUrl: string }>(
  async (req, { userUlid }) => {
    try {
      // Get Calendly integration
      const supabase = await createAuthClient()
      const { data: integration, error: integrationError } = await supabase
        .from('CalendlyIntegration')
        .select('accessToken, refreshToken, expiresAt')
        .eq('userUlid', userUlid)
        .single()

      if (integrationError || !integration) {
        console.error('[CALENDLY_WEBHOOK_SETUP_ERROR] Integration not found:', { 
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

      // Extract ngrok domain from the redirect URI
      const redirectUri = CALENDLY_CONFIG.oauth.redirectUri
      if (!redirectUri) {
        const error = {
          code: 'CONFIG_ERROR',
          message: 'Calendly redirect URI not configured'
        }
        return NextResponse.json<ApiResponse<never>>({ 
          data: null, 
          error 
        }, { status: 500 })
      }

      const ngrokDomain = new URL(redirectUri).origin
      const webhookUrl = `${ngrokDomain}/api/calendly/webhooks`

      // Create webhook subscription
      const calendly = new CalendlyService()
      await calendly.init()
      const subscription = await calendly.createWebhookSubscription(webhookUrl)

      // Validate subscription response
      const validationResult = WebhookSubscriptionSchema.safeParse(subscription)
      if (!validationResult.success) {
        console.error('[CALENDLY_WEBHOOK_SETUP_ERROR] Invalid subscription response:', {
          userUlid,
          errors: validationResult.error.flatten()
        })
        const error = {
          code: 'INVALID_SUBSCRIPTION',
          message: 'Invalid webhook subscription response',
          details: validationResult.error.flatten()
        }
        return NextResponse.json<ApiResponse<never>>({ 
          data: null, 
          error 
        }, { status: 500 })
      }

      // Store webhook subscription in database
      const { error: storeError } = await supabase
        .from('CalendlyWebhookSubscription')
        .upsert({
          userUlid,
          subscriptionUri: subscription.uri,
          webhookUrl: subscription.url,
          events: subscription.events,
          scope: subscription.scope,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })

      if (storeError) {
        console.error('[CALENDLY_WEBHOOK_SETUP_ERROR] Failed to store subscription:', {
          userUlid,
          error: storeError
        })
        const error = {
          code: 'STORAGE_ERROR',
          message: 'Failed to store webhook subscription'
        }
        return NextResponse.json<ApiResponse<never>>({ 
          data: null, 
          error 
        }, { status: 500 })
      }

      return NextResponse.json<ApiResponse<{ subscription: WebhookSubscription, webhookUrl: string }>>({
        data: {
          subscription: validationResult.data,
          webhookUrl
        },
        error: null
      })
    } catch (error) {
      console.error('[CALENDLY_WEBHOOK_SETUP_ERROR]', error)
      const apiError = {
        code: 'SETUP_ERROR',
        message: 'Failed to setup webhook subscription',
        details: error instanceof Error ? { message: error.message } : undefined
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: apiError 
      }, { status: 500 })
    }
  }
) 