import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { auth } from '@clerk/nextjs'
import { refreshUserCalTokens } from '@/utils/actions/cal-tokens'

// Define a simple interface just for what we need
interface CalendarIntegration {
  calAccessToken: string;
  calUserId?: number; // This doesn't exist in our schema
  calManagedUserId: number; // This is the correct field
  calAccessTokenExpiresAt?: string | null; // Ensure this is included
}

export async function GET(request: Request) {
  try {
    // Authenticate the user
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract calendar type from query parameters
    const url = new URL(request.url)
    const searchParams = url.searchParams
    const calendarType = searchParams.get('type') || 'google' 
    
    // Get the current host for the callback URL
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`
    
    // --- Define the FINAL redirect URL (UI page) --- 
    // This is where Cal.com will send the user AFTER successfully processing Google OAuth
    const finalUiCallbackPath = '/dashboard/integrations/google-calendar-callback';
    const finalUiCallbackUrl = new URL(finalUiCallbackPath, baseUrl).toString();
    
    // Get the Supabase client from auth utilities
    const supabase = createAuthClient()
    
    // Get the user's ULID from the User table
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()
    
    if (userError || !userData) {
      console.error('[CAL_OAUTH_URL_ERROR]', { 
        error: userError || 'User not found', 
        userId,
        timestamp: new Date().toISOString() 
      });
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Get the user's Cal.com information from our database
    const { data: calData, error: calError } = await supabase
      .from('CalendarIntegration')
      .select('calAccessToken, calManagedUserId, calAccessTokenExpiresAt') // Ensure expiresAt is selected
      .eq('userUlid', userData.ulid)
      .single<CalendarIntegration>() // Use the defined interface
    
    if (calError || !calData?.calAccessToken) {
      console.error('[CAL_OAUTH_URL_ERROR]', { 
        error: calError || 'No Cal access token found',
        userUlid: userData.ulid,
        timestamp: new Date().toISOString() 
      });
      // Allow proceeding even without a token if the integration record exists,
      // as the user might be trying to connect for the first time.
      // BUT, we need the managedUserId.
      if (!calData?.calManagedUserId) {
         return NextResponse.json({ error: 'Cal.com integration incomplete (missing managed user ID)' }, { status: 404 })
      }
      // If token is missing but record exists, proceed but log it.
      console.warn('[CAL_OAUTH_URL_WARN] Cal access token missing, proceeding with connect flow.');
      // Set a placeholder or handle null token downstream if needed.
      calData.calAccessToken = '' // Or handle null appropriately
    }
    
    // Check if the token might be expired and refresh if needed (only if token exists)
    let calAccessToken = calData.calAccessToken || ''; // Use fetched token or empty string
    let tokenRefreshed = false;
    
    if (calAccessToken) { // Only check/refresh if a token actually exists
        const tokenExpiresAt = new Date(calData.calAccessTokenExpiresAt || '');
        const now = new Date();
        const tokenExpired = !isNaN(tokenExpiresAt.getTime()) && tokenExpiresAt <= now;
        
        const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        const tokenExpiringImminent = !isNaN(tokenExpiresAt.getTime()) && 
                                    (tokenExpiresAt.getTime() - now.getTime() < bufferTime);
        
        if (tokenExpired || tokenExpiringImminent) {
          console.log('[CAL_OAUTH_URL_DEBUG] Token needs refresh:', {
            expired: tokenExpired,
            expiringImminent: tokenExpiringImminent,
            expiresAt: calData.calAccessTokenExpiresAt,
            timestamp: new Date().toISOString()
          });
          
          try {
            const refreshResult = await refreshUserCalTokens(userData.ulid, true); // Assume managed user
            
            if (!refreshResult.success) {
              console.error('[CAL_OAUTH_URL_ERROR]', {
                context: 'TOKEN_REFRESH',
                error: refreshResult.error,
                userUlid: userData.ulid,
                timestamp: new Date().toISOString()
              });
              // Don't fail the whole request, try connecting with the old token maybe?
              // Or return error asking user to refresh manually?
              // For now, return error:
              return NextResponse.json({ 
                error: 'Failed to refresh Cal.com token. Please refresh your integration on the settings page first.'
              }, { status: 403 });
            }
            
            const { data: refreshedData, error: refreshError } = await supabase
              .from('CalendarIntegration')
              .select('calAccessToken')
              .eq('userUlid', userData.ulid)
              .single<{ calAccessToken: string }>();
            
            if (refreshError || !refreshedData?.calAccessToken) {
              console.error('[CAL_OAUTH_URL_ERROR]', {
                context: 'FETCH_REFRESHED_TOKEN',
                error: refreshError || 'No refreshed token found',
                userUlid: userData.ulid,
                timestamp: new Date().toISOString()
              });
              // Continue with potentially expired token or return error?
              return NextResponse.json({
                error: 'Failed to get refreshed token after refresh. Please try again.'
              }, { status: 500 });
            }
            
            calAccessToken = refreshedData.calAccessToken;
            tokenRefreshed = true;
            console.log('[CAL_OAUTH_URL_DEBUG] Token refreshed successfully');
          } catch (refreshError) {
            console.error('[CAL_OAUTH_URL_ERROR] Unhandled exception during token refresh:', {
              error: refreshError,
              userUlid: userData.ulid,
              timestamp: new Date().toISOString()
            });
            return NextResponse.json({ 
              error: 'An error occurred refreshing your Cal.com token. Please try again later.'
            }, { status: 500 });
          }
        }
    }
    
    // --- Construct Cal.com API URL --- 
    // Only include the `redir` parameter pointing to our final UI callback page.
    // Cal.com handles the state internally for its /save endpoint.
    const endpointParams = new URLSearchParams({
      redir: finalUiCallbackUrl
    });
    const endpoint = `https://api.cal.com/v2/calendars/${calendarType}/connect?${endpointParams.toString()}`;

    console.log('[CAL_OAUTH_URL_DEBUG] Calling Cal.com API:', {
      endpoint: endpoint,
      finalUiCallbackUrl: finalUiCallbackUrl,
      tokenRefreshed,
      timestamp: new Date().toISOString()
    });
    
    // Call the Cal.com API to get the Google authorization URL
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // IMPORTANT: Use the potentially refreshed access token
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
      } catch {
        errorDetail = await response.text();
        console.error('[CAL_OAUTH_URL_ERROR] Cal.com API Error (non-JSON):', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorDetail,
          endpointCalled: endpoint,
          timestamp: new Date().toISOString()
        });
      }
      return NextResponse.json({
        error: errorDetail ? `${errorMessage}: ${errorDetail}` : errorMessage
      }, { status: response.status === 401 ? 401 : 500 });
    }
    
    // Parse the response from Cal.com
    const responseData = await response.json();
    const authUrl = responseData.data?.authUrl; // This is the URL for the user's browser

    if (!authUrl) {
      console.error('[CAL_OAUTH_URL_ERROR] No authUrl in response from Cal.com:', responseData);
      return NextResponse.json({ error: 'Invalid response from Cal.com: Missing authUrl' }, { status: 500 });
    }

    console.log('[CAL_OAUTH_URL_DEBUG] Received Google authUrl from Cal.com:', authUrl);

    // Send the Google Auth URL back to the frontend
    const transformedResponse = {
      success: true,
      data: {
        authUrl: authUrl, // The URL the frontend should redirect the user to
        provider: calendarType,
      }
    };

    return NextResponse.json(transformedResponse);
  } catch (error) {
    console.error('[CAL_OAUTH_URL_ERROR] Unhandled exception in GET handler:', { 
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}
