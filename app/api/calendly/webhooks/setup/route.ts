import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { CALENDLY_CONFIG } from '@/lib/calendly/calendly-config'
import type { ApiResponse } from '@/utils/types/calendly'

export async function POST() {
  try {
    // Extract ngrok domain from the redirect URI
    const redirectUri = CALENDLY_CONFIG.oauth.redirectUri
    if (!redirectUri) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Calendly redirect URI not configured'
        }
      }, { status: 500 })
    }

    const ngrokDomain = new URL(redirectUri).origin
    const webhookUrl = `${ngrokDomain}/api/calendly/webhooks`

    // Create webhook subscription
    const calendly = new CalendlyService()
    await calendly.init()
    const subscription = await calendly.createWebhookSubscription(webhookUrl)

    return NextResponse.json<ApiResponse<unknown>>({
      data: {
        subscription,
        webhookUrl
      },
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_WEBHOOK_SETUP_ERROR]', error)
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'SETUP_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
} 