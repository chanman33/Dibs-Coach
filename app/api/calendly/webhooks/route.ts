import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { 
  ApiResponse, 
  WebhookEvent,
  WebhookEventSchema
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
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: {
          code: 'MISSING_SIGNATURE',
          message: 'Missing webhook signature'
        }
      }, { status: 401 })
    }

    const body = await req.text()
    
    if (!verifyWebhookSignature(signature, body)) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Invalid webhook signature'
        }
      }, { status: 401 })
    }

    // Validate webhook payload
    const webhookResult = WebhookEventSchema.safeParse(JSON.parse(body))
    if (!webhookResult.success) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Invalid webhook payload',
          details: webhookResult.error.flatten()
        }
      }, { status: 400 })
    }

    const webhook = webhookResult.data

    // Store and process webhook
    const calendly = new CalendlyService()
    await calendly.storeWebhookEvent(webhook)
    await calendly.processWebhookEvent(webhook)

    return NextResponse.json<ApiResponse<WebhookEvent>>({
      data: webhook,
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_WEBHOOK_ERROR]', error)
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
} 