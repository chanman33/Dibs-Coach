import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userUri = searchParams.get('userUri')
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')

    if (!userUri || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'userUri, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    const calendly = new CalendlyService()
    const busyTimes = await calendly.getUserBusyTimes({
      userUri,
      startTime,
      endTime,
    })

    return NextResponse.json({ busyTimes })
  } catch (error) {
    console.error('[CALENDLY_BUSY_TIMES_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch busy times' },
      { status: 500 }
    )
  }
} 