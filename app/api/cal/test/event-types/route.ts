import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { cookies } from 'next/headers';
import { refreshCalAccessToken, isCalTokenExpired } from '@/utils/auth/cal-token-service';
import { createAuthClient } from '@/utils/auth';
import { auth } from '@clerk/nextjs';
import { getUserById } from '@/utils/auth/user-management';
import type { Database } from '@/types/supabase';

interface CalIntegration {
  id: string;
  userUlid: string;
  calAccessToken: string;
  calRefreshToken: string;
  calAccessTokenExpiresAt: string;
  calManagedUserId: number;
}

// Track recent API calls to prevent duplicate requests in quick succession
const recentRequests = new Map<string, number>();
const REQUEST_COOLDOWN_MS = 2000; // 2 seconds between identical requests

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    
    // Debug cookie information
    const allCookies = cookieStore.getAll();
    console.log('[DEBUG_COOKIES]', {
      cookieCount: allCookies.length,
      cookieNames: allCookies.map(c => c.name),
      timestamp: new Date().toISOString()
    });

    // Get Clerk auth
    const { userId } = auth();

    if (!userId) {
      console.error('[AUTH_ERROR]', {
        error: 'No Clerk user found',
        timestamp: new Date().toISOString(),
        path: '/api/cal/test/event-types'
      });
      return NextResponse.json(
        { 
          error: 'Unauthorized - No user found',
          details: 'Please ensure you are logged in and try again.'
        },
        { status: 401 }
      );
    }

    // Get user data from the database
    const user = await getUserById(userId);
    if (!user) {
      console.error('[AUTH_ERROR]', {
        error: 'User not found in database',
        userId,
        timestamp: new Date().toISOString(),
        path: '/api/cal/test/event-types'
      });
      return NextResponse.json(
        { 
          error: 'User not found',
          details: 'Your user profile could not be found. Please ensure you have completed onboarding.'
        },
        { status: 404 }
      );
    }

    console.log('[USER_DEBUG]', {
      userFound: !!user,
      userUlid: user.userUlid,
      timestamp: new Date().toISOString()
    });

    // Initialize Supabase client
    const supabase = createAuthClient();

    // Rate limiting for this specific user/endpoint
    const requestKey = `event-types-${user.userUlid}`;
    const now = Date.now();
    const lastRequest = recentRequests.get(requestKey) || 0;
    
    if (now - lastRequest < REQUEST_COOLDOWN_MS) {
      console.log('Rate limiting event-types request for user:', user.userUlid);
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few seconds.' },
        { status: 429 }
      );
    }
    
    // Update the request timestamp
    recentRequests.set(requestKey, now);
    
    // Auto-cleanup old entries
    setTimeout(() => {
      if (recentRequests.has(requestKey)) {
        recentRequests.delete(requestKey);
      }
    }, REQUEST_COOLDOWN_MS * 2);

    // Get the user's Cal.com integration
    const { data: integration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('*')
      .eq('userUlid', user.userUlid)
      .single();

    if (integrationError) {
      console.error('[DB_ERROR]', {
        error: integrationError,
        context: 'Fetching Cal integration',
        userUlid: user.userUlid,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { 
          error: 'Failed to fetch Cal.com integration',
          details: 'Could not retrieve your Cal.com integration details.'
        },
        { status: 500 }
      );
    }

    if (!integration) {
      console.error('[API_ERROR]', {
        error: 'No Cal integration found',
        userUlid: user.userUlid,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { 
          error: 'Cal.com integration not found',
          details: 'Please connect your Cal.com account in settings.'
        },
        { status: 404 }
      );
    }

    // Check if token is expired or will expire soon
    let accessToken = integration.calAccessToken;
    const isExpired = await isCalTokenExpired(integration.calAccessTokenExpiresAt);
    
    if (isExpired) {
      console.log('Token expired or will expire soon. Refreshing before request.');
      const refreshResult = await refreshCalAccessToken(user.userUlid);
      
      if (refreshResult.success && refreshResult.tokens?.access_token) {
        accessToken = refreshResult.tokens.access_token;
      } else {
        // If refresh failed due to loop detection, return a clear message
        if (refreshResult.error?.includes('loop detected')) {
          return NextResponse.json(
            { 
              error: 'Token refresh temporarily unavailable',
              details: 'Multiple refresh attempts detected. Please wait a moment and try again.'
            },
            { status: 429 }
          );
        }
        
        return NextResponse.json(
          { error: 'Failed to refresh token: ' + (refreshResult.error || 'Unknown error') },
          { status: 403 }
        );
      }
    }

    // Log request details for debugging
    console.log('Fetching event types with:', {
      accessTokenPresent: !!accessToken,
      managedUserId: integration.calManagedUserId,
      tokenExpiry: integration.calAccessTokenExpiresAt
    });

    // Fetch event types using the standard API endpoint
    try {
      const eventTypesResponse = await fetch(
        'https://api.cal.com/v2/event-types',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'cal-api-version': '2024-01-01',
          },
          // Prevent infinite refresh attempts by avoiding auto-redirect
          redirect: 'manual',
        }
      );

      if (!eventTypesResponse.ok) {
        const errorText = await eventTypesResponse.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // If not JSON, use text as is
          errorData = { message: errorText };
        }

        console.error('Cal.com API error:', {
          status: eventTypesResponse.status,
          statusText: eventTypesResponse.statusText,
          error: errorData,
          tokenExpiry: integration.calAccessTokenExpiresAt,
          currentTime: new Date().toISOString()
        });
        
        // Handle specific error cases
        if (eventTypesResponse.status === 401) {
          // Check if token was just refreshed
          if (isExpired) {
            // Token was just refreshed but still getting 401
            return NextResponse.json(
              { 
                error: 'Authentication failed with Cal.com API after token refresh',
                details: 'Please check your Cal.com integration settings and try reconnecting your account.'
              },
              { status: 401 }
            );
          } else {
            // Token might be invalidated on Cal.com side
            return NextResponse.json(
              { 
                error: 'Authentication failed with Cal.com API',
                details: errorData.message || 'Token appears to be invalid'
              },
              { status: 401 }
            );
          }
        }
        
        return NextResponse.json(
          { 
            error: 'Cal.com API error',
            details: errorData.message || errorText
          },
          { status: eventTypesResponse.status }
        );
      }

      const eventTypesData = await eventTypesResponse.json();
      console.log('Event types response successful with data length:', 
        eventTypesData.data?.eventTypeGroups?.length || 0);

      // Return the event types data
      return NextResponse.json({
        success: true,
        eventTypes: eventTypesData.data || [],
        count: eventTypesData.data?.eventTypeGroups?.length || 0,
      });
    } catch (apiError) {
      console.error('Error communicating with Cal.com API:', apiError);
      return NextResponse.json(
        { error: 'Failed to communicate with Cal.com API' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Error in event-types route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 