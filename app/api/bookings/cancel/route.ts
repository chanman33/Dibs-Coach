import { NextResponse } from 'next/server';
import { createServerAuthClient } from '@/utils/auth/auth-client';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // Ensure this route is always dynamic

// Updated to use Bearer Token authorization
async function cancelCalBooking(bookingUid: string, coachAccessToken: string, cancellationReason?: string) {
  const calApiUrl = `https://api.cal.com/v2/bookings/${bookingUid}/cancel`;
  const response = await fetch(calApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${coachAccessToken}`, // Use Bearer token
      'cal-api-version': '2024-08-13',
    },
    body: JSON.stringify({
      cancellationReason: cancellationReason || 'User requested cancellation',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('[CAL_CANCEL_API_ERROR]', { 
      message: 'Error response from Cal.com API', 
      status: response.status, 
      errorBody: errorData 
    });
    throw new Error(errorData.message || `Failed to cancel Cal.com booking. Status: ${response.status}`);
  }
  return await response.json();
}

export async function POST(request: Request) {
  const supabase = createServerAuthClient();

  try {
    const { sessionId, calBookingUid: calBookingTableUlid, cancellationReason } = await request.json();

    if (!sessionId || !calBookingTableUlid) {
      return new NextResponse('Missing sessionId or calBookingTableUlid', { status: 400 });
    }

    // 1. Fetch current user initiating the cancellation
    const { data: { user: currentUser }, error: currentUserAuthError } = await supabase.auth.getUser();
    if (currentUserAuthError || !currentUser) {
      console.error('[AUTH_USER_FETCH_ERROR]', currentUserAuthError);
      return new NextResponse('Could not authenticate user.', { status: 401, statusText: currentUserAuthError?.message || "User authentication failed" });
    }
    const currentUserEmail = currentUser.email;
    const currentDbUserUlid = (await supabase.from('User').select('ulid').eq('userId', currentUser.id).single())?.data?.ulid;
    if (!currentDbUserUlid) {
        console.error('[DB_USER_ULID_FETCH_ERROR]', `Failed to fetch ULID for Clerk user ID: ${currentUser.id}`);
        return new NextResponse('Failed to resolve user database ID.', { status: 500 });
    }

    // 2. Fetch Session details
    const { data: sessionData, error: sessionFetchDbError } = await supabase
      .from('Session')
      .select('coachUlid, startTime, menteeUlid, status')
      .eq('ulid', sessionId)
      .single();

    if (sessionFetchDbError || !sessionData) {
      console.error('[DB_SESSION_FETCH_ERROR]', sessionFetchDbError);
      return new NextResponse('Failed to fetch session details.', { status: 404, statusText: sessionFetchDbError?.message || "Session not found" });
    }

    // 3. Authorization and Policy Checks
    if (sessionData.menteeUlid !== currentDbUserUlid){
        console.warn('[CANCEL_AUTH_WARN]', `User ${currentUserEmail} (DB ULID: ${currentDbUserUlid}) attempted to cancel session ${sessionId} not belonging to them (Mentee ULID: ${sessionData.menteeUlid}).`);
        return new NextResponse('Forbidden: You can only cancel your own sessions.', { status: 403 });
    }

    if (sessionData.status === 'CANCELLED') {
        return new NextResponse('Session is already cancelled.', { status: 400 });
    }
    if (sessionData.status !== 'SCHEDULED') {
        return new NextResponse('Only scheduled sessions can be cancelled.', { status: 400 });
    }

    const sessionStartTime = new Date(sessionData.startTime);
    const now = new Date();
    const hoursDifference = (sessionStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      return new NextResponse('Cancellation failed: Sessions cannot be cancelled within 24 hours of the start time.', { status: 403 });
    }

    // 4. Fetch Coach's Cal.com AccessToken
    const { data: calendarIntegration, error: calIntegrationDbError } = await supabase
      .from('CalendarIntegration')
      .select('calAccessToken')
      .eq('userUlid', sessionData.coachUlid)
      .single();

    if (calIntegrationDbError || !calendarIntegration || !calendarIntegration.calAccessToken) {
      console.error('[DB_CAL_INTEGRATION_FETCH_ERROR]', { error: calIntegrationDbError, coachUlid: sessionData.coachUlid });
      return new NextResponse('Failed to retrieve coach\'s Cal.com integration details or access token missing.', { status: 500 });
    }
    const coachCalAccessToken = calendarIntegration.calAccessToken;

    // NEW: Fetch the actual Cal.com booking UID from our CalBooking table
    const { data: calBookingRecord, error: fetchCalBookingRecordError } = await supabase
      .from('CalBooking')
      .select('calBookingUid') // This is the field storing the Cal.com native UID
      .eq('ulid', calBookingTableUlid) // Query by our internal primary key
      .single();

    if (fetchCalBookingRecordError || !calBookingRecord || !calBookingRecord.calBookingUid) {
      console.error('[CANCEL_API_HANDLER_ERROR] Failed to fetch Cal.com Booking UID from CalBooking table', { 
        error: fetchCalBookingRecordError, 
        calBookingTableUlid
      });
      return new NextResponse("Failed to retrieve essential booking information for cancellation with Cal.com.", { status: 500 });
    }
    const calComNativeBookingUid = calBookingRecord.calBookingUid; // This is the ID to send to Cal.com API

    // 5. Cancel with Cal.com
    // Pass the correct Cal.com native booking UID
    const calCancelResponse = await cancelCalBooking(calComNativeBookingUid, coachCalAccessToken, cancellationReason);
    console.log('[CAL_CANCEL_API_SUCCESS]', calCancelResponse);

    const updateTimestamp = new Date().toISOString();

    // 6. Update Session in DB
    const { error: sessionDbUpdateError } = await supabase
      .from('Session')
      .update({
        status: 'CANCELLED',
        updatedAt: updateTimestamp,
        cancelledAt: updateTimestamp,
        cancellationReason: cancellationReason || 'User requested cancellation',
        cancelledBy: currentUserEmail,
        cancelledByUlid: currentDbUserUlid, 
      })
      .eq('ulid', sessionId);

    if (sessionDbUpdateError) {
      console.error('[DB_SESSION_UPDATE_ERROR]', sessionDbUpdateError);
      return new NextResponse('Failed to update session status in DB.', { status: 500, statusText: sessionDbUpdateError.message });
    }

    // 7. Update CalBooking in DB
    const { error: calBookingDbUpdateError } = await supabase
      .from('CalBooking')
      .update({
        status: 'CANCELLED', // CalBookingStatus.CANCELLED
        updatedAt: updateTimestamp,
      })
      .eq('ulid', calBookingTableUlid); // Update our CalBooking record using its ULID (PK)

    if (calBookingDbUpdateError) {
      console.error('[DB_CALBOOKING_UPDATE_ERROR]', calBookingDbUpdateError);
      return new NextResponse('Failed to update CalBooking status in DB.', { status: 500, statusText: calBookingDbUpdateError.message });
    }

    return NextResponse.json({ data: { message: 'Booking cancelled successfully.', calResponse: calCancelResponse } });

  } catch (error: any) {
    console.error('[CANCEL_API_HANDLER_ERROR]', error);
    // For errors thrown by cancelCalBooking or other unexpected errors
    const errorMessage = error.message || 'An unexpected error occurred processing the cancellation.';
    return new NextResponse(errorMessage, { status: 500 });
  }
} 