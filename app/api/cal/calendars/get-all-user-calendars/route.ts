import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { auth } from '@clerk/nextjs'
import { ensureValidCalToken, handleCalApiResponse } from '@/utils/cal/token-util'

/**
 * API endpoint to get all calendars for a user from Cal.com
 * 
 * This endpoint:
 * 1. Authenticates the current user
 * 2. Retrieves their Cal.com managed user token
 * 3. Refreshes the token if expired
 * 4. Calls the Cal.com /v2/calendars endpoint
 * 5. Returns formatted calendar data
 * 
 * @returns { success: boolean, data: { hasConnectedCalendars: boolean, calendars: any[] } }
 */
export async function GET() {
  try {
    // Get the user's ID from auth
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not authenticated' 
      }, { status: 401 })
    }

    // Get the user's ULID from the database
    const supabase = createAuthClient()
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()

    if (userError) {
      console.error('[CAL_GET_CALENDARS_ERROR]', {
        error: userError,
        userId,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to find user in database' 
      }, { status: 500 })
    }

    // Ensure we have a valid Cal.com token using our centralized utility
    const tokenResult = await ensureValidCalToken(userData.ulid);
    
    if (!tokenResult.success || !tokenResult.tokenInfo?.accessToken) {
      console.error('[CAL_GET_CALENDARS_ERROR]', {
        error: tokenResult.error || 'No valid token available',
        userUlid: userData.ulid,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({ 
        success: true, 
        data: { 
          hasConnectedCalendars: false, 
          calendars: [],
          tokenError: true  
        } 
      });
    }
    
    const accessToken = tokenResult.tokenInfo.accessToken;

    // Call Cal.com API to get calendar credentials
    // Important: Only use the managed user access token in the Authorization header
    // Do NOT include x-cal-client-id or x-cal-secret-key when using Bearer token
    const makeCalRequest = (token: string) => fetch('https://api.cal.com/v2/calendars', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store' // Disable caching for this request
    });
    
    // Initial request with current token
    let response = await makeCalRequest(accessToken);
    
    // Handle potential token expiration and retry with our utility
    response = await handleCalApiResponse(
      response,
      makeCalRequest,
      userData.ulid
    );

    if (!response.ok) {
      console.error('[CAL_GET_CALENDARS_ERROR]', {
        status: response.status,
        error: await response.text(),
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({ 
        success: true, 
        data: { hasConnectedCalendars: false, calendars: [] } 
      });
    }

    // Parse the response based on the exact structure from Cal.com docs
    const calendarData = await response.json();
    
    // Check for connectedCalendars in the response data structure
    // According to docs: data.connectedCalendars[] is the array we want
    const connectedCalendars = calendarData?.data?.connectedCalendars || [];
    const hasConnectedCalendars = connectedCalendars.length > 0;
    
    // Process the calendar data
    const processedCalendars = processCalendars(connectedCalendars);
    
    console.log('[CAL_GET_CALENDARS]', {
      calendarCount: processedCalendars.length,
      hasConnectedCalendars,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      data: { 
        hasConnectedCalendars,
        calendars: processedCalendars
      } 
    });
  } catch (error) {
    console.error('[CAL_GET_CALENDARS_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get user calendars' 
    }, { status: 500 });
  }
}

// Helper function to process calendar data
function processCalendars(connectedCalendars: any[] = []) {
  // Define the calendar interface based on the Cal.com API structure
  interface CalendarItem {
    integration: {
      type: string;
      email?: string;
      credentialId?: string | number;
    };
    credentialId?: number;
    primary?: {
      externalId?: string;
      name?: string;
      primary?: boolean;
    };
    calendars: Array<{
      id?: string | number;
      name?: string;
      primary?: boolean;
      externalId?: string;
      integration?: string;
      isSelected?: boolean;
    }>;
  }
  
  const processedCalendars = [];
  
  for (const calendar of connectedCalendars as CalendarItem[]) {
    // Extract integration info
    const integrationInfo = {
      type: calendar.integration.type,
      email: calendar.integration.email || null,
      credentialId: calendar.credentialId || calendar.integration.credentialId || null
    }
    
    // Add each calendar with its integration info
    for (const cal of calendar.calendars || []) {
      processedCalendars.push({
        id: cal.id,
        name: cal.name,
        primary: cal.primary || false,
        externalId: cal.externalId || null,
        integration: integrationInfo.type,
        email: integrationInfo.email,
        credentialId: integrationInfo.credentialId,
        isSelected: cal.isSelected || false
      });
    }
  }
  
  return processedCalendars;
} 