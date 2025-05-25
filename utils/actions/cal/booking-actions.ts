'use server';

import { z } from 'zod';
import { withServerAction } from '@/utils/middleware/withServerAction';
import { createAuthClient } from '@/utils/auth';
import { ApiResponse, ApiError } from '@/utils/types/api';
import { ServerActionContext } from '@/utils/middleware/withServerAction';
import { BookingResult, CalendarLink } from '@/utils/types/booking';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Schema for create booking parameters
const CreateBookingSchema = z.object({
  eventTypeId: z.union([z.string(), z.number()]),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  attendeeName: z.string(),
  attendeeEmail: z.string().email(),
  notes: z.string().optional(),
  customInputs: z.record(z.string(), z.any()).optional(),
  timeZone: z.string().default('UTC')
});

// Extended type for our server action that includes additional fields
interface CreateBookingParams {
  coachId: string;
  startTime: string;
  endTime: string;
  eventTypeId: number | string;
  duration?: number;
  sessionTopic?: string;
}

/**
 * Create a booking via the Cal.com API
 * 
 * This action creates a booking through our Cal.com integration API.
 * It handles all the necessary authentication, validation, and error handling.
 */
export const createBooking = withServerAction<BookingResult, CreateBookingParams>(
  async (params: CreateBookingParams, context: ServerActionContext) => {
    try {
      const { userUlid } = context;
      const { coachId, startTime, endTime, eventTypeId, duration, sessionTopic } = params;
      
      if (!userUlid) {
        return {
          data: null,
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'You must be logged in to book a session' 
          }
        };
      }
      
      // Get user information for attendee details
      const supabase = createAuthClient();
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('email, firstName, lastName, displayName')
        .eq('ulid', userUlid)
        .single();
      
      if (userError || !userData) {
        console.error('[CREATE_BOOKING_ACTION_ERROR] User not found', {
          userUlid,
          error: userError,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'User information not found'
          }
        };
      }
      
      // Construct attendee name from user data
      const attendeeName = userData.displayName || 
        `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 
        'User';
      
      // Validate the request data
      const validationResult = CreateBookingSchema.safeParse({
        eventTypeId: eventTypeId,
        startTime,
        endTime,
        attendeeName,
        attendeeEmail: userData.email,
        notes: sessionTopic,
        customInputs: {},
        timeZone: 'UTC'
      });
      
      if (!validationResult.success) {
        console.error('[CREATE_BOOKING_ACTION_ERROR] Validation error', {
          error: validationResult.error.format(),
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid booking data',
            details: validationResult.error.format()
          }
        };
      }
      
      // Make API request to our internal endpoint
      const bookingDataForApi = {
        ...validationResult.data,
        coachUlid: coachId
      };

      const response = await fetch(`${process.env.FRONTEND_URL || 'https://dibs.vercel.app'}/api/cal/booking/create-a-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingDataForApi)
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to create booking';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          
          console.error('[CREATE_BOOKING_ACTION_ERROR] API error', {
            status: response.status,
            error: errorData,
            timestamp: new Date().toISOString()
          });
        } catch (parseError) {
          console.error('[CREATE_BOOKING_ACTION_ERROR] Failed to parse error response', {
            status: response.status,
            parseError,
            timestamp: new Date().toISOString()
          });
        }
        
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: errorMessage,
            details: { statusCode: response.status }
          }
        };
      }
      
      // Parse successful response
      const responseData = await response.json();
      
      // For client reference, save that this user made this booking
      try {
        const supabase = createAuthClient();
        await supabase
          .from('User')
          .update({ 
            updatedAt: new Date().toISOString()
          })
          .eq('ulid', userUlid);
      } catch (dbError) {
        // Log but don't fail the overall operation
        console.error('[CREATE_BOOKING_ACTION_WARNING] Failed to update user record', {
          error: dbError,
          userUlid,
          timestamp: new Date().toISOString()
        });
      }
      
      return {
        data: responseData.data.booking,
        error: null
      };
    } catch (error) {
      console.error('[CREATE_BOOKING_ACTION_ERROR] Unexpected error', {
        error,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while creating the booking'
        }
      };
    }
  }
);

/**
 * Get calendar links for a specific booking
 */
