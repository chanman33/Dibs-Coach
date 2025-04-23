'use server';

import { createAuthClient } from '@/utils/auth';
import { withServerAction, type ServerActionContext } from '@/utils/middleware/withServerAction';
import { ApiResponse, ApiError } from '@/utils/types/api';

// Add type definition
interface GetCoachBusyTimesInput {
  coachId: string;
  date: string;
  days?: number;
}

/**
 * Get coach calendar busy times from Cal.com for a date range
 * 
 * This server action retrieves the coach's busy times for multiple days
 * via the Cal.com API to reduce the number of API calls.
 */
export const getCoachBusyTimes = withServerAction(
  async ({ coachId, date, days = 1 }: GetCoachBusyTimesInput) => {
    try {
      if (!coachId) {
        console.error('[GET_COACH_BUSY_TIMES_ERROR] No coach ID provided');
        return {
          data: null,
          error: { 
            code: 'MISSING_PARAMETERS', 
            message: 'Coach ID is required' 
          }
        };
      }
      
      const selectedDate = new Date(date);
      
      // Get date in YYYY-MM-DD format for logs
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      console.log('[GET_COACH_BUSY_TIMES] Fetching busy times for date range', { 
        coachId,
        startDate: formattedDate,
        days
      });
      
      // Import the centralized Cal API request system
      const { makeCalApiRequest } = await import('@/lib/cal/cal-api');
      
      // Fetch calendars using the centralized API request method
      const calData = await makeCalApiRequest(
        '/calendars',
        'GET',
        undefined,
        coachId
      );
      
      const connectedCalendars = calData?.data?.connectedCalendars || [];
    
      if (connectedCalendars.length === 0) {
        console.warn('[GET_COACH_BUSY_TIMES_WARNING] No calendars found', {
          coachId,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: [],
          error: null
        };
      }
    
      // Get first calendar for busy times
      const firstCalendar = connectedCalendars[0];
      const firstCalendarCredential = firstCalendar.calendars && firstCalendar.calendars[0];
      
      if (!firstCalendarCredential || !firstCalendarCredential.externalId) {
        console.warn('[GET_COACH_BUSY_TIMES_WARNING] No calendar credentials found', {
          coachId,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: [],
          error: null
        };
      }
      
      // Prepare date range for busy times query
      // Start at beginning of the selected date
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      // End at end of the range (days parameter)
      const endOfRange = new Date(selectedDate);
      endOfRange.setDate(endOfRange.getDate() + days);
      endOfRange.setHours(23, 59, 59, 999);
      
      // Get user's timezone
      const userTimezone = 'America/New_York'; // Default fallback
      
      // Fetch busy times for the calendar
      const credentialId = firstCalendar.credentialId || firstCalendar.integration.credentialId;
      const externalId = firstCalendarCredential.externalId;
      
      const queryParams = new URLSearchParams({
        'dateFrom': startOfDay.toISOString(),
        'dateTo': endOfRange.toISOString(),
        'loggedInUsersTz': userTimezone,
        'calendarsToLoad[0][credentialId]': String(credentialId),
        'calendarsToLoad[0][externalId]': String(externalId)
      });
      
      console.log('[GET_COACH_BUSY_TIMES] Fetching busy times for calendar', {
        coachId,
        date: formattedDate,
        credentialId,
        externalId,
        dateRange: {
          from: startOfDay.toISOString(),
          to: endOfRange.toISOString(),
          days
        }
      });
      
      // Use the centralized API request for busy times
      const busyTimesData = await makeCalApiRequest(
        `/calendars/busy-times?${queryParams.toString()}`,
        'GET',
        undefined,
        coachId
      );
      
      const busyTimes = busyTimesData?.data || [];
      
      console.log('[GET_COACH_BUSY_TIMES] Successfully fetched busy times for date range', {
        coachId,
        startDate: formattedDate,
        days,
        count: busyTimes.length,
        busyTimes: busyTimes.length > 0 ? busyTimes.slice(0, 3) : []
      });
      
      return {
        data: busyTimes,
        error: null
      };
    } catch (error) {
      console.error('[GET_COACH_BUSY_TIMES_ERROR] Unexpected error', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: [],
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'An unexpected error occurred' 
        }
      };
    }
  }
); 