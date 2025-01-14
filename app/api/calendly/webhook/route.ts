import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CALENDLY_API_BASE } from '@/lib/calendly-api'
import crypto from 'crypto'

// Verify Calendly webhook signature
function verifyWebhookSignature(signature: string, body: string) {
  // TODO: Implement signature verification using crypto
  // https://developer.calendly.com/api-docs/ZG9jOjM2MzE2MDM4-webhook-signatures
  return true
}

export async function POST(req: Request) {
  try {
    const headersList = await headers()
    const signature = headersList.get('Calendly-Webhook-Signature')
    
    if (!signature) {
      return new NextResponse('Missing signature', { status: 401 })
    }

    const body = await req.text()
    
    if (!verifyWebhookSignature(signature, body)) {
      return new NextResponse('Invalid signature', { status: 401 })
    }

    const payload = JSON.parse(body)
    const { event } = payload

    // Get Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    // Store webhook event in database
    const { error: insertError } = await supabase
      .from('calendly_webhook_events')
      .insert({
        event_type: event,
        payload: payload,
        processed: false
      })

    if (insertError) {
      console.error('[CALENDLY_WEBHOOK_ERROR] Failed to store event:', insertError)
      return new NextResponse('Internal error', { status: 500 })
    }

    // Process different event types
    switch (event) {
      case 'invitee.created':
        // Handle new booking
        break
      case 'invitee.canceled':
        // Handle cancellation
        break
      case 'invitee.rescheduled':
        // Handle reschedule
        break
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[CALENDLY_WEBHOOK_ERROR]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 