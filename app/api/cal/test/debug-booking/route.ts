import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createAuthClient } from '@/utils/auth';

export async function POST(request: Request) {
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
      return NextResponse.json({ error: 'Cal.com integration not found' }, { status: 404 });
    }

    // Get debug request details
    const { eventTypeId } = await request.json();

    // Prepare a basic booking request using Cal.com API format
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 3); // 3 hours from now
    
    const payload = {
      start: startTime.toISOString(),
      eventTypeId,
      attendee: {
        name: 'Debug Attendee',
        email: 'debug-attendee@example.com',
        timeZone: integration.timeZone || 'America/New_York',
        language: 'en'
      },
      metadata: {
        source: 'dibs_platform_debug'
      },
      bookingFieldsResponses: {}
    };

    // Make the API call
    const response = await fetch(`https://api.cal.com/v2/bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.calAccessToken}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    // Return the full request/response data for analysis
    return NextResponse.json({
      success: response.ok,
      request: {
        url: 'https://api.cal.com/v2/bookings',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cal-api-version': '2024-08-13',
          // Redact sensitive parts of token
          'Authorization': integration.calAccessToken ? 
            `Bearer ${integration.calAccessToken.substring(0, 5)}...${integration.calAccessToken.substring(integration.calAccessToken.length - 5)}` : 
            'undefined'
        },
        body: payload
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      },
      integration: {
        calManagedUserId: integration.calManagedUserId,
        calUsername: integration.calUsername,
        timeZone: integration.timeZone,
        tokenExpiry: integration.calAccessTokenExpiresAt
      }
    });

  } catch (error) {
    console.error('[API_ERROR]', {
      context: 'CAL_DEBUG_BOOKING',
      error,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ 
      error: 'Error debugging booking',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 