import { NextResponse } from 'next/server'
import { createWebhookSubscription } from '@/lib/calendly-api'

export async function POST() {
  try {
    // Extract ngrok domain from the redirect URI
    const redirectUri = process.env.CALENDLY_REDIRECT_URI
    if (!redirectUri) {
      throw new Error('CALENDLY_REDIRECT_URI not configured')
    }

    const ngrokDomain = new URL(redirectUri).origin
    const webhookUrl = `${ngrokDomain}/api/calendly/webhook`

    // Create webhook subscription
    const subscription = await createWebhookSubscription(webhookUrl)

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