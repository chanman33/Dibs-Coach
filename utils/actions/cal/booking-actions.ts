'use server';

import { z } from 'zod';
import { withServerAction } from '@/utils/middleware/withServerAction';
import { createAuthClient } from '@/utils/auth';
import { ApiResponse, ApiError } from '@/utils/types/api';
import { ServerActionContext } from '@/utils/middleware/withServerAction';
import { BookingResult, CalendarLink } from '@/utils/types/booking';

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