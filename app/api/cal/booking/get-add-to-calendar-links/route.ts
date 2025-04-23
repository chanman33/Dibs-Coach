import { NextResponse } from 'next/server';
import { createAuthClient } from '@/utils/auth';
import { auth } from '@clerk/nextjs/server';
import { ensureValidCalToken } from '@/utils/actions/cal/cal-tokens';

interface CalendarLink {
  label: string;
  link: string;
}

interface BookingMetadata {
  coachUlid?: string;
  calEventTypeId?: number;
  notes?: string;
  customInputs?: Record<string, any>;
  [key: string]: any;
}

/**
 * API endpoint to get 'Add to Calendar' links for a booking
 * 
 * This endpoint:
 * 1. Authenticates the user
 * 2. Verifies the booking exists and belongs to the user
 * 3. Gets the Cal.com token
 * 4. Calls the Cal.com API to get calendar links
 * 
 * @param request The request object
 * @param param1 The booking UID from the path
 * @returns A response with calendar links
 */
export async function GET(
  request: Request,
  { params }: { params: { bookingUid: string } }
) {
  try {
    console.log('[GET_CALENDAR_LINKS] Getting calendar links for booking', {
      bookingUid: params.bookingUid
    });
    
    // Get the booking UID from the URL params
    const bookingUid = params.bookingUid;
    if (!bookingUid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Booking UID is required' 
      }, { status: 400 });
    }
    
    // Authenticate the user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not authenticated' 
      }, { status: 401 });
    }
    
    // Get the booking from the database
    const supabase = createAuthClient();
    const { data: booking, error: bookingError } = await supabase
      .from('CalBooking')
      .select('calBookingUid, userUlid, metadata')
      .eq('calBookingUid', bookingUid)
      .single();
      
    if (bookingError || !booking) {
      console.error('[GET_CALENDAR_LINKS_ERROR] Booking not found', {
        bookingUid,
        error: bookingError
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Booking not found' 
      }, { status: 404 });
    }
    
    // Parse the metadata field
    const metadata = booking.metadata as BookingMetadata || {};
    
    // Verify the user is authorized to access this booking
    const isAttendee = booking.userUlid === userId;
    const isCoach = metadata.coachUlid === userId;
    
    if (!isAttendee && !isCoach) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized to access this booking' 
      }, { status: 403 });
    }
    
    // Get the coach's ID to get their Cal.com token
    const coachUlid = metadata.coachUlid || '';
    if (!coachUlid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Coach information not found for this booking' 
      }, { status: 500 });
    }
    
    // Ensure valid Cal.com token
    const tokenResult = await ensureValidCalToken(coachUlid);
    if (!tokenResult.success || !tokenResult.accessToken) {
      console.error('[GET_CALENDAR_LINKS_ERROR] Failed to get valid Cal.com token', {
        error: tokenResult.error,
        coachUlid
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to authenticate with Cal.com' 
      }, { status: 500 });
    }
    
    const accessToken = tokenResult.accessToken;
    
    // Get calendar links from Cal.com API
    const calResponse = await fetch(`https://api.cal.com/v2/bookings/${bookingUid}/calendar-links`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'cal-api-version': '2024-08-13'
      }
    });
    
    if (!calResponse.ok) {
      const errorText = await calResponse.text();
      console.error('[GET_CALENDAR_LINKS_ERROR] Cal.com API error', {
        status: calResponse.status,
        error: errorText
      });
      return NextResponse.json({ 
        success: false, 
        error: `Failed to get calendar links from Cal.com: ${calResponse.status}`,
        details: errorText
      }, { status: calResponse.status });
    }
    
    const calData = await calResponse.json();
    
    // Return successful response with calendar links
    return NextResponse.json({ 
      success: true, 
      data: {
        calendarLinks: calData.data || []
      }
    });
  } catch (error) {
    console.error('[GET_CALENDAR_LINKS_ERROR] Unexpected error', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get calendar links' 
    }, { status: 500 });
  }
}
