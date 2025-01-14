import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventUri = searchParams.get('eventUri')
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')

    if (!eventUri || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'eventUri, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    const calendly = new CalendlyService()
    const availableTimes = await calendly.getEventTypeAvailableTimes({
      eventUri,
      startTime,
      endTime,
    })

    return NextResponse.json({ availableTimes })
  } catch (error) {
    console.error('[CALENDLY_AVAILABLE_TIMES_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch available times' },
      { status: 500 }
    )
  }
} 