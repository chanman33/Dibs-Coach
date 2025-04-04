import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // Extract calendar type from request body
    const { calendarType } = await request.json()
    
    // Validate calendar type
    if (!calendarType || !['google', 'office365'].includes(calendarType)) {
      return new NextResponse('Invalid calendar type. Must be "google" or "office365"', { status: 400 })
    }
    
    // Get Cal.com client
    const cookieStore = cookies()
    const supabase = createAuthClient()
    
    // Fetch the user's Cal.com managed user token
    const { data, error } = await supabase
      .from('CalendarIntegration')
      .select('calAccessToken')
      .single()
    
    if (error || !data) {
      console.error('[CAL_SYNC_CREDS_ERROR]', {
        error,
        timestamp: new Date().toISOString()
      })
      return new NextResponse('No Cal.com access token found', { status: 401 })
    }
    
    if (!data.calAccessToken) {
      return new NextResponse('No Cal.com access token found', { status: 401 })
    }
    
    // Call Cal.com API to sync credentials
    const response = await fetch(`https://api.cal.com/v2/calendars/${calendarType}/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.calAccessToken}`,
        'x-cal-client-id': process.env.CAL_CLIENT_ID || '',
        'x-cal-secret-key': process.env.CAL_CLIENT_SECRET || ''
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[CAL_SYNC_CREDS_ERROR]', {
        status: response.status,
        error: errorText,
        calendarType,
        timestamp: new Date().toISOString()
      })
      return new NextResponse(`Failed to sync credentials: ${errorText}`, { status: response.status })
    }
    
    // Return success response
    const responseData = await response.json()
    return NextResponse.json({ 
      success: true, 
      message: 'Calendar credentials synced successfully',
      data: responseData 
    })
  } catch (error) {
    console.error('[CAL_SYNC_CREDS_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    })
    return new NextResponse('Failed to sync calendar credentials', { status: 500 })
  }
}
