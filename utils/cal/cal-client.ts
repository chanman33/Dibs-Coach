import { makeCalApiRequest } from '@/lib/cal/cal-api';
import { CalEventType, CalTimeSlot, CreateBookingData } from '@/lib/cal/cal-api';

// Placeholder for the booking response structure
// This should be refined based on actual Cal.com API response for creating a booking
export interface CalBooking {
  id: number | string; // Booking ID
  uid?: string; // Unique booking ID from Cal.com
  title?: string;
  startTime?: string;
  endTime?: string;
  // Add other relevant booking fields
}

// Define the shape of the client that BookingCalendar expects
export interface CalBookingClient {
  getEventTypes: (userUlid?: string) => Promise<CalEventType[]>;
  getAvailability: (
    eventTypeId: number,
    startDate: string,
    endDate: string,
    userUlid?: string
  ) => Promise<CalTimeSlot[]>;
  createBooking: (payload: CreateBookingData, userUlid?: string) => Promise<CalBooking>; // Using CalBooking placeholder
}

/**
 * Creates a Cal.com API client for booking-related operations.
 * This client uses user-specific authentication via makeCalApiRequest.
 *
 * @param userUlid Optional user ULID. If provided, requests will be made on behalf of this user.
 *                 If not provided, implementation might fetch it or use a default/app-level context.
 *                 For now, we'll assume it's passed or handled by makeCalApiRequest if undefined.
 * @returns An instance of CalBookingClient
 */
export function createCalClient(userUlid?: string): CalBookingClient {
  return {
    async getEventTypes(): Promise<CalEventType[]> {
      // Endpoint might need adjustment based on actual Cal.com API
      // Assuming /event-types returns a structure like { event_types: [] } or directly an array
      const response = await makeCalApiRequest<{ event_types: CalEventType[] } | CalEventType[]>(
        '/event-types', // Or specific endpoint like /users/${userId}/event-types if needed
        'GET',
        undefined,
        userUlid // Pass userUlid for user-specific context
      );
      if (Array.isArray(response)) {
        return response;
      }
      // Cal.com API for event_types might return { event_types: [...] }
      return response.event_types || [];
    },

    async getAvailability(
      eventTypeId: number,
      startDate: string, // Expected format: YYYY-MM-DD
      endDate: string,   // Expected format: YYYY-MM-DD
      userUlid?: string
    ): Promise<CalTimeSlot[]> {
      // Construct the query parameters for the availability endpoint
      const queryParams = new URLSearchParams({
        eventTypeId: eventTypeId.toString(),
        startDate,
        endDate,
        // Add other necessary params like timezone if required by Cal.com API
      });
      // Endpoint might need adjustment based on actual Cal.com API
      const response = await makeCalApiRequest<{ availableSlots: CalTimeSlot[] } | CalTimeSlot[]>(
        `/availability?${queryParams.toString()}`,
        'GET',
        undefined,
        userUlid
      );
      // Response structure might vary, adjust accordingly
      if (Array.isArray(response)) {
        return response;
      }
      return response.availableSlots || [];
    },

    async createBooking(payload: CreateBookingData, userUlid?: string): Promise<CalBooking> {
      // Endpoint might need adjustment
      const response = await makeCalApiRequest<{ booking: CalBooking } | CalBooking>(
        '/bookings',
        'POST',
        payload,
        userUlid
      );
      // Response might be { booking: {...} } or just {...}
      if ('booking' in response && typeof response.booking === 'object' && response.booking !== null) {
        return response.booking as CalBooking;
      }
      return response as CalBooking;
    },
  };
} 