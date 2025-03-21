import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/utils/auth';
import { auth } from '@clerk/nextjs/server';
import { calService } from '@/lib/cal/cal-service';
import { env } from '@/lib/env';

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    // Authenticate the request
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = params;
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Get the cancellation reason from the request body
    const body = await request.json();
    const { reason } = body || {};

    // Initialize Supabase client
    const supabase = createAuthClient();
    
    // Get the current user's ULID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single();
    
    if (userError) {
      console.error('[CANCEL_BOOKING_ERROR] Failed to get user ULID:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userUlid = userData.ulid;
    
    // Get the booking from the database
    const { data: booking, error: bookingError } = await supabase
      .from('CalBooking')
      .select('*, CalendarIntegration!inner(calAccessToken, calManagedUserId)')
      .eq('calBookingUid', bookingId)
      .single();
    
    if (bookingError) {
      console.error('[CANCEL_BOOKING_ERROR] Failed to find booking:', bookingError);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    // Check if the user has permission to cancel this booking
    if (booking.userUlid !== userUlid) {
      // Check if the user is the attendee (can also cancel if they're the attendee)
      const userEmail = await getUserEmail(userId, supabase);
      const isAttendee = booking.attendeeEmail === userEmail;
      
      if (!isAttendee) {
        return NextResponse.json({ error: 'You do not have permission to cancel this booking' }, { status: 403 });
      }
    }
    
    // Check if the booking is already cancelled
    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ message: 'Booking is already cancelled' });
    }
    
    // Get a fresh access token if needed
    const accessToken = await calService.checkAndRefreshToken(booking.userUlid);
    
    // Call the Cal.com API to cancel the booking
    const cancelResult = await cancelCalBooking(bookingId, accessToken, reason);
    if (!cancelResult.success) {
      return NextResponse.json({ error: cancelResult.error }, { status: 500 });
    }
    
    // Update the booking in our database
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('CalBooking')
      .update({
        status: 'CANCELLED',
        cancellationReason: reason || 'Cancelled by user',
        updatedAt: now
      })
      .eq('calBookingUid', bookingId);
    
    if (updateError) {
      console.error('[CANCEL_BOOKING_ERROR] Failed to update booking in database:', updateError);
      // We continue because the booking is already cancelled in Cal.com
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CANCEL_BOOKING_ERROR]', error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }
}

/**
 * Get the user's email from the database
 */
async function getUserEmail(userId: string, supabase: ReturnType<typeof createAuthClient>): Promise<string> {
  const { data, error } = await supabase
    .from('User')
    .select('email')
    .eq('userId', userId)
    .single();
  
  if (error) {
    console.error('[GET_USER_EMAIL_ERROR]', error);
    return '';
  }
  
  return data.email;
}

/**
 * Cancel a booking in Cal.com
 */
async function cancelCalBooking(
  bookingUid: string,
  accessToken: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://api.cal.com/v2/bookings/${bookingUid}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        cancellationReason: reason || 'Cancelled by user'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[CANCEL_CAL_BOOKING_ERROR]', errorData);
      return {
        success: false,
        error: `Failed to cancel booking in Cal.com: ${JSON.stringify(errorData)}`
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('[CANCEL_CAL_BOOKING_ERROR] Exception:', error);
    return {
      success: false,
      error: 'An error occurred while cancelling the booking in Cal.com'
    };
  }
} 