'use server';

import { z } from 'zod';
import { withServerAction } from '@/utils/middleware/withServerAction';
import { createAuthClient } from '@/utils/auth';
import { ApiResponse, ApiError } from '@/utils/types/api';
import { ServerActionContext } from '@/utils/middleware/withServerAction';

// Schema for create booking parameters
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

type CreateBookingParams = z.infer<typeof CreateBookingSchema>;

// Types for response
export interface CalendarLink {
  label: string;
  link: string;
}

export interface BookingResult {
  id: string;
  calBookingUid: string;
  title: string;
  startTime: string;
  endTime: string;
  attendeeName: string;
  attendeeEmail: string;
  calendarLinks?: CalendarLink[];
}

/**
 * Create a booking via the Cal.com API
 * 
 * This action creates a booking through our Cal.com integration API.
 * It handles all the necessary authentication, validation, and error handling.
 */
export const createBooking = withServerAction<BookingResult, CreateBookingParams>(
  async (data: CreateBookingParams, { userUlid }: ServerActionContext) => {
    try {
      // Validate the request data
      const validationResult = CreateBookingSchema.safeParse(data);
      
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
      const bookingData = validationResult.data;
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cal/booking/create-a-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cal/booking/get-add-to-calendar-links/${bookingUid}`, {
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