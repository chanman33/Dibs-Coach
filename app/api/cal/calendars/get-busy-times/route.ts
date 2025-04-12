import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { ensureValidCalToken, handleCalApiResponse } from '@/utils/cal/token-util'

/**
 * API endpoint to get busy times for a managed user from Cal.com
 * 
 * @param request Contains query parameters:
 * - coachUlid: The ULID of the coach whose calendar we're checking
 * - loggedInUsersTz: The user's timezone
 * - calendarsToLoad[0][credentialId]: The credential ID for the calendar
 * - calendarsToLoad[0][externalId]: The external ID for the calendar
 * @returns A NextResponse with busy times data
 */
export async function GET(request: Request) {
  try {
    console.log('[CAL_GET_BUSY_TIMES] Starting fetch of busy times');
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const coachUlid = searchParams.get('coachUlid');
    const loggedInUsersTz = searchParams.get('loggedInUsersTz');
    const credentialId = searchParams.get('calendarsToLoad[0][credentialId]');
    const externalId = searchParams.get('calendarsToLoad[0][externalId]');
    
    // Validate required parameters
    if (!coachUlid || !loggedInUsersTz || !credentialId || !externalId) {
      console.error('[CAL_GET_BUSY_TIMES_ERROR] Missing required parameters', {
        hasCoachUlid: !!coachUlid,
        hasTz: !!loggedInUsersTz,
        hasCredentialId: !!credentialId,
        hasExternalId: !!externalId
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }
    
    console.log('[CAL_GET_BUSY_TIMES] Request parameters', {
      coachUlid,
      timezone: loggedInUsersTz,
      credentialId,
      externalId
    });

    // Get a valid Cal.com token for the coach using our utility
    const tokenResult = await ensureValidCalToken(coachUlid);
    
    if (!tokenResult.success || !tokenResult.tokenInfo?.accessToken) {
      console.error('[CAL_GET_BUSY_TIMES_ERROR] Failed to get valid token', {
        coachUlid,
        error: tokenResult.error,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to get valid calendar token' 
      }, { status: 401 });
    }
    
    // Use the validated token
    const validatedToken = tokenResult.tokenInfo.accessToken;
    
    // Construct the query string for Cal.com API
    const dateFrom = searchParams.get('dateFrom') || new Date().toISOString();
    const dateTo = searchParams.get('dateTo') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default 30 days
    
    const queryParams = new URLSearchParams();
    queryParams.append('dateFrom', dateFrom);
    queryParams.append('dateTo', dateTo);
    queryParams.append('loggedInUsersTz', loggedInUsersTz);
    queryParams.append('calendarsToLoad[0][credentialId]', credentialId);
    queryParams.append('calendarsToLoad[0][externalId]', externalId);
    
    console.log('[CAL_GET_BUSY_TIMES] Date range for query', {
      dateFrom,
      dateTo,
      timezone: loggedInUsersTz
    });
    
    // Function to make the Cal.com API request with correct path
    const apiUrl = `https://api.cal.com/v2/calendars/busy-times?${queryParams.toString()}`;
    console.log('[CAL_GET_BUSY_TIMES] Cal.com API request URL', { apiUrl });
    
    const makeCalRequest = (token: string) => fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Make the initial request with our validated token
    console.log('[CAL_GET_BUSY_TIMES] Making API request with validated token');
    let response = await makeCalRequest(validatedToken);
    
    // Handle token expiration and retry if needed
    response = await handleCalApiResponse(response, makeCalRequest, coachUlid);
    
    console.log('[CAL_GET_BUSY_TIMES] API response status', {
      status: response.status,
      ok: response.ok
    });
    
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
    
    // Check the response structure
    const busyTimesCount = busyTimesData?.data?.length || 0;
    console.log('[CAL_GET_BUSY_TIMES] Successfully retrieved busy times', {
      count: busyTimesCount,
      sample: busyTimesCount > 0 ? [
        busyTimesData.data[0],
        busyTimesCount > 1 ? busyTimesData.data[1] : null
      ].filter(Boolean) : []
    });
    
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
