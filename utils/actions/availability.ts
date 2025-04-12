"use server"

import { createAuthClient } from '@/utils/auth'
import { getCurrentUserId } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { ApiResponse, ApiError } from '@/utils/types/api'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { z } from 'zod'
import { generateUlid } from '@/utils/ulid'
import { 
  AvailabilityResponse,
  SaveAvailabilityParams,
  SaveAvailabilityParamsSchema,
  DAYS_OF_WEEK,
  WeekDay,
  TimeSlot,
  WeeklySchedule
} from '@/utils/types/availability'
import { nanoid } from 'nanoid'

// Response types
interface AvailabilitySchedule {
  ulid: string
  userUlid: string
  timeZone: string
  weeklySchedule: Record<string, any>
  bufferTime: number
  dateOverrides: Record<string, any>
  dateRanges: any[]
  createdAt: string
  updatedAt: string
}

interface BookedSession {
  ulid: string
  startTime: string
  endTime: string
  coachUlid: string
  menteeUlid: string
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  createdAt: string
}

// Fetch coach availability schedule
export const fetchCoachAvailability = withServerAction<AvailabilityResponse | null>(
  async () => {
    try {
      // Get the user's ID from auth
      const userId = await getCurrentUserId()
      if (!userId) {
        console.error('[FETCH_AVAILABILITY_ERROR] No user ID found')
        return {
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
        }
      }

      // Get the user's ULID from the database
      const supabase = createAuthClient()
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('ulid')
        .eq('userId', userId)
        .single()

      if (userError || !userData) {
        console.error('[FETCH_AVAILABILITY_ERROR]', {
          error: userError,
          userId,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: { code: 'DATABASE_ERROR', message: 'Failed to find user in database' }
        }
      }
      const userUlid = userData.ulid;

      // Fetch Calendar Integration first to get the primary timezone
      const { data: calendarIntegration, error: integrationError } = await supabase
        .from('CalendarIntegration')
        .select('timeZone')
        .eq('userUlid', userUlid)
        .maybeSingle();

      if (integrationError) {
        console.warn('[FETCH_AVAILABILITY_WARNING] Failed to fetch calendar integration', {
          error: integrationError,
          userUlid,
          timestamp: new Date().toISOString()
        })
        // Continue even if integration fetch fails, we can fallback to schedule timezone
      }

      // Get availability schedule for the user
      const { data: schedule, error: scheduleError } = await supabase
        .from('CoachingAvailabilitySchedule')
        .select('*')
        .eq('userUlid', userUlid)
        .maybeSingle()

      if (scheduleError) {
        console.error('[FETCH_AVAILABILITY_ERROR]', {
          error: scheduleError,
          userUlid,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to fetch availability schedule. Please try again later.' 
          }
        }
      }

      // If no schedule exists yet, return NOT_FOUND error
      // This indicates first-time setup
      if (!schedule) {
        return {
          data: null,
          error: { code: 'NOT_FOUND', message: 'No availability schedule found' }
        }
      }

      // Map Cal.com availability format to our WeeklySchedule format
      const mapCalAvailabilityToWeeklySchedule = (availability: any): WeeklySchedule => {
        const defaultSchedule: WeeklySchedule = {
          SUNDAY: [], MONDAY: [], TUESDAY: [], WEDNESDAY: [], 
          THURSDAY: [], FRIDAY: [], SATURDAY: []
        }
        
        // Ensure availability is treated as an array
        const availabilityArray = Array.isArray(availability) ? availability : [];

        if (!availabilityArray.length) return defaultSchedule
        
        // Create new accumulator to avoid mutation issues
        return availabilityArray.reduce((acc: WeeklySchedule, slot: any): WeeklySchedule => {
          const newAcc = { ...acc };
          
          // Create the time slot
          const timeSlot = {
            from: slot.startTime,
            to: slot.endTime
          };
          
          // Add it to applicable days
          const days = slot.days || [];
          days.forEach((day: any) => {
            // Handle both string (legacy) and numeric (new) day formats
            let dayKey: WeekDay;
            
            if (typeof day === 'number') {
              // If day is a number (0-6), convert to corresponding day string
              dayKey = DAYS_OF_WEEK[day] as WeekDay;
            } else if (typeof day === 'string') {
              // If day is a string, convert to uppercase for our enum format
              dayKey = day.toUpperCase() as WeekDay;
            } else {
              // Skip invalid day format
              console.warn('[AVAILABILITY_WARNING] Invalid day format:', { day, type: typeof day });
              return;
            }
            
            if (dayKey in newAcc) {
              newAcc[dayKey] = [...newAcc[dayKey], timeSlot];
            }
          });
          
          return newAcc;
        }, defaultSchedule)
      }

      // Determine timezone: Prioritize CalendarIntegration, then Schedule, then null
      const determinedTimeZone = calendarIntegration?.timeZone || schedule.timeZone || null;
      
      // Log timezone info for debugging
      console.log('[TIMEZONE_INFO]', {
        calTimeZone: calendarIntegration?.timeZone || 'none',
        dbTimeZone: schedule.timeZone || 'none',
        using: determinedTimeZone || 'none',
        timestamp: new Date().toISOString()
      });

      const response: AvailabilityResponse = {
        schedule: mapCalAvailabilityToWeeklySchedule(schedule.availability),
        timezone: determinedTimeZone
      }

      return {
        data: response,
        error: null
      }
    } catch (error) {
      console.error('[FETCH_AVAILABILITY_ERROR]', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
      return {
        data: null,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
      }
    }
  }
)

// Save coach availability schedule
export const saveCoachAvailability = withServerAction<{ success: true }, SaveAvailabilityParams>(
  async (params) => {
    try {
      // Validate input parameters using Zod schema
      const validationResult = SaveAvailabilityParamsSchema.safeParse(params);
      if (!validationResult.success) {
        console.error('[SAVE_AVAILABILITY_ERROR] Invalid input parameters:', {
          error: validationResult.error.flatten(),
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: validationResult.error.flatten()
          }
        };
      }
      const validatedParams = validationResult.data;

      // Get the user's ID from auth
      const userId = await getCurrentUserId()
      if (!userId) {
        console.error('[SAVE_AVAILABILITY_ERROR] No user ID found')
        return {
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
        }
      }

      // Get the user's ULID from the database
      const supabase = createAuthClient()
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('ulid')
        .eq('userId', userId)
        .single()

      if (userError || !userData) {
        console.error('[SAVE_AVAILABILITY_ERROR]', {
          error: userError,
          userId,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: { code: 'DATABASE_ERROR', message: 'Failed to find user in database' }
        }
      }
      const userUlid = userData.ulid;

      // Fetch both existing schedule and calendar integration concurrently
      const [existingScheduleResult, calendarIntegrationResult] = await Promise.all([
        supabase
          .from('CoachingAvailabilitySchedule')
          .select('ulid, timeZone')
          .eq('userUlid', userUlid)
          .maybeSingle(),
        supabase
          .from('CalendarIntegration')
          .select('timeZone')
          .eq('userUlid', userUlid)
          .maybeSingle()
      ]);

      const { data: existingSchedule, error: scheduleError } = existingScheduleResult;
      const { data: calendarIntegration, error: integrationError } = calendarIntegrationResult;

      if (scheduleError) {
         console.error('[SAVE_AVAILABILITY_ERROR] Failed to check existing schedule', {
          error: scheduleError,
          userUlid,
          timestamp: new Date().toISOString()
        })
        // Potentially return error, or proceed carefully
      }
      if (integrationError) {
        console.warn('[SAVE_AVAILABILITY_WARNING] Failed to fetch calendar integration during save', {
          error: integrationError,
          userUlid,
          timestamp: new Date().toISOString()
        })
        // Log warning but proceed, as timezone fallback exists
      }

      // Convert our weekly schedule format to Cal.com availability format
      const mapWeeklyScheduleToCalAvailability = (weeklySchedule: WeeklySchedule) => {
        // Cal.com expects days as numbers 0-6, where 0 is Sunday, 1 is Monday, etc.
        const availability: { days: number[], startTime: string, endTime: string }[] = []
        
        Object.entries(weeklySchedule).forEach(([day, slots]) => {
          if (!slots.length) return
          
          const dayIndex = DAYS_OF_WEEK.indexOf(day as WeekDay); // Get index (0-6)
          if (dayIndex === -1) return; // Skip invalid days

          slots.forEach(slot => {
            const existingSlot = availability.find(
              a => a.startTime === slot.from && a.endTime === slot.to
            )
            
            if (existingSlot) {
              if (!existingSlot.days.includes(dayIndex)) { // Ensure day is not already added
                existingSlot.days.push(dayIndex)
                existingSlot.days.sort((a, b) => a - b); // Keep days sorted
              }
            } else {
              availability.push({
                days: [dayIndex],
                startTime: slot.from,
                endTime: slot.to
              })
            }
          })
        })
        
        return availability
      }

      // Determine timezone: ALWAYS prioritize CalendarIntegration as source of truth
      // Only fall back to other sources if Cal.com integration not available
      const determinedTimeZone = calendarIntegration?.timeZone || 
                               validatedParams.timezone || 
                               existingSchedule?.timeZone || 
                               "America/New_York";
      
      // Log timezone for debugging
      console.log('[SAVE_TIMEZONE_INFO]', {
        calTimeZone: calendarIntegration?.timeZone || 'none',
        paramTimeZone: validatedParams.timezone || 'none',
        existingTimeZone: existingSchedule?.timeZone || 'none',
        using: determinedTimeZone,
        timestamp: new Date().toISOString()
      });

      const schedulePayload = {
        name: "Default Schedule", // Consider making this configurable or using existing name
        timeZone: determinedTimeZone,
        availability: mapWeeklyScheduleToCalAvailability(validatedParams.schedule),
        isDefault: true, // Assuming this is the default schedule being saved
        updatedAt: new Date().toISOString(), // Required by project rules
        // Include other relevant fields from schema like buffer times, duration settings if applicable
        // bufferAfter: params.bufferAfter ?? existingSchedule?.bufferAfter ?? 0,
        // bufferBefore: params.bufferBefore ?? existingSchedule?.bufferBefore ?? 0,
        // defaultDuration: params.defaultDuration ?? existingSchedule?.defaultDuration ?? 60,
        // ...etc
      }

      let result;
      if (existingSchedule) {
        // Update existing schedule
        console.log('[SAVE_AVAILABILITY] Updating existing schedule', { userUlid, scheduleId: existingSchedule.ulid });
        result = await supabase
          .from('CoachingAvailabilitySchedule')
          .update(schedulePayload) // Pass the whole payload for update
          .eq('ulid', existingSchedule.ulid)
      } else {
        // Create new schedule
        console.log('[SAVE_AVAILABILITY] Creating new schedule', { userUlid });
        result = await supabase
          .from('CoachingAvailabilitySchedule')
          .insert({
            ulid: generateUlid(),
            userUlid: userUlid,
            ...schedulePayload, // Spread the payload
            active: true, // Ensure new schedules are active
            createdAt: new Date().toISOString(), // Set createdAt only for new records
            // Add defaults for other required fields if not in payload
            allowCustomDuration: true,
            minimumDuration: 30,
            maximumDuration: 120,
            bufferAfter: 0,
            bufferBefore: 0
          })
      }

      if (result.error) {
        console.error('[SAVE_AVAILABILITY_ERROR]', {
          error: result.error,
          userUlid,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to save availability schedule. Please try again later.' 
          }
        }
      }

      // After successfully saving the availability schedule, update the coach profile completion
      try {
        const { updateProfileCompletion } = await import('@/utils/actions/update-profile-completion')
        await updateProfileCompletion(userUlid, true) // Force refresh
      } catch (updateError) {
        console.error('[UPDATE_PROFILE_COMPLETION_ERROR]', {
          error: updateError,
          userUlid,
          timestamp: new Date().toISOString()
        })
      }

      return {
        data: { success: true },
        error: null
      }
    } catch (error) {
      console.error('[SAVE_AVAILABILITY_ERROR]', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
      return {
        data: null,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
      }
    }
  }
)

// Fetch booked sessions for calendar
export const fetchBookedSessions = withServerAction<BookedSession[]>(
  async (params: { startDate: string, endDate: string }, { userUlid, roleContext }) => {
    try {
      const supabase = await createAuthClient()
      const query = supabase
        .from('Session')
        .select(`
          ulid,
          startTime,
          endTime,
          coachUlid,
          menteeUlid,
          status,
          createdAt
        `)
        .gte('startTime', params.startDate)
        .lte('endTime', params.endDate)

      // Filter based on user role
      if (roleContext.capabilities.includes(USER_CAPABILITIES.COACH)) {
        query.eq('coachUlid', userUlid)
      } else if (roleContext.capabilities.includes(USER_CAPABILITIES.MENTEE)) {
        query.eq('menteeUlid', userUlid)
      } else {
        return {
          data: [],
          error: {
            code: 'FORBIDDEN',
            message: 'User must be either a coach or mentee'
          }
        }
      }

      const { data: sessions, error: sessionsError } = await query
        .order('startTime', { ascending: true })

      if (sessionsError) {
        console.error('[FETCH_SESSIONS_ERROR]', { userUlid, error: sessionsError })
        return {
          data: [],
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch booked sessions'
          }
        }
      }

      return {
        data: sessions || [],
        error: null
      }
    } catch (error) {
      console.error('[FETCH_SESSIONS_ERROR]', error)
      return {
        data: [],
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
) 