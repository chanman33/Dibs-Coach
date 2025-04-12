'use server';

import { createAuthClient } from '@/utils/auth';
import { withServerAction, type ServerActionContext } from '@/utils/middleware/withServerAction';
import { ApiResponse, ApiError } from '@/utils/types/api';
import { 
  type AvailabilitySlot,
  type CoachSchedule,
  type CoachInfo,
  type CoachAvailabilityResponse,
  type GetCoachAvailabilityParams,
  AvailabilitySlotSchema,
  CoachScheduleSchema
} from '@/utils/types/coach-availability';

/**
 * Get coach availability by coach ID or slug
 * 
 * This server action retrieves the coach's info and availability schedule.
 * It can look up the coach by either their ULID or profile slug.
 */
export const getCoachAvailability = withServerAction<CoachAvailabilityResponse, GetCoachAvailabilityParams>(
  async (params: GetCoachAvailabilityParams, context: ServerActionContext) => {
    try {
      const { coachId, slug } = params;
      
      if (!coachId && !slug) {
        console.error('[GET_COACH_AVAILABILITY_ERROR] No coach identifier provided');
        return {
          data: { coach: null, schedule: null },
          error: { 
            code: 'MISSING_PARAMETERS', 
            message: 'Either coachId or slug is required' 
          }
        };
      }
      
      const supabase = createAuthClient();
      let coachUlid: string;
      
      // Resolve coach ULID from slug if needed
      if (slug && !coachId) {
        console.log('[GET_COACH_AVAILABILITY] Looking up coach by slug', { slug });
        const { data: profileData, error: profileError } = await supabase
          .from("CoachProfile")
          .select("userUlid")
          .eq("profileSlug", slug)
          .single();
          
        if (profileError || !profileData) {
          console.error('[GET_COACH_AVAILABILITY_ERROR] Coach not found by slug', {
            slug,
            error: profileError,
            timestamp: new Date().toISOString()
          });
          
          return {
            data: { coach: null, schedule: null },
            error: { 
              code: 'NOT_FOUND', 
              message: 'Coach not found with the provided slug' 
            }
          };
        }
        
        coachUlid = profileData.userUlid;
      } else {
        // Use provided coachId directly
        coachUlid = coachId!;
      }
      
      // Get coach basic info
      console.log('[GET_COACH_AVAILABILITY] Fetching coach data', { coachUlid });
      const { data: coachData, error: coachError } = await supabase
        .from("User")
        .select("ulid, firstName, lastName")
        .eq("ulid", coachUlid)
        .single();
      
      if (coachError || !coachData) {
        console.error('[GET_COACH_AVAILABILITY_ERROR] Coach not found', {
          coachUlid,
          error: coachError,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: { coach: null, schedule: null },
          error: { 
            code: 'NOT_FOUND', 
            message: 'Coach not found' 
          }
        };
      }
      
      // Get coach availability schedule
      console.log('[GET_COACH_AVAILABILITY] Fetching coach schedule', { coachUlid });
      const { data: scheduleData, error: scheduleError } = await supabase
        .from("CoachingAvailabilitySchedule")
        .select("*")
        .eq("userUlid", coachUlid)
        .eq("isDefault", true)
        .eq("active", true)
        .single();
        
      if (scheduleError) {
        console.error('[GET_COACH_AVAILABILITY_ERROR] Failed to fetch coach schedule', {
          coachUlid,
          error: scheduleError,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: { 
            coach: {
              ulid: coachData.ulid,
              firstName: coachData.firstName || '',
              lastName: coachData.lastName || ''
            }, 
            schedule: null 
          },
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to fetch coach availability schedule' 
          }
        };
      }
      
      if (!scheduleData) {
        console.warn('[GET_COACH_AVAILABILITY_WARNING] No schedule found for coach', {
          coachUlid,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: { 
            coach: {
              ulid: coachData.ulid,
              firstName: coachData.firstName || '',
              lastName: coachData.lastName || ''
            }, 
            schedule: null 
          },
          error: { 
            code: 'NOT_FOUND', 
            message: 'Coach has no availability schedule' 
          }
        };
      }
      
      // Parse availability data if needed
      const availabilityData = typeof scheduleData.availability === 'string' 
        ? JSON.parse(scheduleData.availability) 
        : scheduleData.availability;
      
      // Get Cal.com timezone if available (this should be prioritized)
      const { data: calendarIntegration, error: integrationError } = await supabase
        .from('CalendarIntegration')
        .select('timeZone')
        .eq('userUlid', coachUlid)
        .maybeSingle();
        
      if (integrationError) {
        console.warn('[GET_COACH_AVAILABILITY_WARNING] Failed to fetch calendar integration', {
          error: integrationError,
          coachUlid,
          timestamp: new Date().toISOString()
        });
        // Continue even if integration fetch fails, we can fallback to schedule timezone
      }
      
      // Determine timezone: Prioritize CalendarIntegration, then Schedule
      const determinedTimeZone = calendarIntegration?.timeZone || scheduleData.timeZone;
      
      // Log timezone info for debugging
      console.log('[COACH_TIMEZONE_INFO]', {
        calTimeZone: calendarIntegration?.timeZone || 'none',
        dbTimeZone: scheduleData.timeZone || 'none',
        using: determinedTimeZone || 'none',
        timestamp: new Date().toISOString()
      });
      
      // Enhanced logging for debugging timezone and availability issues
      console.log('[DEBUG][COACH_AVAILABILITY] Coach schedule details', {
        coachUlid,
        coachName: `${coachData.firstName || ''} ${coachData.lastName || ''}`,
        timeZone: determinedTimeZone,
        availabilityCount: availabilityData.length,
        availabilityDetails: availabilityData.map((slot: { days: string[], startTime: string, endTime: string }) => ({
          days: slot.days,
          startTime: slot.startTime,
          endTime: slot.endTime
        })),
        rawAvailability: availabilityData,
        defaultDuration: scheduleData.defaultDuration || 60,
        timestamp: new Date().toISOString()
      });
      
      // Return coach data and schedule
      return {
        data: {
          coach: {
            ulid: coachData.ulid,
            firstName: coachData.firstName || '',
            lastName: coachData.lastName || ''
          },
          schedule: {
            ulid: scheduleData.ulid,
            userUlid: scheduleData.userUlid,
            name: scheduleData.name,
            timeZone: determinedTimeZone,
            availability: availabilityData,
            isDefault: scheduleData.isDefault,
            active: scheduleData.active,
            defaultDuration: scheduleData.defaultDuration || 60
          }
        },
        error: null
      };
    } catch (error) {
      console.error('[GET_COACH_AVAILABILITY_ERROR] Unexpected error', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: { coach: null, schedule: null },
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An unexpected error occurred' 
        }
      };
    }
  }
);

/**
 * Get coach calendar busy times from Cal.com
 * 
 * This server action retrieves the coach's busy times from their connected calendars
 * via the Cal.com API. It handles fetching the coach's Cal.com credentials and 
 * calling the busy times endpoint.
 */
export const getCoachCalendarBusyTimes = withServerAction<any, { coachId: string, date: string }>(
  async (params: { coachId: string, date: string }, context: ServerActionContext) => {
    try {
      const { coachId, date } = params;
      
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
      
      // Get the selected date and create a date range for the busy times query
      const selectedDate = new Date(date);
      
      // Get date in YYYY-MM-DD format for logs
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      console.log('[GET_COACH_BUSY_TIMES] Fetching busy times', { 
        coachId,
        date: formattedDate
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
      
      // End at end of the selected date
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Get user's timezone
      const userTimezone = 'America/New_York'; // Default fallback
      
      // Fetch busy times for the calendar
      const credentialId = firstCalendar.credentialId || firstCalendar.integration.credentialId;
      const externalId = firstCalendarCredential.externalId;
      
      const queryParams = new URLSearchParams({
        'dateFrom': startOfDay.toISOString(),
        'dateTo': endOfDay.toISOString(),
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
          to: endOfDay.toISOString()
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
      
      console.log('[GET_COACH_BUSY_TIMES] Successfully fetched busy times', {
        coachId,
        date: formattedDate,
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