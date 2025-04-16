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
    
    // Use the validated token and the managed user ID
    const validatedToken = tokenResult.tokenInfo.accessToken;
    const calManagedUserId = tokenResult.tokenInfo.managedUserId; // Use the correct field name

    if (!calManagedUserId) {
      console.error('[CAL_GET_BUSY_TIMES_ERROR] Missing Cal.com managedUserId from token info', {
        coachUlid,
        tokenInfoKeys: Object.keys(tokenResult.tokenInfo),
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Internal configuration error: Cal.com managed user ID not found' 
      }, { status: 500 });
    }

    // Construct the query string for Cal.com API
    const dateFrom = searchParams.get('dateFrom') || new Date().toISOString();
    const dateTo = searchParams.get('dateTo') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default 30 days
    
    const queryParams = new URLSearchParams();
    queryParams.append('dateFrom', dateFrom);
    queryParams.append('dateTo', dateTo);
    queryParams.append('loggedInUsersTz', loggedInUsersTz);
    queryParams.append('calendarsToLoad[0][credentialId]', credentialId);
    queryParams.append('calendarsToLoad[0][externalId]', externalId);
    queryParams.append('userId', calManagedUserId.toString()); // <-- Add the Cal.com managedUserId as 'userId' param
    
    console.log('[CAL_GET_BUSY_TIMES] Date range and user for query', {
      dateFrom,
      dateTo,
      timezone: loggedInUsersTz,
      calManagedUserId, // Log the managedUserId being sent
      credentialId,
      externalId
    });
    
    const apiUrl = `https://api.cal.com/v2/calendars/busy-times?${queryParams.toString()}`;
    const fetchOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validatedToken}`
      }
    };
    
    console.log('[CAL_GET_BUSY_TIMES] Making API request:', {
      apiUrl,
      headers: fetchOptions.headers, // Log the headers being sent
      timestamp: new Date().toISOString()
    });
    
    // Function to make the Cal.com API request with correct path
    // const apiUrl = `https://api.cal.com/v2/calendars/busy-times?${queryParams.toString()}`;
    // console.log('[CAL_GET_BUSY_TIMES] Cal.com API request URL', { apiUrl });
    
    const makeCalRequest = (token: string) => fetch(apiUrl, {
      // method: 'GET',
      // headers: {
      //   'Content-Type': 'application/json',
      //   'Authorization': `Bearer ${token}`
      // }
      ...fetchOptions,
      headers: {
        ...fetchOptions.headers,
        'Authorization': `Bearer ${token}` // Ensure token is updated on retry
      }
    });
    
    // Make the initial request with our validated token
    // console.log('[CAL_GET_BUSY_TIMES] Making API request with validated token and managedUserId');
    let response = await makeCalRequest(validatedToken);
    
    // Handle token expiration and retry if needed
    response = await handleCalApiResponse(response, makeCalRequest, coachUlid);
    
    console.log('[CAL_GET_BUSY_TIMES] API response status', {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()) // Log response headers
    });
    
    // Check if the response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CAL_GET_BUSY_TIMES_ERROR] Non-OK response', {
        status: response.status,
        error: errorText.substring(0, 1000), // Log more of the error text
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({ 
        success: false, 
        error: `Failed to get busy times: ${response.status}` 
      }, { status: response.status });
    }

    // Check Content-Type before parsing JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('[CAL_GET_BUSY_TIMES_ERROR] Unexpected Content-Type', {
        contentType: contentType,
        body: responseText.substring(0, 1000), // Log more of the body
        status: response.status, // Log status code here too
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Received non-JSON response from Cal.com API' 
      }, { status: 502 }); // Bad Gateway, as we received an invalid response from upstream
    }
    
    // Parse and return the response data
    let busyTimesData;
    try {
      busyTimesData = await response.json();
    } catch (parseError: any) {
      console.error('[CAL_GET_BUSY_TIMES_ERROR] Failed to parse JSON response', {
        error: parseError.message,
        status: response.status,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to parse response from Cal.com API' 
      }, { status: 500 });
    }
    
    // Check the response structure from Cal.com
    if (busyTimesData?.status !== 'success' || !Array.isArray(busyTimesData?.data)) {
      console.warn('[CAL_GET_BUSY_TIMES_WARN] Cal.com API returned success=false or invalid data structure', {
        responseData: busyTimesData,
        timestamp: new Date().toISOString()
      });
      // We might still want to return an empty array if the status isn't 'success' but the call was otherwise OK
      // Depending on Cal.com's specific behavior for errors vs. no busy times.
      // For now, let's treat it as an error if status is not "success".
      return NextResponse.json({ 
        success: false, 
        error: 'Received unexpected data structure from Cal.com API' 
      }, { status: 500 });
    }
    
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
    console.error('[CAL_GET_BUSY_TIMES_ERROR] Uncaught error in handler', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      status: "error", 
      error: 'Failed to get busy times' 
    }, { status: 500 });
  }
}
