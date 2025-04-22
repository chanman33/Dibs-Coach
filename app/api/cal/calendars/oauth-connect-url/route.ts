import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { getAuthenticatedCalUser } from '@/utils/auth'
import { CalTokenService } from '@/lib/cal/cal-service'

// Define a simple interface just for what we need
interface CalendarIntegration {
  calAccessToken: string;
  calManagedUserId: number;
  calAccessTokenExpiresAt?: string | null;
}

export async function GET(request: Request) {
  try {
    // Extract calendar type from query parameters
    const url = new URL(request.url)
    const searchParams = url.searchParams
    const calendarType = searchParams.get('type') || 'google' 
    
    // Get the current host for the callback URL
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`
    
    // --- Define the FINAL redirect URL (UI page) based on calendar type --- 
    // This is where Cal.com will send the user AFTER successfully processing OAuth
    const finalUiCallbackPath = calendarType === 'office365' 
      ? '/dashboard/integrations/office365-calendar-callback'
      : '/dashboard/integrations/google-calendar-callback';
    
    const finalUiCallbackUrl = new URL(finalUiCallbackPath, baseUrl).toString();
    
    // Authenticate and get Cal integration data using centralized helper
    const authResult = await getAuthenticatedCalUser({ calManagedUserId: true });
    if (authResult.error || !authResult.data) {
      console.error('[CAL_OAUTH_URL_ERROR] Authentication failed:', authResult.error);
      return NextResponse.json(
        { error: authResult.error?.message || 'Authentication failed' },
        { status: authResult.error?.code === 'UNAUTHORIZED' ? 401 : 500 }
      );
    }
    
    const { userUlid, calManagedUserId } = authResult.data;
    
    if (!calManagedUserId) {
      console.error('[CAL_OAUTH_URL_ERROR] Missing Cal.com managed user ID', { userUlid });
      return NextResponse.json(
        { error: 'Cal.com integration not complete. Missing managed user ID.' },
        { status: 400 }
      );
    }
    
    // Get valid Cal.com access token
    const tokenResult = await CalTokenService.ensureValidToken(userUlid);
    if (!tokenResult.success) {
      console.error('[CAL_OAUTH_URL_ERROR] Failed to get valid token:', tokenResult.error);
      return NextResponse.json(
        { error: 'Failed to get valid Cal.com token. Please reconnect in settings.' },
        { status: 401 }
      );
    }
    
    const calAccessToken = tokenResult.accessToken;
    
    // --- Construct Cal.com API URL --- 
    // Only include the `redir` parameter pointing to our final UI callback page.
    // Cal.com handles the state internally for its /save endpoint.
    const endpointParams = new URLSearchParams({
      redir: finalUiCallbackUrl
    });
    const endpoint = `https://api.cal.com/v2/calendars/${calendarType}/connect?${endpointParams.toString()}`;

    console.log('[CAL_OAUTH_URL_DEBUG] Calling Cal.com API:', {
      endpoint: endpoint,
      calendarType,
      finalUiCallbackUrl: finalUiCallbackUrl,
      timestamp: new Date().toISOString()
    });
    
    // Call the Cal.com API to get the authorization URL
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${calAccessToken}`,
        'x-cal-client-id': process.env.NEXT_PUBLIC_CAL_CLIENT_ID || '',
        'x-cal-secret-key': process.env.CAL_CLIENT_SECRET || ''
      },
      cache: 'no-store' // Disable caching
    });
    
    // Handle API response
    if (!response.ok) {
      let errorMessage = `Failed to get OAuth URL (${response.status})`;
      let errorDetail = '';
      try {
        const errorResponse = await response.json();
        errorDetail = errorResponse.error || errorResponse.message || JSON.stringify(errorResponse);
        console.error('[CAL_OAUTH_URL_ERROR] Cal.com API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorResponse,
          endpointCalled: endpoint,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        // If we can't parse JSON, use the response text
        errorDetail = await response.text();
        console.error('[CAL_OAUTH_URL_ERROR] Cal.com API Response (non-JSON):', {
          status: response.status,
          statusText: response.statusText,
          error: errorDetail,
          endpointCalled: endpoint,
          timestamp: new Date().toISOString()
        });
      }
      
      // Check if this is a token issue and try refreshing
      if (response.status === 401 || response.status === 498) {
        console.log('[CAL_OAUTH_URL_DEBUG] Token appears invalid, attempting force refresh');
        
        // Force refresh token
        const refreshResult = await CalTokenService.refreshTokens(userUlid, true);
        if (!refreshResult.success) {
          console.error('[CAL_OAUTH_URL_ERROR] Token refresh failed:', refreshResult.error);
          return NextResponse.json({ 
            error: 'Your Cal.com token could not be refreshed. Please reconnect in settings.' 
          }, { status: 401 });
        }
        
        // Get new access token
        const newTokenResult = await CalTokenService.ensureValidToken(userUlid);
        if (!newTokenResult.success) {
          console.error('[CAL_OAUTH_URL_ERROR] Failed to get token after refresh:', newTokenResult.error);
          return NextResponse.json({ 
            error: 'Failed to get new token after refresh. Please try again.' 
          }, { status: 500 });
        }
        
        // Retry with new token
        const retryResponse = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newTokenResult.accessToken}`,
            'x-cal-client-id': process.env.NEXT_PUBLIC_CAL_CLIENT_ID || '',
            'x-cal-secret-key': process.env.CAL_CLIENT_SECRET || ''
          },
          cache: 'no-store'
        });
        
        if (!retryResponse.ok) {
          console.error('[CAL_OAUTH_URL_ERROR] Retry with refreshed token failed:', {
            status: retryResponse.status,
            error: await retryResponse.text(),
            timestamp: new Date().toISOString()
          });
          
          return NextResponse.json({ 
            error: 'Failed to get authorization URL even after token refresh. Please try again later.' 
          }, { status: 500 });
        }
        
        // Use the retry response for the rest of the function
        const retryData = await retryResponse.json();
        console.log('[CAL_OAUTH_URL_DEBUG] Token refresh and retry successful');
        
        // Check the structure
        if (!retryData?.data?.authUrl) {
          console.error('[CAL_OAUTH_URL_ERROR] Missing authUrl in response after retry:', retryData);
          return NextResponse.json({ 
            error: 'Invalid response from Cal.com API (missing authUrl)' 
          }, { status: 500 });
        }
        
        // Return the authorization URL
        return NextResponse.json({ url: retryData.data.authUrl });
      }
      
      // For non-token errors or if refresh wasn't attempted
      return NextResponse.json({ 
        error: errorMessage,
        details: errorDetail
      }, { status: response.status === 404 ? 404 : 500 });
    }
    
    // Process successful response
    const data = await response.json();
    
    // Validate the response
    if (!data?.data?.authUrl) {
      console.error('[CAL_OAUTH_URL_ERROR] Missing authUrl in response:', data);
      return NextResponse.json({ 
        error: 'Invalid response from Cal.com API (missing authUrl)' 
      }, { status: 500 });
    }
    
    // Return the authorization URL
    return NextResponse.json({ url: data.data.authUrl });
  } catch (error) {
    console.error('[CAL_OAUTH_URL_ERROR] Unhandled exception:', error);
    return NextResponse.json({ 
      error: 'An error occurred getting the Cal.com authorization URL' 
    }, { status: 500 });
  }
}
