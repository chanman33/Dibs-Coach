import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userUri = searchParams.get('userUri')

    if (!userUri) {
      return NextResponse.json(
        { error: 'userUri is required' },
        { status: 400 }
      )
    }

    const calendly = new CalendlyService()
    const schedules = await calendly.getAvailabilitySchedules(userUri)

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error('[CALENDLY_AVAILABILITY_SCHEDULES_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability schedules' },
      { status: 500 }
    )
  }
} 