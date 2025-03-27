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
      console.error('[API_ERROR]', {
        context: 'CAL_CANCEL_BOOKING_USER',
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
        context: 'CAL_CANCEL_BOOKING_INTEGRATION',
        error: integrationError || 'Integration not found',
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: 'Cal.com integration not found' }, { status: 404 });
    }

    // Get booking details from request
    const { bookingUid, reason } = await request.json();
    
    if (!bookingUid) {
      return NextResponse.json({ error: 'Booking UID is required' }, { status: 400 });
    }

    console.log('[API_INFO]', {
      context: 'CAL_CANCEL_BOOKING',
      bookingUid,
      reason: reason || 'No reason provided',
      timestamp: new Date().toISOString()
    });

    // Cancel the booking in Cal.com using the API
    const response = await fetch(`https://api.cal.com/v2/bookings/${bookingUid}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${integration.calAccessToken}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13'
      },
      body: JSON.stringify({
        cancellationReason: reason || 'Cancelled via testing interface'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[API_ERROR]', {
        context: 'CAL_CANCEL_BOOKING_API',
        status: response.status,
        error: errorData,
        bookingUid,
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ 
        error: 'Failed to cancel booking in Cal.com',
        details: errorData
      }, { status: response.status });
    }

    const cancelData = await response.json();
    
    // Update the booking in our database
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('CalBooking')
      .update({
        status: 'CANCELLED',
        cancellationReason: reason || 'Cancelled via testing interface',
        updatedAt: now
      })
      .eq('calBookingUid', bookingUid);
    
    if (updateError) {
      console.error('[API_WARNING]', {
        context: 'CAL_CANCEL_BOOKING_DB_UPDATE',
        error: updateError,
        bookingUid,
        timestamp: now
      });
      // We continue because the booking was cancelled in Cal.com successfully
    }
    
    console.log('[API_SUCCESS]', {
      context: 'CAL_CANCEL_BOOKING',
      bookingUid,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: cancelData
    });

  } catch (error) {
    console.error('[API_ERROR]', {
      context: 'CAL_CANCEL_BOOKING_GENERAL',
      error,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 