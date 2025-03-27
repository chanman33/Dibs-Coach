import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createAuthClient } from '@/utils/auth';
import { env } from '@/lib/env';

/**
 * API endpoint to fetch bookings from Cal.com API
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      console.error('[API_ERROR]', {
        context: 'CAL_FETCH_BOOKINGS_AUTH',
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Get the user's ULID from Supabase
    const supabase = createAuthClient();
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single();

    if (userError || !user?.ulid) {
      console.error('[API_ERROR]', {
        context: 'CAL_FETCH_BOOKINGS_USER',
        error: userError || 'User not found',
        userId,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ 
        success: false,
        error: 'User not found' 
      }, { status: 500 });
    }

    // Get user's Cal.com integration details
    const { data: integration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('*')
      .eq('userUlid', user.ulid)
      .eq('provider', 'CAL')
      .single();

    if (integrationError) {
      console.error('[API_ERROR]', {
        context: 'CAL_FETCH_BOOKINGS_INTEGRATION',
        error: integrationError,
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch Cal.com integration',
        bookings: []
      }, { status: 500 });
    }

    // Check if integration exists
    if (!integration) {
      console.log('[API_WARNING]', {
        context: 'CAL_FETCH_BOOKINGS_NO_INTEGRATION',
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        success: false,
        error: 'Cal.com integration not found',
        bookings: []
      }, { status: 404 });
    }

    // Check if managed user ID exists
    if (!integration.calManagedUserId) {
      console.log('[API_WARNING]', {
        context: 'CAL_FETCH_BOOKINGS_NO_MANAGED_USER',
        userUlid: user.ulid,
        integration: { ulid: integration.ulid },
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        success: false,
        error: 'Cal.com managed user ID not found',
        bookings: []
      }, { status: 400 });
    }

    // Check if access token exists
    if (!integration.calAccessToken) {
      console.log('[API_WARNING]', {
        context: 'CAL_FETCH_BOOKINGS_NO_TOKEN',
        userUlid: user.ulid,
        integration: { ulid: integration.ulid },
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        success: false,
        error: 'Cal.com access token not found',
        bookings: []
      }, { status: 400 });
    }

    // Fetch bookings from Cal.com API
    try {
      console.log('[API_INFO]', {
        context: 'CAL_FETCH_BOOKINGS_REQUESTING',
        userUlid: user.ulid,
        calManagedUserId: integration.calManagedUserId,
        timestamp: new Date().toISOString()
      });

      // Using the Cal.com API v2 to fetch bookings
      const calResponse = await fetch('https://api.cal.com/v2/bookings', {
        headers: {
          'Authorization': `Bearer ${integration.calAccessToken}`,
          'cal-api-version': '2024-08-13'
        }
      });

      if (!calResponse.ok) {
        // Check specifically for token expiration (status 498 or 401)
        if (calResponse.status === 498 || calResponse.status === 401) {
          return NextResponse.json({
            success: false,
            error: 'TOKEN_EXPIRED',
            message: 'Cal.com access token has expired',
            bookings: []
          }, { status: 498 });
        }

        console.error('[API_ERROR]', {
          context: 'CAL_FETCH_BOOKINGS_API_ERROR',
          status: calResponse.status,
          statusText: calResponse.statusText,
          userUlid: user.ulid,
          timestamp: new Date().toISOString()
        });

        // Try to parse the error for more details
        let errorMessage = `Cal.com API returned status ${calResponse.status}`;
        try {
          const errorData = await calResponse.json();
          if (errorData?.error?.message) {
            errorMessage = `${errorMessage}: ${errorData.error.message}`;
          }
        } catch (jsonError) {
          // If we can't parse JSON, just use the status text
          console.error('[API_ERROR]', {
            context: 'CAL_FETCH_BOOKINGS_PARSE_ERROR',
            error: jsonError,
            timestamp: new Date().toISOString()
          });
        }

        return NextResponse.json({
          success: false,
          error: errorMessage,
          bookings: []
        }, { status: 502 });
      }

      // Parse the bookings data
      const bookingsData = await calResponse.json();
      
      // Extract the bookings from the response
      const bookings = bookingsData.bookings || [];

      console.log('[API_SUCCESS]', {
        context: 'CAL_FETCH_BOOKINGS',
        userUlid: user.ulid,
        bookingsCount: bookings.length,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        bookings
      });

    } catch (apiError) {
      console.error('[API_ERROR]', {
        context: 'CAL_FETCH_BOOKINGS_REQUEST',
        error: apiError,
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: false,
        error: 'Failed to connect to Cal.com API',
        bookings: []
      }, { status: 502 });
    }

  } catch (error) {
    console.error('[API_ERROR]', {
      context: 'CAL_FETCH_BOOKINGS_GENERAL',
      error,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      bookings: []
    }, { status: 500 });
  }
} 