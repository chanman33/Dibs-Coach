import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CALENDLY_CONFIG } from '@/lib/calendly/calendly-config'
import crypto from 'crypto'
import type { CookieOptions } from '@supabase/ssr'
import { 
  ApiResponse, 
  WebhookEvent,
  WebhookEventSchema,
  WebhookEventType,
  WebhookStorage
} from '@/utils/types/calendly'

// Verify Calendly webhook signature
function verifyWebhookSignature(signature: string, body: string): boolean {
  const key = process.env.CALENDLY_WEBHOOK_SIGNING_KEY
  if (!key) {
    console.error('[CALENDLY_WEBHOOK_ERROR] Missing webhook signing key')
    return false
  }

  const hmac = crypto.createHmac('sha256', key)
  hmac.update(body)
  const computedSignature = hmac.digest('hex')
  
  return signature === computedSignature
}

export async function POST(req: Request) {
  try {
    // Verify signature
    const headersList = await headers()
    const signature = headersList.get('Calendly-Webhook-Signature')
    
    if (!signature) {
      const error = {
        code: 'MISSING_SIGNATURE',
        message: 'Missing webhook signature'
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 401 })
    }

    const body = await req.text()
    
    if (!verifyWebhookSignature(signature, body)) {
      const error = {
        code: 'INVALID_SIGNATURE',
        message: 'Invalid webhook signature'
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 401 })
    }

    // Validate webhook payload
    const webhookResult = WebhookEventSchema.safeParse(JSON.parse(body))
    if (!webhookResult.success) {
      const error = {
        code: 'INVALID_PAYLOAD',
        message: 'Invalid webhook payload',
        details: webhookResult.error.flatten()
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 400 })
    }

    const webhook = webhookResult.data

    // Get Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            return cookie?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          },
        },
      }
    )

    // Store webhook event in database
    const now = new Date().toISOString()
    const { error: insertError } = await supabase
      .from('CalendlyWebhookEvent')
      .insert<Omit<WebhookStorage, 'id'>>({
        event_type: webhook.event,
        payload: webhook.payload,
        processed: false,
        created_at: now,
        updated_at: now
      })

    if (insertError) {
      console.error('[CALENDLY_WEBHOOK_ERROR] Failed to store event:', insertError)
      const error = {
        code: 'DATABASE_ERROR',
        message: 'Failed to store webhook event',
        details: { error: insertError }
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 500 })
    }

    // Process different event types
    switch (webhook.event) {
      case WebhookEventType.INVITEE_CREATED:
        // TODO: Handle new booking
        break
      case WebhookEventType.INVITEE_CANCELED:
        // TODO: Handle cancellation
        break
      case WebhookEventType.INVITEE_RESCHEDULED:
        // TODO: Handle reschedule
        break
    }

    return NextResponse.json<ApiResponse<WebhookEvent>>({
      data: webhook,
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_WEBHOOK_ERROR]', error)
    const apiError = {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
} 