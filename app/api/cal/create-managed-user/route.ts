import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { auth } from '@clerk/nextjs';
import { createAuthClient } from '@/utils/auth';
import { calService } from '@/lib/cal/cal-service';

export async function POST(request: Request) {
  try {
    // Get the user from Clerk
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data from request body
    const { email, name, timeZone } = await request.json();

    console.log('[CAL_CREATE_MANAGED_USER]', {
      clientId: env.NEXT_PUBLIC_CAL_CLIENT_ID,
      email,
      name,
      timeZone,
      timestamp: new Date().toISOString()
    });

    // Get user ULID from database
    const supabase = createAuthClient();
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single();

    if (userError) {
      console.error('[CAL_CREATE_MANAGED_USER_ERROR] User not found', {
        userId,
        error: userError,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Create managed user in Cal.com
    const response = await fetch(
      `https://api.cal.com/v2/oauth-clients/${env.NEXT_PUBLIC_CAL_CLIENT_ID}/users`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cal-secret-key': env.CAL_CLIENT_SECRET || '',
        },
        body: JSON.stringify({
          email,
          name,
          timeZone: timeZone || 'America/New_York',
          timeFormat: 12,
          weekStart: 'Sunday',
          locale: 'en'
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[CAL_CREATE_MANAGED_USER_ERROR]', {
        status: response.status,
        error,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'Failed to create Cal.com managed user' },
        { status: response.status }
      );
    }

    const calResponse = await response.json();
    
    // Save the integration to the database
    const integrationData = await calService.saveCalendarIntegration(userData.ulid, calResponse);
    
    console.log('[CAL_CREATE_MANAGED_USER_SUCCESS]', {
      userId: calResponse.data.user.id,
      email: calResponse.data.user.email,
      integrationUlid: integrationData.ulid,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: {
        user: calResponse.data.user,
        integration: integrationData
      }
    });
  } catch (error) {
    console.error('[CAL_CREATE_MANAGED_USER_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { error: 'Failed to create managed user' },
      { status: 500 }
    );
  }
} 