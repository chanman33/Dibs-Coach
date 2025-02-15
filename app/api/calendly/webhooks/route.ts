import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { env } from '../../../../lib/env'
import crypto from 'crypto'
import { createAuthClient } from '@/utils/auth'
import { WebhookEvent, WebhookEventType, CalendlyBusyTime } from '@/utils/types/calendly'

// Webhook signature verification
function verifyWebhookSignature(payload: string, signature: string): boolean {
  try {
    const hmac = crypto.createHmac('sha256', env.CALENDLY_WEBHOOK_SIGNING_KEY)
    const digest = hmac.update(payload).digest('hex')
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    )
  } catch (error) {
    console.error('[CALENDLY_WEBHOOK_ERROR] Signature verification failed:', error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('Calendly-Webhook-Signature')

    // Verify webhook signature
    if (!signature || !verifyWebhookSignature(payload, signature)) {
      console.error('[CALENDLY_WEBHOOK_ERROR] Invalid signature')
      return new NextResponse('Invalid signature', { status: 401 })
    }

    const event = JSON.parse(payload)
    const supabase = await createAuthClient()

    // Store the webhook event
    const { error: insertError } = await supabase
      .from('CalendlyWebhookEvent')
      .insert({
        eventType: event.event,
        payload: event.payload,
        processedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

    if (insertError) {
      console.error('[CALENDLY_WEBHOOK_ERROR] Failed to store event:', insertError)
      return new NextResponse('Failed to process webhook', { status: 500 })
    }

    // Process the event based on type
    switch (event.event) {
      case 'invitee.created':
      case 'invitee.canceled':
      case 'invitee.rescheduled':
        await processBookingEvent(supabase, event)
        break
      
      case 'user.availability_updated':
        await processAvailabilityUpdate(supabase, event)
        break
      
      default:
        console.warn('[CALENDLY_WEBHOOK_WARN] Unhandled event type:', event.event)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[CALENDLY_WEBHOOK_ERROR]', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

async function processBookingEvent(supabase: any, event: WebhookEvent) {
  const { payload } = event
  const { invitee, scheduled_event: eventDetails } = payload

  try {
    const userUlid = await getUserUlidFromCalendlyUri(supabase, eventDetails.uri)
    
    // Update the booking status in our database
    const { error: updateError } = await supabase
      .from('CalendlyBooking')
      .upsert({
        calendlyEventUuid: eventDetails.uri,
        userUlid,
        status: event.event === WebhookEventType.INVITEE_CANCELED ? 'canceled' : 'active',
        startTime: eventDetails.start_time,
        endTime: eventDetails.end_time,
        inviteeEmail: invitee.email,
        inviteeName: invitee.name,
        eventType: eventDetails.event_type,
        updatedAt: new Date().toISOString(),
      })

    if (updateError) {
      throw updateError
    }

    // Mark the webhook event as processed
    await supabase
      .from('CalendlyWebhookEvent')
      .update({
        processedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('eventType', event.event)
      .eq('payload', event.payload)

  } catch (error) {
    console.error('[CALENDLY_BOOKING_ERROR] Failed to process booking event:', error)
    throw error
  }
}

async function processAvailabilityUpdate(supabase: any, event: WebhookEvent) {
  const { payload } = event
  const { event_type } = payload

  try {
    const userUlid = await getUserUlidFromCalendlyUri(supabase, event_type.uri)
    
    // Invalidate the availability cache for this user
    const { error: updateError } = await supabase
      .from('CalendlyAvailabilityCache')
      .update({
        expiresAt: new Date().toISOString(), // Expire immediately
        updatedAt: new Date().toISOString(),
      })
      .eq('userUlid', userUlid)

    if (updateError) {
      throw updateError
    }

    // Mark the webhook event as processed
    await supabase
      .from('CalendlyWebhookEvent')
      .update({
        processedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('eventType', event.event)
      .eq('payload', event.payload)

  } catch (error) {
    console.error('[CALENDLY_AVAILABILITY_ERROR] Failed to process availability update:', error)
    throw error
  }
}

async function getUserUlidFromCalendlyUri(supabase: any, calendlyUri: string): Promise<string> {
  const { data, error } = await supabase
    .from('CalendlyIntegration')
    .select('userUlid')
    .eq('organizationUrl', new URL(calendlyUri).origin)
    .single()

  if (error || !data) {
    throw new Error('Failed to find user for Calendly URI: ' + calendlyUri)
  }

  return data.userUlid
} 