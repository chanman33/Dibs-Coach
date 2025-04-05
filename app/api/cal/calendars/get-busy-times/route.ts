import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { ensureValidCalToken, handleCalApiResponse } from '@/utils/cal/token-util'

/**
 * API endpoint to get busy times for a managed user from Cal.com
 * 
 * @param request Contains query parameters:
 * - loggedInUsersTz: The user's timezone
 * - calendarsToLoad[0][credentialId]: The credential ID for the calendar
 * - calendarsToLoad[0][externalId]: The external ID for the calendar
 * @returns A NextResponse with busy times data
 */
export async function GET(request: Request) {
  try {
    console.log('[CAL_GET_BUSY_TIMES] Starting fetch of busy times');
    
    // Get the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing or invalid authorization token' 
      }, { status: 401 });
    }
    
    // Extract token
    const accessToken = authHeader.substring(7);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const loggedInUsersTz = searchParams.get('loggedInUsersTz');
    const credentialId = searchParams.get('calendarsToLoad[0][credentialId]');
    const externalId = searchParams.get('calendarsToLoad[0][externalId]');
    
    // Validate required parameters
    if (!loggedInUsersTz || !credentialId || !externalId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }
    
    // Construct the query string for Cal.com API
    const queryParams = new URLSearchParams();
    queryParams.append('dateFrom', new Date().toISOString());
    queryParams.append('dateTo', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()); // 30 days range
    queryParams.append('loggedInUsersTz', loggedInUsersTz);
    queryParams.append('calendarsToLoad[0][credentialId]', credentialId);
    queryParams.append('calendarsToLoad[0][externalId]', externalId);
    
    // Function to make the Cal.com API request with correct path
    // Updated to use the correct API path: /v2/calendars/busy-times
    const makeCalRequest = (token: string) => fetch(`https://api.cal.com/v2/calendars/busy-times?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Make the initial request
    let response = await makeCalRequest(accessToken);
    
    // If the response has an authentication error (401), try to refresh the token
    if (response.status === 401) {
      console.log('[CAL_GET_BUSY_TIMES] Authentication error, attempting to extract user ULID from token');
      
      // We need to find the user associated with this token to refresh it
      const supabase = createAuthClient();
      const { data: integration, error: integrationError } = await supabase
        .from('CalendarIntegration')
        .select('userUlid')
        .eq('calAccessToken', accessToken)
        .maybeSingle();
      
      if (integrationError || !integration) {
        console.error('[CAL_GET_BUSY_TIMES_ERROR]', {
          error: integrationError || 'No matching integration found for token',
          timestamp: new Date().toISOString()
        });
        
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid token' 
        }, { status: 401 });
      }
      
      // Found the user, try to refresh their token
      const userUlid = integration.userUlid;
      console.log('[CAL_GET_BUSY_TIMES] Found user ULID for token:', userUlid);
      
      // Force refresh token
      const tokenResult = await ensureValidCalToken(userUlid, true);
      
      if (!tokenResult.success || !tokenResult.tokenInfo?.accessToken) {
        console.error('[CAL_GET_BUSY_TIMES_ERROR]', {
          error: tokenResult.error || 'Token refresh failed',
          userUlid,
          timestamp: new Date().toISOString()
        });
        
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to refresh authentication token' 
        }, { status: 401 });
      }
      
      // Retry with the new token
      console.log('[CAL_GET_BUSY_TIMES] Token refreshed successfully, retrying request');
      response = await makeCalRequest(tokenResult.tokenInfo.accessToken);
    }
    
    // Check if the response is OK
    if (!response.ok) {
      console.error('[CAL_GET_BUSY_TIMES_ERROR]', {
        status: response.status,
        error: await response.text(),
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({ 
        success: false, 
        error: `Failed to get busy times: ${response.status}` 
      }, { status: response.status });
    }
    
    // Parse and return the response data
    // Format matches the expected structure: { status: "success", data: [{ start, end, source }] }
    const busyTimesData = await response.json();
    
    return NextResponse.json({ 
      status: "success", 
      data: busyTimesData.data || []
    });
  } catch (error) {
    console.error('[CAL_GET_BUSY_TIMES_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      status: "error", 
      error: 'Failed to get busy times' 
    }, { status: 500 });
  }
}
