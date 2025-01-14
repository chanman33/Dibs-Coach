import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const count = searchParams.get('count')
    const pageToken = searchParams.get('pageToken')
    const status = searchParams.get('status')
    const minStartTime = searchParams.get('minStartTime')
    const maxStartTime = searchParams.get('maxStartTime')

    const calendly = new CalendlyService()
    const events = await calendly.getScheduledEvents({
      count: count ? parseInt(count) : undefined,
      pageToken: pageToken || undefined,
      status: status || undefined,
      minStartTime: minStartTime || undefined,
      maxStartTime: maxStartTime || undefined,
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('[CALENDLY_SCHEDULED_EVENTS_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled events' },
      { status: 500 }
    )
  }
} 