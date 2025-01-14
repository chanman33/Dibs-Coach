import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly-service'

export async function POST(
  request: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const { uuid } = params
    const { reason } = await request.json()

    if (!reason) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      )
    }

    const calendly = new CalendlyService()
    await calendly.cancelEvent(uuid, reason)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CALENDLY_CANCEL_EVENT_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to cancel event' },
      { status: 500 }
    )
  }
} 