import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createAuthClient } from '@/utils/auth';
import { env } from '@/lib/env';

export async function POST(request: Request) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body for managed user ID
    const { managedUserId } = await request.json();
    
    if (!managedUserId) {
      return NextResponse.json({ error: 'Managed user ID is required' }, { status: 400 });
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
        context: 'USER_BOOKINGS_USER',
        error: userError || 'User not found',
        userId,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's Cal.com integration details
    const { data: integration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('*')
      .eq('userUlid', user.ulid)
      .eq('provider', 'CAL')
      .single();

    if (integrationError || !integration) {
      console.error('[API_ERROR]', {
        context: 'USER_BOOKINGS_INTEGRATION',
        error: integrationError || 'Integration not found',
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: 'Cal.com integration not found' }, { status: 404 });
    }

    // For bookings, we need to use the managed user's access token
    // First check if this managed user is the one associated with the user's integration
    if (integration.calManagedUserId !== managedUserId.toString()) {
      return NextResponse.json({ 
        error: 'Unauthorized to access this managed user\'s bookings',
        details: 'The requested managed user is not associated with your integration'
      }, { status: 403 });
    }
    
    // If we have the user's access token, use it to fetch their bookings
    if (!integration.calAccessToken) {
      return NextResponse.json({ 
        error: 'No access token available for this managed user'
      }, { status: 401 });
    }
    
    // Fetch bookings from Cal.com using the managed user's access token
    const response = await fetch('https://api.cal.com/v2/bookings', {
      headers: {
        'Authorization': `Bearer ${integration.calAccessToken}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13'
      }
    });
    
    if (!response.ok) {
      // Handle token expiration
      if (response.status === 401) {
        console.log('[USER_BOOKINGS] Token may have expired, attempting to refresh...');
        
        // Try to refresh the token
        try {
          const refreshResponse = await fetch('/api/cal/refresh-token', {
            method: 'POST',
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            
            if (refreshData.success) {
              console.log('[USER_BOOKINGS] Token refreshed successfully, retrying...');
              
              // Get the updated integration with new token
              const { data: updatedIntegration } = await supabase
                .from('CalendarIntegration')
                .select('calAccessToken')
                .eq('userUlid', user.ulid)
                .single();
                
              if (updatedIntegration?.calAccessToken) {
                // Retry the request with the new token
                const retryResponse = await fetch('https://api.cal.com/v2/bookings', {
                  headers: {
                    'Authorization': `Bearer ${updatedIntegration.calAccessToken}`,
                    'Content-Type': 'application/json',
                    'cal-api-version': '2024-08-13'
                  }
                });
                
                if (retryResponse.ok) {
                  const retryData = await retryResponse.json();
                  return NextResponse.json({
                    success: true,
                    data: retryData.data || [],
                    tokenRefreshed: true
                  });
                } else {
                  console.error('[API_ERROR]', {
                    context: 'USER_BOOKINGS_RETRY_FAILED',
                    status: retryResponse.status,
                    timestamp: new Date().toISOString()
                  });
                }
              }
            }
          }
        } catch (refreshError) {
          console.error('[API_ERROR]', {
            context: 'USER_BOOKINGS_REFRESH_TOKEN',
            error: refreshError,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[API_ERROR]', {
        context: 'USER_BOOKINGS_API',
        status: response.status,
        error: errorData,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({ 
        error: 'Failed to fetch bookings from Cal.com',
        details: errorData
      }, { status: response.status });
    }
    
    const data = await response.json();
    
    console.log('[API_SUCCESS]', {
      context: 'USER_BOOKINGS',
      bookingsCount: data.data?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      data: data.data || []
    });

  } catch (error) {
    console.error('[API_ERROR]', {
      context: 'USER_BOOKINGS_GENERAL',
      error,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 