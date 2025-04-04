import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { cookies } from 'next/headers'

// Define a simple interface just for what we need
interface CalendarIntegration {
  calAccessToken: string;
  calManagedUserId: number;
}

export async function GET(request: Request) {
  try {
    // Extract parameters from the OAuth callback
    const url = new URL(request.url)
    const state = url.searchParams.get('state')
    const code = url.searchParams.get('code')
    const calendarType = url.searchParams.get('type')
    
    // Check required parameters
    if (!state || !code || !calendarType || !['google', 'office365'].includes(calendarType)) {
      return new NextResponse('Missing required parameters', { status: 400 })
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
      console.error('[CAL_SAVE_CREDS_ERROR]', {
        error,
        timestamp: new Date().toISOString()
      })
      return new NextResponse('No Cal.com access token found', { status: 401 })
    }
    
    if (!data.calAccessToken) {
      return new NextResponse('No Cal.com access token found', { status: 401 })
    }
    
    // Call Cal.com API to save OAuth credentials
    const response = await fetch(`https://api.cal.com/v2/calendars/${calendarType}/save?state=${state}&code=${code}`, {
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
      console.error('[CAL_SAVE_CREDS_ERROR]', {
        status: response.status,
        error: errorText,
        calendarType,
        timestamp: new Date().toISOString()
      })
      
      // Redirect to settings page with error
      return NextResponse.redirect(new URL('/dashboard/settings?tab=integrations&error=true', request.url))
    }
    
    // Next, sync the credentials
    const syncResponse = await fetch(`https://api.cal.com/v2/calendars/${calendarType}/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.calAccessToken}`,
        'x-cal-client-id': process.env.CAL_CLIENT_ID || '',
        'x-cal-secret-key': process.env.CAL_CLIENT_SECRET || ''
      }
    })
    
    if (!syncResponse.ok) {
      console.error('[CAL_SYNC_CREDS_ERROR]', {
        status: syncResponse.status,
        calendarType,
        timestamp: new Date().toISOString()
      })
    }
    
    // Update CalendarIntegration status in our database
    // We use updatedAt only, since we don't know if the other fields exist
    await supabase
      .from('CalendarIntegration')
      .update({
        updatedAt: new Date().toISOString()
      })
      .eq('calManagedUserId', data.calManagedUserId)
    
    // Redirect to settings page with success
    return NextResponse.redirect(new URL('/dashboard/settings?tab=integrations&success=true', request.url))
  } catch (error) {
    console.error('[CAL_SAVE_CREDS_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    })
    return NextResponse.redirect(new URL('/dashboard/settings?tab=integrations&error=true', request.url))
  }
}
