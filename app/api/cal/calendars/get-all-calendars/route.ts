import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { getAuthenticatedUserUlid } from '@/utils/auth'
import { CalTokenService } from '@/lib/cal/cal-service'

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
    
    // Authenticate using centralized helper
    const authResult = await getAuthenticatedUserUlid();
    if (authResult.error || !authResult.data) {
      console.error('[CAL_GET_CALENDARS_ERROR] Authentication failed:', authResult.error);
      return NextResponse.json({ 
        success: false, 
        error: authResult.error?.message || 'Authentication failed' 
      }, { status: authResult.error?.code === 'UNAUTHORIZED' ? 401 : 500 });
    }

    const userUlid = authResult.data.userUlid;
    
    // Initialize Supabase client
    const supabase = createAuthClient();

    // First, get the CalendarIntegration record to check if calendar is connected
    const { data: calIntegration, error: calIntegrationError } = await supabase
      .from('CalendarIntegration')
      .select('googleCalendarConnected, office365CalendarConnected')
      .eq('userUlid', userUlid)
      .single();
      
    if (calIntegrationError) {
      console.error('[CAL_GET_CALENDARS_ERROR]', {
        error: calIntegrationError,
        userUlid,
        stage: 'checking calendar flags',
        timestamp: new Date().toISOString()
      });
    }
    
    const hasGoogleCalendar = calIntegration?.googleCalendarConnected || false;
    const hasOffice365Calendar = calIntegration?.office365CalendarConnected || false;
    
    console.log('[CAL_GET_CALENDARS] Calendar integration flags:', {
      userUlid,
      googleCalendarConnected: hasGoogleCalendar,
      office365CalendarConnected: hasOffice365Calendar,
      timestamp: new Date().toISOString()
    });
    
    // Use CalTokenService to get a valid token
    const tokenResult = await CalTokenService.ensureValidToken(userUlid);
    
    if (!tokenResult.success) {
      console.error('[CAL_GET_CALENDARS_ERROR]', {
        error: tokenResult.error || 'No valid token available',
        userUlid,
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
    
    const accessToken = tokenResult.accessToken;
    console.log('[CAL_GET_CALENDARS] Retrieved access token, fetching calendars from Cal.com');

    // Call Cal.com API to get calendar credentials
    // Important: Only use the managed user access token in the Authorization header
    // Do NOT include x-cal-client-id or x-cal-secret-key when using Bearer token
    const response = await fetch('https://api.cal.com/v2/calendars', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      cache: 'no-store' // Disable caching for this request
    });

    if (!response.ok) {
      // Handle error response
      console.error('[CAL_GET_CALENDARS_ERROR]', {
        status: response.status,
        error: await response.text(),
        timestamp: new Date().toISOString()
      });
      
      // If we get a token error, try refreshing and retry
      if (response.status === 401 || response.status === 498) {
        try {
          // Try to parse the error response to check for specific error codes
          const errorData = await response.json().catch(() => ({}));
          
          // Log the detailed error
          console.error('[CAL_GET_CALENDARS_ERROR]', {
            status: response.status,
            error: JSON.stringify(errorData),
            timestamp: new Date().toISOString()
          });
          
          // Check for token expiration error codes from Cal.com
          const isTokenExpired = errorData?.error?.code === 'TokenExpiredException' || 
                              errorData?.error?.message === 'ACCESS_TOKEN_IS_EXPIRED';
          
          console.log('[CAL_GET_CALENDARS] Token appears invalid, trying to force-refresh', {
            isTokenExpired,
            forceRefresh: true,
            errorDetails: errorData?.error
          });
          
          // Force refresh tokens using the token service - with forceRefresh=true
          const tokenRefreshResult = await CalTokenService.refreshTokens(userUlid, true);
          
          if (!tokenRefreshResult.success) {
            console.error('[CAL_GET_CALENDARS_ERROR] Failed to refresh token:', tokenRefreshResult.error);
            return NextResponse.json({ 
              success: true, 
              data: { 
                hasConnectedCalendars: hasGoogleCalendar || hasOffice365Calendar,
                calendars: [],
                apiError: true,
                tokenRefreshFailed: true
              } 
            });
          }
          
          // Get a new valid token after refresh
          const newTokenResult = await CalTokenService.ensureValidToken(userUlid);
          if (!newTokenResult.success) {
            console.error('[CAL_GET_CALENDARS_ERROR] Failed to get token after refresh:', newTokenResult.error);
            return NextResponse.json({
              success: true,
              data: {
                hasConnectedCalendars: hasGoogleCalendar || hasOffice365Calendar,
                calendars: [],
                apiError: true,
                tokenRefreshFailed: true
              }
            });
          }
          
          // Retry with new token
          const retryResponse = await fetch('https://api.cal.com/v2/calendars', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newTokenResult.accessToken}`
            },
            cache: 'no-store'
          });
          
          if (!retryResponse.ok) {
            console.error('[CAL_GET_CALENDARS_ERROR] Retry after token refresh failed:', {
              status: retryResponse.status,
              error: await retryResponse.text()
            });
            return NextResponse.json({ 
              success: true, 
              data: { 
                hasConnectedCalendars: hasGoogleCalendar || hasOffice365Calendar,
                calendars: [],
                apiError: true,
                retryFailed: true
              } 
            });
          }
          
          // Continue with the retried response
          const calendarData = await retryResponse.json();
          const connectedCalendars = calendarData?.data?.connectedCalendars || [];
          const hasConnectedCalendars = connectedCalendars.length > 0;
          const processedCalendars = processCalendars(connectedCalendars);
          
          console.log('[CAL_GET_CALENDARS] Retry successful', {
            calendarCount: processedCalendars.length,
            hasConnectedCalendars
          });
          
          return NextResponse.json({ 
            success: true, 
            data: { 
              hasConnectedCalendars,
              calendars: processedCalendars,
              tokenRefreshed: true
            } 
          });
        } catch (error) {
          console.error('[CAL_GET_CALENDARS_ERROR] Error parsing error response:', error);
          return NextResponse.json({ 
            success: true, 
            data: { 
              hasConnectedCalendars: hasGoogleCalendar || hasOffice365Calendar,
              calendars: [],
              apiError: true,
              retryFailed: true
            } 
          });
        }
      }
      
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
    const responseData = await response.json();
    
    // Check for connectedCalendars in the response data structure
    // According to docs: data.connectedCalendars[] is the array we want
    const connectedCalendars = responseData?.data?.connectedCalendars || [];
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
      slug?: string;
      email?: string;
      credentialId?: string | number;
      name?: string;
      title?: string;
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
    // Extract integration info - preserve type and slug which are critical for UI identification
    const integrationInfo = {
      type: calendar.integration.type,
      slug: calendar.integration.slug || null,
      email: calendar.integration.email || null,
      credentialId: calendar.credentialId || calendar.integration.credentialId || null,
      name: calendar.integration.name || calendar.integration.title || null
    }
    
    // Log the integration info for debugging
    console.log('[CAL_PROCESS_CALENDARS] Processing calendar integration:', {
      type: integrationInfo.type,
      slug: integrationInfo.slug,
      name: integrationInfo.name
    });
    
    // Add each calendar with its integration info
    for (const cal of calendar.calendars || []) {
      processedCalendars.push({
        id: cal.id,
        name: cal.name,
        primary: cal.primary || false,
        externalId: cal.externalId || null,
        // Store full integration object structure needed by UI
        integration: {
          type: integrationInfo.type,
          slug: integrationInfo.slug,
          name: integrationInfo.name
        },
        email: integrationInfo.email,
        credentialId: integrationInfo.credentialId,
        isSelected: cal.isSelected || false
      });
    }
  }
  
  // Log the first processed calendar for debugging
  if (processedCalendars.length > 0) {
    console.log('[CAL_PROCESS_CALENDARS] First processed calendar:', {
      name: processedCalendars[0].name,
      integrationType: processedCalendars[0].integration?.type,
      integrationSlug: processedCalendars[0].integration?.slug
    });
  }
  
  return processedCalendars;
} 