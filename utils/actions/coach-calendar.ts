'use server';

import { createAuthClient } from '@/utils/auth';
import { withServerAction, type ServerActionContext } from '@/utils/middleware/withServerAction';
import { ApiResponse, ApiError } from '@/utils/types/api';

/**
 * Get coach calendar busy times from Cal.com for a date range
 * 
 * This server action retrieves the coach's busy times for multiple days
 * via the Cal.com API to reduce the number of API calls.
 */
export const getCoachBusyTimes = withServerAction<any, { coachId: string, date: string, days?: number }>(
  async (params: { coachId: string, date: string, days?: number }, context: ServerActionContext) => {
    try {
      const { coachId, date, days = 31 } = params; // Fetch a full month by default
      
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
      
      // Get the selected date and create a date range
      const selectedDate = new Date(date);
      
      // Get date in YYYY-MM-DD format for logs
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      console.log('[GET_COACH_BUSY_TIMES] Fetching busy times for date range', { 
        coachId,
        startDate: formattedDate,
        days
      });
      
      // Get valid Cal.com token using the utility function
      const { ensureValidCalToken } = await import('@/utils/cal/token-util');
      const tokenResult = await ensureValidCalToken(coachId);
      
      if (!tokenResult.success || !tokenResult.tokenInfo?.accessToken) {
        console.error('[GET_COACH_BUSY_TIMES_ERROR] Failed to get valid Cal.com token', {
          coachId,
          error: tokenResult.error,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: [],
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Failed to get valid coach calendar token' 
          }
        };
      }
      
      // Use the valid access token
      const accessToken = tokenResult.tokenInfo.accessToken;
      
      const supabase = createAuthClient();
      
      // Get the coach's calendars using the token
      // We'll create a function to retry requests with fresh tokens if needed
      const makeCalRequest = (token: string) => fetch('https://api.cal.com/v2/calendars', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Use the token handling utility to handle potential 498 responses
      const { handleCalApiResponse } = await import('@/utils/cal/token-util');
      let calResponse = await makeCalRequest(accessToken);
      
      // This will automatically handle token expiration and retry if needed
      calResponse = await handleCalApiResponse(calResponse, makeCalRequest, coachId);
      
      if (!calResponse.ok) {
        console.error('[GET_COACH_BUSY_TIMES_ERROR] Failed to fetch calendars', {
          coachId,
          status: calResponse.status,
          error: await calResponse.text(),
          timestamp: new Date().toISOString()
        });
        
        return {
          data: [],
          error: { 
            code: 'FETCH_ERROR', 
            message: 'Failed to fetch calendars from Cal.com' 
          }
        };
      }
      
      const calData = await calResponse.json();
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
      
      // Create function for busy times request that can be retried with a new token if needed
      const makeBusyTimesRequest = (token: string) => fetch(
        `https://api.cal.com/v2/calendars/busy-times?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Use the token handling utility to handle potential token expiration
      let busyTimesResponse = await makeBusyTimesRequest(accessToken);
      busyTimesResponse = await handleCalApiResponse(busyTimesResponse, makeBusyTimesRequest, coachId);
      
      if (!busyTimesResponse.ok) {
        console.error('[GET_COACH_BUSY_TIMES_ERROR] Failed to fetch busy times', {
          coachId,
          status: busyTimesResponse.status,
          error: await busyTimesResponse.text(),
          timestamp: new Date().toISOString()
        });
        
        return {
          data: [],
          error: { 
            code: 'FETCH_ERROR', 
            message: 'Failed to fetch busy times from Cal.com' 
          }
        };
      }
      
      const busyTimesData = await busyTimesResponse.json();
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
          message: 'An unexpected error occurred' 
        }
      };
    }
  }
); 