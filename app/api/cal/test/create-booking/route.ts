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

    // Get the user's ULID from Supabase
    const supabase = createAuthClient();
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single();

    if (userError || !user?.ulid) {
      console.error('[API_ERROR]', {
        context: 'CAL_CREATE_BOOKING_USER',
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
        context: 'CAL_CREATE_BOOKING_INTEGRATION',
        error: integrationError || 'Integration not found',
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: 'Cal.com integration not found' }, { status: 404 });
    }

    // Get booking details from request
    const { eventTypeId, startTime, endTime, attendeeEmail, attendeeName } = await request.json();

    // Create the booking in Cal.com using the managed user's credentials
    const response = await fetch(`https://api.cal.com/v2/bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.calAccessToken}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-01-01'
      },
      body: JSON.stringify({
        eventTypeId,
        start: startTime,
        attendee: {
          name: attendeeName,
          email: attendeeEmail,
          timeZone: integration.timeZone || 'America/New_York',
          language: 'en'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[API_ERROR]', {
        context: 'CAL_CREATE_BOOKING_API',
        status: response.status,
        error: errorData,
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ 
        error: 'Failed to create booking in Cal.com',
        details: errorData
      }, { status: response.status });
    }

    const bookingData = await response.json();
    
    console.log('[API_SUCCESS]', {
      context: 'CAL_CREATE_BOOKING',
      userUlid: user.ulid,
      bookingId: bookingData.uid,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      booking: bookingData
    });

  } catch (error) {
    console.error('[API_ERROR]', {
      context: 'CAL_CREATE_BOOKING_GENERAL',
      error,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 