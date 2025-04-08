import { NextResponse } from 'next/server';
import { createAuthClient } from '@/utils/auth';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { ensureValidCalToken } from '@/utils/cal/token-util';
import { generateUlid } from '@/utils/ulid';

// Schema for validating request body
const CreateBookingSchema = z.object({
  eventTypeId: z.number(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  attendeeName: z.string(),
  attendeeEmail: z.string().email(),
  notes: z.string().optional(),
  customInputs: z.record(z.string(), z.any()).optional(),
  timeZone: z.string().default('UTC')
});

/**
 * Create a booking through the Cal.com API
 * 
 * This endpoint:
 * 1. Validates the user is authenticated
 * 2. Validates the request body
 * 3. Ensures a valid Cal.com token
 * 4. Creates a booking through the Cal.com API
 * 5. Stores the booking in our database
 * 6. Returns booking details and calendar links
 */
export async function POST(request: Request) {
  try {
    console.log('[CREATE_BOOKING] Processing booking request');
    
    // Authenticate the user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not authenticated' 
      }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const validationResult = CreateBookingSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request body',
        details: validationResult.error.format()
      }, { status: 400 });
    }
    
    const bookingData = validationResult.data;
    
    // Get the coach's ID from the event type
    const supabase = createAuthClient();
    const { data: eventType, error: eventTypeError } = await supabase
      .from('CalEventType')
      .select('calendarIntegrationUlid')
      .eq('calEventTypeId', bookingData.eventTypeId)
      .single();
      
    if (eventTypeError || !eventType) {
      console.error('[CREATE_BOOKING_ERROR] Event type not found', {
        eventTypeId: bookingData.eventTypeId,
        error: eventTypeError
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Event type not found' 
      }, { status: 404 });
    }
    
    // Get the coach's Cal.com integration
    const { data: calIntegration, error: calIntegrationError } = await supabase
      .from('CalendarIntegration')
      .select('userUlid, calAccessToken')
      .eq('ulid', eventType.calendarIntegrationUlid)
      .single();
      
    if (calIntegrationError || !calIntegration) {
      console.error('[CREATE_BOOKING_ERROR] Calendar integration not found', {
        calendarIntegrationUlid: eventType.calendarIntegrationUlid,
        error: calIntegrationError
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Calendar integration not found' 
      }, { status: 404 });
    }
    
    const coachUlid = calIntegration.userUlid;
    
    // Ensure valid Cal.com token
    const tokenResult = await ensureValidCalToken(coachUlid);
    if (!tokenResult.success || !tokenResult.tokenInfo?.accessToken) {
      console.error('[CREATE_BOOKING_ERROR] Failed to get valid Cal.com token', {
        error: tokenResult.error,
        coachUlid
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to authenticate with Cal.com' 
      }, { status: 500 });
    }
    
    const accessToken = tokenResult.tokenInfo.accessToken;
    
    // Build redirect URLs
    const bookingSuccessUrl = `${process.env.NEXT_PUBLIC_APP_URL}/booking/booking-success`;
    const bookingRescheduledUrl = `${process.env.NEXT_PUBLIC_APP_URL}/booking/booking-rescheduled`;
    const bookingCancelledUrl = `${process.env.NEXT_PUBLIC_APP_URL}/booking/booking-cancelled`;
    
    // Create the booking through Cal.com API
    const calResponse = await fetch('https://api.cal.com/v2/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        eventTypeId: bookingData.eventTypeId,
        start: bookingData.startTime,
        end: bookingData.endTime,
        name: bookingData.attendeeName,
        email: bookingData.attendeeEmail,
        timeZone: bookingData.timeZone,
        language: 'en',
        notes: bookingData.notes || '',
        customInputs: bookingData.customInputs || {},
        metadata: {
          userUlid: userId,
          coachUlid: coachUlid
        },
        // Redirect URLs
        bookingRedirectUrl: bookingSuccessUrl,
        rescheduleRedirectUrl: bookingRescheduledUrl,
        cancellationRedirectUrl: bookingCancelledUrl
      })
    });
    
    if (!calResponse.ok) {
      const errorText = await calResponse.text();
      console.error('[CREATE_BOOKING_ERROR] Cal.com API error', {
        status: calResponse.status,
        error: errorText
      });
      return NextResponse.json({ 
        success: false, 
        error: `Failed to create booking in Cal.com: ${calResponse.status}`,
        details: errorText
      }, { status: calResponse.status });
    }
    
    const calData = await calResponse.json();
    console.log('[CREATE_BOOKING] Cal.com booking created successfully', {
      bookingUid: calData.booking?.uid
    });
    
    if (!calData.booking?.uid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cal.com API response missing booking UID' 
      }, { status: 500 });
    }
    
    // Store the booking in our database
    const bookingUlid = generateUlid();
    const now = new Date().toISOString();
    
    const { error: createBookingError } = await supabase
      .from('CalBooking')
      .insert({
        ulid: bookingUlid,
        userUlid: userId,
        calBookingUid: calData.booking.uid,
        title: calData.booking.title || 'Coaching Session',
        description: calData.booking.description || '',
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        attendeeEmail: bookingData.attendeeEmail,
        attendeeName: bookingData.attendeeName,
        allAttendees: bookingData.attendeeEmail, // Single attendee for now
        status: 'CONFIRMED',
        metadata: {
          calEventTypeId: bookingData.eventTypeId,
          notes: bookingData.notes,
          customInputs: bookingData.customInputs,
          coachUlid
        },
        createdAt: now,
        updatedAt: now
      });
      
    if (createBookingError) {
      console.error('[CREATE_BOOKING_ERROR] Failed to store booking in database', {
        error: createBookingError,
        bookingUid: calData.booking.uid
      });
      // Continue even if DB storage fails - the webhook will attempt to create it later
    }
    
    // Get 'Add to Calendar' links for the booking
    const calendarLinksResponse = await fetch(`https://api.cal.com/v2/bookings/${calData.booking.uid}/calendar-links`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'cal-api-version': '2024-08-13'
      }
    });
    
    let calendarLinks = [];
    if (calendarLinksResponse.ok) {
      const linksData = await calendarLinksResponse.json();
      calendarLinks = linksData.data || [];
    } else {
      console.error('[CREATE_BOOKING_WARNING] Failed to get calendar links', {
        status: calendarLinksResponse.status,
        bookingUid: calData.booking.uid
      });
    }
    
    // Return successful response with booking details
    return NextResponse.json({ 
      success: true, 
      data: {
        booking: {
          id: bookingUlid,
          calBookingUid: calData.booking.uid,
          title: calData.booking.title,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          attendeeName: bookingData.attendeeName,
          attendeeEmail: bookingData.attendeeEmail
        },
        calendarLinks
      }
    });
  } catch (error) {
    console.error('[CREATE_BOOKING_ERROR] Unexpected error', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create booking' 
    }, { status: 500 });
  }
}
