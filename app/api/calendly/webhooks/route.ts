import { NextResponse } from 'next/server'
import { handleCalendlyWebhook } from '@/lib/calendly/calendly-zoom-service'

// Verify Calendly webhook signature
function verifyWebhookSignature(signature: string, body: string): boolean {
  if (!process.env.CALENDLY_WEBHOOK_SIGNING_KEY) {
    console.error('Missing CALENDLY_WEBHOOK_SIGNING_KEY')
    return false
  }

  try {
    // In a production environment, implement proper signature verification
    // using crypto.createHmac with the webhook signing key
    return true
  } catch (error) {
    console.error('[WEBHOOK_SIGNATURE_ERROR]', error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('Calendly-Webhook-Signature')
    if (!signature) {
      return new NextResponse('Missing signature', { status: 401 })
    }

    const body = await request.text()
    if (!verifyWebhookSignature(signature, body)) {
      return new NextResponse('Invalid signature', { status: 401 })
    }

    const payload = JSON.parse(body)
    const result = await handleCalendlyWebhook(payload)

    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error('[CALENDLY_WEBHOOK_ERROR]', error)
    return new NextResponse(error.message || 'Internal Server Error', { 
      status: error.status || 500 
    })
  }
} 