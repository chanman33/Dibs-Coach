import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { CALENDLY_CONFIG } from '@/lib/calendly/calendly-config'

export async function POST() {
  try {
    // Extract ngrok domain from the redirect URI
    const redirectUri = CALENDLY_CONFIG.oauth.redirectUri
    if (!redirectUri) {
      throw new Error('Calendly redirect URI not configured')
    }

    const ngrokDomain = new URL(redirectUri).origin
    const webhookUrl = `${ngrokDomain}/api/calendly/webhook`

    // Create webhook subscription
    const calendly = new CalendlyService()
    const subscription = await calendly.createWebhookSubscription(webhookUrl)

    return NextResponse.json({ 
      success: true, 
      data: subscription,
      webhookUrl 
    })
  } catch (error) {
    console.error('[CALENDLY_WEBHOOK_SETUP_ERROR]', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { 
      status: 500 
    })
  }
} 