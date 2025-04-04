import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { cookies } from 'next/headers'

// Define a simple interface just for what we need
interface CalendarIntegration {
  calAccessToken: string;
  calUserId?: number; // This doesn't exist in our schema
  calManagedUserId: number; // This is the correct field
}

export async function GET(request: Request) {
  try {
    // Extract calendar type and redirect URL from query parameters
    const url = new URL(request.url)
    const calendarType = url.searchParams.get('type')
    const redirectUrl = url.searchParams.get('redirect') || '/dashboard/settings?tab=integrations'
    
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
      .select('calAccessToken, calManagedUserId')
      .single()
    
    if (error || !data) {
      console.error('[CAL_OAUTH_URL_ERROR]', {
        error,
        timestamp: new Date().toISOString()
      })
      return new NextResponse('No Cal.com access token found', { status: 401 })
    }
    
    if (!data.calAccessToken) {
      return new NextResponse('No Cal.com access token found', { status: 401 })
    }
    
    // Call Cal.com API to get OAuth URL
    const response = await fetch(`https://api.cal.com/v2/calendars/${calendarType}/connect?redir=${encodeURIComponent(redirectUrl)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.calAccessToken}`,
        'x-cal-client-id': process.env.CAL_CLIENT_ID || '',
        'x-cal-secret-key': process.env.CAL_CLIENT_SECRET || ''
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[CAL_OAUTH_URL_ERROR]', {
        status: response.status,
        error: errorText,
        calendarType,
        redirectUrl,
        timestamp: new Date().toISOString()
      })
      return new NextResponse(`Failed to get OAuth URL: ${errorText}`, { status: response.status })
    }
    
    // Return the OAuth URL from Cal.com
    const responseData = await response.json()
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('[CAL_OAUTH_URL_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    })
    return new NextResponse('Failed to get OAuth URL', { status: 500 })
  }
}
