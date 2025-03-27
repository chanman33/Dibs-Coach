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
        context: 'USER_EVENT_TYPES_USER',
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
        context: 'USER_EVENT_TYPES_INTEGRATION',
        error: integrationError || 'Integration not found',
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: 'Cal.com integration not found' }, { status: 404 });
    }

    // There are two ways to fetch event types for a managed user:
    // 1. Using the OAuth client credentials to access the platform API
    // 2. Using the managed user's access token to access the user's resources

    // Let's implement both approaches and use the most appropriate one

    // Approach 1: Using platform API with OAuth client credentials
    const platformUrl = `https://api.cal.com/v2/oauth-clients/${env.NEXT_PUBLIC_CAL_CLIENT_ID}/users/${managedUserId}`;
    console.log('[API_INFO]', {
      context: 'USER_EVENT_TYPES_PLATFORM',
      url: platformUrl,
      managedUserId,
      timestamp: new Date().toISOString()
    });

    const platformResponse = await fetch(platformUrl, {
      headers: {
        'x-cal-client-id': env.NEXT_PUBLIC_CAL_CLIENT_ID || '',
        'x-cal-secret-key': env.CAL_CLIENT_SECRET || '',
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13'
      }
    });

    if (!platformResponse.ok) {
      console.error('[API_ERROR]', {
        context: 'USER_EVENT_TYPES_PLATFORM_FAILED',
        status: platformResponse.status,
        managedUserId,
        timestamp: new Date().toISOString()
      });
      
      // If platform API fails, let's try approach 2
      console.log('[API_INFO]', {
        context: 'USER_EVENT_TYPES_TRYING_USER_TOKEN',
        managedUserId,
        timestamp: new Date().toISOString()
      });
      
      // Approach 2: Using managed user's access token
      // First check if this managed user is the one associated with the user's integration
      if (integration.calManagedUserId !== managedUserId.toString()) {
        return NextResponse.json({ 
          error: 'Unauthorized to access this managed user\'s event types',
          details: 'The requested managed user is not associated with your integration'
        }, { status: 403 });
      }
      
      // If we have the user's access token, use it to fetch their event types
      if (!integration.calAccessToken) {
        return NextResponse.json({ 
          error: 'No access token available for this managed user'
        }, { status: 401 });
      }
      
      const userTokenUrl = 'https://api.cal.com/v2/event-types';
      const userTokenResponse = await fetch(userTokenUrl, {
        headers: {
          'Authorization': `Bearer ${integration.calAccessToken}`,
          'Content-Type': 'application/json',
          'cal-api-version': '2024-08-13'
        }
      });
      
      if (!userTokenResponse.ok) {
        const errorData = await userTokenResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[API_ERROR]', {
          context: 'USER_EVENT_TYPES_USER_TOKEN',
          status: userTokenResponse.status,
          error: errorData,
          timestamp: new Date().toISOString()
        });
        
        return NextResponse.json({ 
          error: 'Failed to fetch event types using managed user token',
          details: errorData
        }, { status: userTokenResponse.status });
      }
      
      const userTokenData = await userTokenResponse.json();
      return NextResponse.json({
        success: true,
        data: userTokenData.data || [],
        method: 'user_token'
      });
    }

    // If platform API succeeded, return the user data which includes event types
    const platformData = await platformResponse.json();
    
    // Now fetch the event types for this user
    const eventTypesUrl = `https://api.cal.com/v2/event-types?username=${platformData.data?.username}`;
    const eventTypesResponse = await fetch(eventTypesUrl, {
      headers: {
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13'
      }
    });
    
    if (!eventTypesResponse.ok) {
      console.error('[API_ERROR]', {
        context: 'USER_EVENT_TYPES_PUBLIC_API',
        status: eventTypesResponse.status,
        username: platformData.data?.username,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: true,
        data: [],
        user: platformData.data,
        method: 'platform_api',
        note: 'Could not fetch event types for this user'
      });
    }
    
    const eventTypesData = await eventTypesResponse.json();
    
    console.log('[API_SUCCESS]', {
      context: 'USER_EVENT_TYPES',
      userInfo: {
        id: platformData.data?.id,
        email: platformData.data?.email,
        username: platformData.data?.username
      },
      eventTypesCount: eventTypesData.data?.length || 0,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: eventTypesData.data || [],
      user: platformData.data,
      method: 'platform_api'
    });

  } catch (error) {
    console.error('[API_ERROR]', {
      context: 'USER_EVENT_TYPES_GENERAL',
      error,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 