export const getCalendarLinks = withServerAction<CalendarLink[], string>(
  async (bookingUid: string, { userUlid }: ServerActionContext) => {
    try {
      if (!bookingUid) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Booking UID is required'
          }
        };
      }
      
      // Make API request to our internal endpoint
      const response = await fetch(`${process.env.FRONTEND_URL || 'https://dibs.vercel.app'}/api/cal/booking/get-add-to-calendar-links/${bookingUid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to get calendar links';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          
          console.error('[GET_CALENDAR_LINKS_ACTION_ERROR] API error', {
            status: response.status,
            error: errorData,
            timestamp: new Date().toISOString()
          });
        } catch (parseError) {
          console.error('[GET_CALENDAR_LINKS_ACTION_ERROR] Failed to parse error response', {
            status: response.status,
            parseError,
            timestamp: new Date().toISOString()
          });
        }
        
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: errorMessage,
            details: { statusCode: response.status }
          }
        };
      }
      
      // Parse successful response
      const responseData = await response.json();
      
      return {
        data: responseData.data.calendarLinks,
        error: null
      };
    } catch (error) {
      console.error('[GET_CALENDAR_LINKS_ACTION_ERROR] Unexpected error', {
        error,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while getting calendar links'
        }
      };
    }
  }
);

interface CancelBookingPayload {
  sessionId: string;
  calBookingUid: string;
  cancellationReason?: string;
}

// Helper function (can be co-located or imported if used elsewhere)
async function cancelCalComBooking(bookingUid: string, coachAccessToken: string, cancellationReason?: string) {
  const calApiUrl = `https://api.cal.com/v2/bookings/${bookingUid}/cancel`;
  const response = await fetch(calApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${coachAccessToken}`,
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
    // Throw an error to be caught by the calling server action
    throw new Error(errorData.message || `Failed to cancel Cal.com booking. Status: ${response.status}`);
  }
  return await response.json();
}

// Updated server action with consolidated logic
export const cancelBookingAction = withServerAction<
  { success: boolean; message?: string; error?: string; calData?: any },
  CancelBookingPayload
>(
  async (
    payload: CancelBookingPayload,
    context: ServerActionContext
  ): Promise<ApiResponse<{ success: boolean; message?: string; error?: string; calData?: any }>> => {
    const { sessionId, cancellationReason } = payload;
    // Assume payload.calBookingUid is the ULID of our CalBooking table record
    const calBookingTableUlid = payload.calBookingUid; 
    const { userUlid: currentDbUserUlid } = context; // Get user ULID from context

    const supabase = createAuthClient(); // Auth client for server action

    try {
      if (!sessionId || !calBookingTableUlid) {
        return { data: { success: false, error: 'Missing sessionId or calBookingRecordUlid' }, error: null };
      }

      if (!currentDbUserUlid) {
        console.error('[CANCEL_BOOKING_ACTION_ERROR] User details not found in context');
        return { data: { success: false, error: 'Could not authenticate user.' }, error: null };
      }

      // Fetch current user's email
      const { data: currentUserData, error: currentUserError } = await supabase
        .from('User')
        .select('email')
        .eq('ulid', currentDbUserUlid)
        .single();

      if (currentUserError || !currentUserData?.email) {
        console.error('[CANCEL_BOOKING_ACTION_ERROR] Failed to fetch current user email', currentUserError);
        return { data: { success: false, error: 'Could not retrieve user email.' }, error: null };
      }
      const currentUserEmail = currentUserData.email;

      // 2. Fetch Session details
      const { data: sessionData, error: sessionFetchDbError } = await supabase
        .from('Session')
        .select('coachUlid, startTime, menteeUlid, status')
        .eq('ulid', sessionId)
        .single();

      if (sessionFetchDbError || !sessionData) {
        console.error('[CANCEL_BOOKING_ACTION_ERROR] DB_SESSION_FETCH_ERROR', sessionFetchDbError);
        return { 
          data: { success: false, error: sessionFetchDbError?.message || 'Failed to fetch session details.' }, 
          error: null 
        };
      }

      // 3. Authorization and Policy Checks
      if (sessionData.menteeUlid !== currentDbUserUlid && sessionData.coachUlid !== currentDbUserUlid) {
        console.warn('[CANCEL_BOOKING_ACTION_WARN]', `User ${currentUserEmail} (DB ULID: ${currentDbUserUlid}) attempted to cancel session ${sessionId} not belonging to them as mentee (Mentee ULID: ${sessionData.menteeUlid}) or coach (Coach ULID: ${sessionData.coachUlid}).`);
        return { 
          data: { success: false, error: 'Forbidden: You can only cancel sessions you are a part of (mentee or coach).' }, 
          error: null 
        };
      }

      if (sessionData.status === 'CANCELLED') {
        return { data: { success: false, error: 'Session is already cancelled.' }, error: null };
      }
      if (sessionData.status !== 'SCHEDULED') {
        return { data: { success: false, error: 'Only scheduled sessions can be cancelled.' }, error: null };
      }

      const sessionStartTime = new Date(sessionData.startTime);
      const now = new Date();
      const hoursDifference = (sessionStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursDifference < 24) {
        return { 
          data: { success: false, error: 'Cancellation failed: Sessions cannot be cancelled within 24 hours of the start time.' }, 
          error: null 
        };
      }

      // 4. Fetch Coach's Cal.com AccessToken
      const { data: calendarIntegration, error: calIntegrationDbError } = await supabase
        .from('CalendarIntegration')
        .select('calAccessToken')
        .eq('userUlid', sessionData.coachUlid)
        .single();

      if (calIntegrationDbError || !calendarIntegration || !calendarIntegration.calAccessToken) {
        console.error('[CANCEL_BOOKING_ACTION_ERROR] DB_CAL_INTEGRATION_FETCH_ERROR', { error: calIntegrationDbError, coachUlid: sessionData.coachUlid });
        return { 
          data: { success: false, error: "Failed to retrieve coach's Cal.com integration details or access token missing." }, 
          error: null 
        };
      }
      const coachCalAccessToken = calendarIntegration.calAccessToken;

      // NEW: Fetch the actual Cal.com booking UID from our CalBooking table
      const { data: calBookingRecord, error: fetchCalBookingRecordError } = await supabase
        .from('CalBooking')
        .select('calBookingUid') // This is the field storing the Cal.com native UID
        .eq('ulid', calBookingTableUlid) // Query by our internal primary key
        .single();

      if (fetchCalBookingRecordError || !calBookingRecord || !calBookingRecord.calBookingUid) {
        console.error('[CANCEL_BOOKING_ACTION_ERROR] Failed to fetch Cal.com Booking UID from CalBooking table', { 
          error: fetchCalBookingRecordError, 
          calBookingTableUlid
        });
        return { 
          data: { success: false, error: "Failed to retrieve essential booking information for cancellation with Cal.com." }, 
          error: null 
        };
      }
      const calComNativeBookingUid = calBookingRecord.calBookingUid; // This is the ID to send to Cal.com API

      // 5. Cancel with Cal.com (using the helper function)
      // Pass the correct Cal.com native booking UID
      const calCancelResponse = await cancelCalComBooking(calComNativeBookingUid, coachCalAccessToken, cancellationReason);
      console.log('[CANCEL_BOOKING_ACTION] CAL_CANCEL_API_SUCCESS', calCancelResponse);

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
        console.error('[CANCEL_BOOKING_ACTION_ERROR] DB_SESSION_UPDATE_ERROR', sessionDbUpdateError);
        return { 
          data: { success: false, error: `Failed to update session status in DB: ${sessionDbUpdateError.message}` }, 
          error: null 
        };
      }

      // 7. Update CalBooking in DB
      const { error: calBookingDbUpdateError } = await supabase
        .from('CalBooking')
        .update({
          status: 'CANCELLED', // CalBookingStatus.CANCELLED
          updatedAt: updateTimestamp,
        })
        .eq('ulid', calBookingTableUlid); // MODIFIED: Update our CalBooking record using its ULID (PK)

      if (calBookingDbUpdateError) {
        console.error('[CANCEL_BOOKING_ACTION_ERROR] DB_CALBOOKING_UPDATE_ERROR', calBookingDbUpdateError);
        return { 
          data: { success: false, error: `Failed to update CalBooking status in DB: ${calBookingDbUpdateError.message}` }, 
          error: null 
        };
      }

      revalidatePath('/dashboard/mentee');
      revalidatePath('/booking/booking-cancelled');

      return { data: { success: true, message: 'Booking cancelled successfully.', calData: calCancelResponse }, error: null };

    } catch (error: any) {
      console.error('[CANCEL_BOOKING_ACTION_ERROR] Outer catch block error:', error);
      const errorMessage = error.message || 'An unexpected error occurred processing the cancellation.';
      return { 
        data: null, // For system errors, data is null
        error: { 
          code: 'INTERNAL_ERROR', 
          message: errorMessage 
        } 
      };
    }
  }
); 