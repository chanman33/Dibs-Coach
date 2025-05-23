import { NextResponse } from 'next/server';
import { createAuthClient } from '@/utils/auth';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { ensureValidCalToken } from '@/utils/actions/cal/cal-tokens';
import { generateUlid } from '@/utils/ulid';

export const dynamic = 'force-dynamic';

// Schema for validating request body
const CreateBookingSchema = z.object({
  eventTypeId: z.string(),
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
    
    // First, get the user's ULID from the User table using the Clerk ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single();
    
    if (userError || !userData) {
      console.error('[CREATE_BOOKING_ERROR] Failed to find user', {
        clerkUserId: userId,
        error: userError
      });
      return NextResponse.json({ 
        success: false, 
        error: 'User not found in database' 
      }, { status: 404 });
    }
    
    // Now we have the proper ULID for the user
    const userUlid = userData.ulid;
    
    // Log user information for debugging
    console.log('[CREATE_BOOKING] User info', {
      clerkUserId: userId,
      userUlid,
      userUlidLength: userUlid.length
    });
    
    // Fetch the event type - could be identified by either ulid (string) or calEventTypeId (number)
    let eventTypeQuery = supabase.from('CalEventType').select('ulid, calEventTypeId, calendarIntegrationUlid');
    
    // Check if the eventTypeId is a numeric string (likely a Cal.com event type ID)
    if (/^\d+$/.test(bookingData.eventTypeId)) {
      // If numeric, try to find by calEventTypeId
      eventTypeQuery = eventTypeQuery.eq('calEventTypeId', parseInt(bookingData.eventTypeId));
    } else {
      // Otherwise, try to find by ulid
      eventTypeQuery = eventTypeQuery.eq('ulid', bookingData.eventTypeId);
    }
    
    const { data: eventType, error: eventTypeError } = await eventTypeQuery.single();
      
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
    
    // Log the event type details for debugging
    console.log('[CREATE_BOOKING] Found event type', {
      eventTypeUlid: eventType.ulid,
      eventTypeUlidLength: eventType.ulid ? eventType.ulid.length : 0,
      calEventTypeId: eventType.calEventTypeId,
      calendarIntegrationUlid: eventType.calendarIntegrationUlid
    });
    
    // Use calEventTypeId for the Cal.com API request
    const calEventTypeId = eventType.calEventTypeId;
    
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
    if (!tokenResult.success || !tokenResult.accessToken) {
      console.error('[CREATE_BOOKING_ERROR] Failed to get valid Cal.com token', {
        error: tokenResult.error,
        coachUlid
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to authenticate with Cal.com' 
      }, { status: 500 });
    }
    
    const accessToken = tokenResult.accessToken;
    
    // Build redirect URLs
    const bookingSuccessUrl = `${process.env.FRONTEND_URL || 'https://dibs.vercel.app'}/booking/booking-success`;
    const bookingRescheduledUrl = `${process.env.FRONTEND_URL || 'https://dibs.vercel.app'}/booking/booking-rescheduled`;
    const bookingCancelledUrl = `${process.env.FRONTEND_URL || 'https://dibs.vercel.app'}/booking/booking-cancelled`;
    
    // Format the request based on the new Cal.com API format
    const calRequestBody = {
      start: bookingData.startTime,
      attendee: {
        name: bookingData.attendeeName,
        email: bookingData.attendeeEmail,
        timeZone: bookingData.timeZone,
        language: 'en'
      },
      eventTypeId: calEventTypeId,
      location: 'link', // Default to link for online meetings
      bookingFieldsResponses: {
        'session-topic': bookingData.notes || bookingData.customInputs?.['session-topic'] || ''
      },
      // Metadata for our system
      metadata: {
        userUlid: userId,
        coachUlid: coachUlid
      }
    };
    
    // Create the booking through Cal.com API with the exact headers specified
    const calResponse = await fetch('https://api.cal.com/v2/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'cal-api-version': '2024-08-13'
      },
      body: JSON.stringify(calRequestBody)
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
      bookingUid: calData.data?.uid
    });
    
    if (!calData.data?.uid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cal.com API response missing booking UID' 
      }, { status: 500 });
    }
    
    // Store the booking in our database
    const bookingUlid = generateUlid();
    const sessionUlid = generateUlid();
    const now = new Date().toISOString();
    
    // Get the booking details from Cal.com response
    const calBooking = calData.data;
    
    // Log the generated ULIDs for debugging
    console.log('[CREATE_BOOKING] Generated ULIDs for database insertion', {
      bookingUlid,
      bookingUlidLength: bookingUlid.length,
      sessionUlid,
      sessionUlidLength: sessionUlid.length,
      calBookingUid: calBooking.uid,
      calBookingUidLength: calBooking.uid.length
    });
    
    let dbOperationsSuccessful = true; // Track DB operation success

    // First, create the CalBooking record
    try {
      // Verify fields match expected formats before insertion
      const bookingInsertData = {
        ulid: bookingUlid,
        userUlid: userUlid,
        coachUserUlid: coachUlid,
        calBookingUid: calBooking.uid,
        title: calBooking.title || 'Coaching Session',
        description: bookingData.notes || calBooking.description || 'N/A',
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        attendeeEmail: calBooking.attendees && calBooking.attendees.length > 0 ? calBooking.attendees[0].email : bookingData.attendeeEmail,
        attendeeName: calBooking.attendees && calBooking.attendees.length > 0 ? calBooking.attendees[0].name : bookingData.attendeeName,
        status: (calBooking.status?.toUpperCase() === 'ACCEPTED' ? 'CONFIRMED' : calBooking.status?.toUpperCase()) || 'CONFIRMED',
        duration: calBooking.duration,
        eventTypeId: calBooking.eventTypeId,
        eventTypeSlug: calBooking.eventTypeSlug,
        meetingUrl: calBooking.meetingUrl,
        location: calBooking.location,
        icsUid: calBooking.icsUid,
        calHostId: calBooking.organizer?.id,
        hostName: calBooking.organizer?.name,
        hostEmail: calBooking.organizer?.email,
        hostUsername: calBooking.organizer?.username,
        hosts: calBooking.hosts ? JSON.stringify(calBooking.hosts) : null,
        metadata: {
          ...(calBooking.metadata || {}),
          dibsUserUlid: userUlid,
          dibsSessionTopic: bookingData.notes
        },
        createdAt: now,
        updatedAt: now,
      };
      
      // Log the exact data being inserted
      console.log('[CREATE_BOOKING] CalBooking insert data', {
        ...bookingInsertData,
        metadata: JSON.stringify(bookingInsertData.metadata)
      });
      
      const { error: createBookingError } = await supabase
        .from('CalBooking')
        .insert(bookingInsertData);
        
      if (createBookingError) {
        dbOperationsSuccessful = false; // Mark DB operation as failed
        console.error('[CREATE_BOOKING_ERROR] Failed to store booking in database', {
          error: createBookingError,
          bookingUid: calBooking.uid
        });
        // Continue even if DB storage fails - the webhook will attempt to create it later
      } else {
        console.log('[CREATE_BOOKING] Successfully created CalBooking record', { bookingUlid });
      }
    } catch (error) {
      dbOperationsSuccessful = false; // Mark DB operation as failed
      console.error('[CREATE_BOOKING_ERROR] Exception during CalBooking insert', {
        error,
        bookingUlid,
        calBookingUid: calBooking.uid
      });
      // Continue even if DB storage fails
    }
    
    // Now create the Session record, only if CalBooking insert was successful (or if we decide to proceed anyway)
    // For now, let's assume we attempt Session creation even if CalBooking failed, to report all issues.
    // A stricter approach would be to only proceed if dbOperationsSuccessful is still true.
    try {
      const sessionInsertData = {
        ulid: sessionUlid,
        menteeUlid: userUlid,
        coachUlid: coachUlid,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        status: 'SCHEDULED' as const, // Use literal type to match enum
        sessionType: 'MANAGED' as const, // Use literal type to match enum
        calBookingUlid: bookingUlid,
        calEventTypeUlid: eventType.ulid && eventType.ulid.length <= 26 ? eventType.ulid : null,
        createdAt: now,
        updatedAt: now
      };
      
      // Log the exact data being inserted
      console.log('[CREATE_BOOKING] Session insert data', sessionInsertData);
      
      const { error: createSessionError } = await supabase
        .from('Session')
        .insert(sessionInsertData);
      
      if (createSessionError) {
        dbOperationsSuccessful = false; // Mark DB operation as failed
        console.error('[CREATE_BOOKING_ERROR] Failed to create session record', {
          error: createSessionError,
          bookingUid: calBooking.uid,
          calBookingUlid: bookingUlid
        });
        // Continue anyway - we'll handle this in webhook or background job
      } else {
        console.log('[CREATE_BOOKING] Successfully created Session record', { sessionUlid });
      }
    } catch (error) {
      dbOperationsSuccessful = false; // Mark DB operation as failed
      console.error('[CREATE_BOOKING_ERROR] Exception during Session insert', {
        error,
        sessionUlid,
        bookingUlid
      });
      // Continue anyway - we'll handle this in webhook or background job
    }

    // If DB operations failed, return an error even if Cal.com booking succeeded
    if (!dbOperationsSuccessful) {
      return NextResponse.json({
        success: false,
        error: 'Booking created on Cal.com, but failed to sync to our system. Please contact support.',
        details: { calBookingUid: calBooking.uid }
      }, { status: 500 });
    }
    
    // Get 'Add to Calendar' links for the booking
    const calendarLinksResponse = await fetch(`https://api.cal.com/v2/bookings/${calBooking.uid}/calendar-links`, {
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
        bookingUid: calBooking.uid
      });
    }
    
    // Return successful response with booking details
    return NextResponse.json({ 
      success: true, 
      data: {
        booking: {
          id: bookingUlid,
          calBookingUid: calBooking.uid,
          title: calBooking.title,
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
