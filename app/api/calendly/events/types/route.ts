import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const count = searchParams.get('count')
    const pageToken = searchParams.get('pageToken')

    const calendly = new CalendlyService()
    const eventTypes = await calendly.getEventTypes(
      count ? parseInt(count) : undefined,
      pageToken || undefined
    )

    return NextResponse.json({ eventTypes })
  } catch (error) {
    console.error('[CALENDLY_EVENT_TYPES_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch event types' },
      { status: 500 }
    )
  }
} 