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

    // Format start time to ensure it's in the correct format (ISO string in UTC)
    const formattedStartTime = new Date(startTime).toISOString();

    // First, get all event types to verify this one exists
    try {
      const eventTypesResponse = await fetch(`https://api.cal.com/v2/event-types`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${integration.calAccessToken}`,
          'Content-Type': 'application/json',
          'cal-api-version': '2024-01-01'
        }
      });

      if (!eventTypesResponse.ok) {
        const eventTypesError = await eventTypesResponse.json();
        console.error('[API_ERROR]', {
          context: 'CAL_EVENT_TYPES_FETCH',
          status: eventTypesResponse.status,
          error: eventTypesError,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json({ 
          error: 'Failed to fetch event types',
          details: eventTypesError
        }, { status: eventTypesResponse.status });
      }

      const eventTypesData = await eventTypesResponse.json();
      // Get event types from the data structure
      const eventTypeGroups = eventTypesData.data?.eventTypeGroups || [];
      const allEventTypes = eventTypeGroups.reduce((acc: any[], group: any) => {
        if (group.eventTypes && Array.isArray(group.eventTypes)) {
          return [...acc, ...group.eventTypes];
        }
        return acc;
      }, []);

      // Find the specific event type
      const selectedEventType = allEventTypes.find((et: any) => et.id === parseInt(eventTypeId));
      if (!selectedEventType) {
        return NextResponse.json({ 
          error: 'Event type not found',
          details: `Event type ${eventTypeId} does not exist or you don't have access to it`
        }, { status: 404 });
      }

      console.log('[EVENT_TYPE_FOUND]', {
        id: selectedEventType.id,
        title: selectedEventType.title,
        length: selectedEventType.length,
        timestamp: new Date().toISOString()
      });

      // Check availability first
      const availabilityResponse = await fetch(
        `https://api.cal.com/v2/event-types/${eventTypeId}/availability?dateFrom=${encodeURIComponent(formattedStartTime)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${integration.calAccessToken}`,
            'Content-Type': 'application/json',
            'cal-api-version': '2024-01-01'
          }
        }
      );

      if (!availabilityResponse.ok) {
        const availabilityError = await availabilityResponse.json();
        console.error('[API_ERROR]', {
          context: 'CAL_AVAILABILITY_CHECK',
          status: availabilityResponse.status,
          error: availabilityError,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json({ 
          error: 'Failed to check availability',
          details: availabilityError
        }, { status: availabilityResponse.status });
      }

      const availabilityData = await availabilityResponse.json();
      console.log('[AVAILABILITY_DATA]', {
        data: availabilityData,
        requestedTime: formattedStartTime,
        timestamp: new Date().toISOString()
      });

      // Calculate end time based on event length
      const endTime = new Date(new Date(formattedStartTime).getTime() + selectedEventType.length * 60000).toISOString();

      // Create the booking with all required fields
      const bookingPayload = {
        start: formattedStartTime,
        end: endTime,
        eventTypeId: parseInt(eventTypeId),
        title: `${selectedEventType.title} with ${attendeeName}`,
        responses: {
          name: attendeeName,
          email: attendeeEmail,
          location: {
            value: 'inPerson',
            optionValue: ''
          }
        },
        timeZone: integration.timeZone || 'America/New_York',
        language: 'en',
        metadata: {
          source: 'dibs_platform'
        },
        bookingFieldsResponses: {}
      };

      console.log('[BOOKING_PAYLOAD]', {
        payload: bookingPayload,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(`https://api.cal.com/v2/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.calAccessToken}`,
          'Content-Type': 'application/json',
          'cal-api-version': '2024-01-01'
        },
        body: JSON.stringify(bookingPayload)
      });

      // Log the full response for debugging
      console.log('[CAL_API_RESPONSE]', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[API_ERROR]', {
          context: 'CAL_CREATE_BOOKING_API',
          status: response.status,
          error: errorData,
          payload: bookingPayload,
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
        bookingData,
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

  } catch (error) {
    console.error('[API_ERROR]', {
      context: 'CAL_CREATE_BOOKING_GENERAL',
      error,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 