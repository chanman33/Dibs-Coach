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
    console.log('[CAL_GET_CALENDARS] Starting fetch of user calendars');
    
    // Get the user's ID from auth
    const session = auth()
    const userId = session?.userId
    
    if (!userId) {
      console.error('[CAL_GET_CALENDARS_ERROR] Authentication required');
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

    // First, get the CalendarIntegration record to check if calendar is connected
    const { data: calIntegration, error: calIntegrationError } = await supabase
      .from('CalendarIntegration')
      .select('googleCalendarConnected, office365CalendarConnected')
      .eq('userUlid', userData.ulid)
      .single();
      
    if (calIntegrationError) {
      console.error('[CAL_GET_CALENDARS_ERROR]', {
        error: calIntegrationError,
        userUlid: userData.ulid,
        stage: 'checking calendar flags',
        timestamp: new Date().toISOString()
      });
    }
    
    const hasGoogleCalendar = calIntegration?.googleCalendarConnected || false;
    const hasOffice365Calendar = calIntegration?.office365CalendarConnected || false;
    
    console.log('[CAL_GET_CALENDARS] Calendar integration flags:', {
      userUlid: userData.ulid,
      googleCalendarConnected: hasGoogleCalendar,
      office365CalendarConnected: hasOffice365Calendar,
      timestamp: new Date().toISOString()
    });
    
    // Use the standard token refresh flow - only refresh if token is expired or expiring soon
    // This lets ensureValidCalToken check expiration status and determine if refresh is needed
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
          hasConnectedCalendars: hasGoogleCalendar || hasOffice365Calendar, 
          calendars: [],
          tokenError: true  
        } 
      });
    }
    
    const accessToken = tokenResult.tokenInfo.accessToken;
    console.log('[CAL_GET_CALENDARS] Retrieved access token, fetching calendars from Cal.com');

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
    
    // Simplified: Always pass the response through handleCalApiResponse
    // It will handle 401/498 by attempting refresh and retry, or return the original response otherwise.
    response = await handleCalApiResponse(
      response,
      makeCalRequest, // The function to retry the request
      userData.ulid
    );

    if (!response.ok) {
      // Log the final response status and error after potential retry
      console.error('[CAL_GET_CALENDARS_ERROR]', {
        status: response.status,
        error: await response.text(),
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({ 
        success: true, 
        data: { 
          // Return true if we know a calendar is connected based on DB flags
          hasConnectedCalendars: hasGoogleCalendar || hasOffice365Calendar,
          calendars: [],
          apiError: true
        } 
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