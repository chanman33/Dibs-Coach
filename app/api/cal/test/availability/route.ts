import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { createAuthClient } from '@/utils/auth'

// Type for time slots
interface TimeSlot {
  start: string
  end: string
  available: boolean
}

// Generate mock time slots for testing
function generateMockTimeSlots(date: string): TimeSlot[] {
  const slots: TimeSlot[] = []
  const startDate = new Date(`${date}T00:00:00`)
  
  // Generate slots for business hours (9 AM to 5 PM)
  for (let hour = 9; hour < 17; hour++) {
    // 30-minute slots
    for (let minute = 0; minute < 60; minute += 30) {
      const start = new Date(startDate)
      start.setHours(hour, minute)
      
      const end = new Date(start)
      end.setMinutes(end.getMinutes() + 30)
      
      // 70% chance of being available
      const available = Math.random() > 0.3
      
      slots.push({
        start: start.toISOString(),
        end: end.toISOString(),
        available
      })
    }
  }
  
  return slots
}

export async function GET(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    if (!date) {
      return NextResponse.json({ 
        success: false, 
        error: 'Date parameter is required' 
      }, { status: 400 })
    }

    const supabase = createAuthClient()
    
    // For testing purposes, we'll use mock data rather than database
    // In a real implementation, we would fetch from the database
    
    // Generate mock availability
    const mockSlots = generateMockTimeSlots(date)
    console.log('[MOCK_AVAILABILITY]', { date, slotsCount: mockSlots.length })
    
    return NextResponse.json({
      success: true,
      data: {
        timezone: 'UTC',
        slots: mockSlots
      }
    })

  } catch (error) {
    console.error('[GET_AVAILABILITY_ERROR]', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    }, { status: 500 })
  }
} 