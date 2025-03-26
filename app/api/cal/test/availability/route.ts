import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { createAuthClient } from '@/utils/auth'
import { calService } from '@/lib/cal/cal-service'

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

    // Get the supabase client
    const supabase = createAuthClient()
    
    // Get the user's ULID from Clerk ID
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()
    
    if (userError) {
      console.error('[GET_AVAILABILITY_ERROR] User lookup error:', {
        error: userError,
        userId,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch user data' 
      }, { status: 500 })
    }
    
    // Get the user's Cal.com integration
    const { data: integration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('*')
      .eq('userUlid', user.ulid)
      .eq('provider', 'CAL')
      .maybeSingle()
    
    if (integrationError) {
      console.error('[GET_AVAILABILITY_ERROR] Integration lookup error:', {
        error: integrationError,
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch calendar integration' 
      }, { status: 500 })
    }
    
    if (!integration) {
      return NextResponse.json({ 
        success: false, 
        error: 'No Cal.com integration found for this user' 
      }, { status: 404 })
    }
    
    // Attempt to fetch real availability data from Cal.com API
    try {
      // This should call the Cal.com API using the user's token
      // Implementing the function in calService
      const availabilityData = await calService.getUserAvailability(
        integration.calManagedUserId,
        integration.calAccessToken,
        date
      )
      
      return NextResponse.json({
        success: true,
        data: availabilityData
      })
    } catch (error) {
      console.error('[GET_AVAILABILITY_ERROR] Cal.com API error:', {
        error,
        date,
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch availability from Cal.com API' 
      }, { status: 502 }) // 502 Bad Gateway for external service failure
    }
  } catch (error) {
    console.error('[GET_AVAILABILITY_ERROR] Unexpected error:', {
      error,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    }, { status: 500 })
  }
} 