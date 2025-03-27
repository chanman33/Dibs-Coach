import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createAuthClient } from '@/utils/auth';
import { env } from '@/lib/env';

export async function GET() {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        context: 'MANAGED_USERS_FETCH_USER',
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
        context: 'MANAGED_USERS_FETCH_INTEGRATION',
        error: integrationError || 'Integration not found',
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: 'Cal.com integration not found' }, { status: 404 });
    }

    // Fetch managed users from Cal.com using OAuth client credentials
    const url = `https://api.cal.com/v2/oauth-clients/${env.NEXT_PUBLIC_CAL_CLIENT_ID}/users`;
    console.log('[API_INFO]', {
      context: 'MANAGED_USERS_FETCH_REQUEST',
      url,
      clientId: env.NEXT_PUBLIC_CAL_CLIENT_ID,
      timestamp: new Date().toISOString()
    });

    const response = await fetch(url, {
      headers: {
        'x-cal-client-id': env.NEXT_PUBLIC_CAL_CLIENT_ID || '',
        'x-cal-secret-key': env.CAL_CLIENT_SECRET || '',
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[API_ERROR]', {
        context: 'MANAGED_USERS_FETCH_API',
        status: response.status,
        error: errorData,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ 
        error: 'Failed to fetch managed users from Cal.com',
        details: errorData
      }, { status: response.status });
    }

    const data = await response.json();
    
    console.log('[API_SUCCESS]', {
      context: 'MANAGED_USERS_FETCH',
      userCount: data.data?.length || 0,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: data.data || []
    });

  } catch (error) {
    console.error('[API_ERROR]', {
      context: 'MANAGED_USERS_FETCH_GENERAL',
      error,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 