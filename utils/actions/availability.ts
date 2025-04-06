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

      if (userError) {
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

      // Get availability schedule for the user
      const { data: schedule, error: scheduleError } = await supabase
        .from('CoachingAvailabilitySchedule')
        .select('*')
        .eq('userUlid', userData.ulid)
        .maybeSingle()

      if (scheduleError) {
        // Log the error but don't expose database details to client
        console.error('[FETCH_AVAILABILITY_ERROR]', {
          error: scheduleError,
          userUlid: userData.ulid,
          timestamp: new Date().toISOString()
        })
        
        // Return a more user-friendly error
        return {
          data: null,
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to fetch availability schedule. Please try again later.' 
          }
        }
      }

      // If no schedule exists yet, return NOT_FOUND error
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
        
        if (!availability?.length) return defaultSchedule
        
        return availability.reduce((acc: WeeklySchedule, slot: any) => {
          const timeSlot = {
            from: slot.startTime,
            to: slot.endTime
          }
          slot.days.forEach((day: string) => {
            const upperDay = day.toUpperCase() as WeekDay
            if (upperDay in acc) {
              acc[upperDay].push(timeSlot)
            }
          })
          return acc
        }, defaultSchedule)
      }

      const response: AvailabilityResponse = {
        schedule: mapCalAvailabilityToWeeklySchedule(schedule.availability),
        timezone: schedule.timeZone || 'America/New_York'
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

      if (userError) {
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

      // Check if schedule already exists
      const { data: existingSchedule } = await supabase
        .from('CoachingAvailabilitySchedule')
        .select('ulid, timeZone')
        .eq('userUlid', userData.ulid)
        .maybeSingle()

      // Convert our weekly schedule format to Cal.com availability format
      const mapWeeklyScheduleToCalAvailability = (weeklySchedule: WeeklySchedule) => {
        const availability: { days: string[], startTime: string, endTime: string }[] = []
        
        // Process each day
        Object.entries(weeklySchedule).forEach(([day, slots]) => {
          // Skip days with no slots
          if (!slots.length) return
          
          // Process each time slot for this day
          slots.forEach(slot => {
            // Look for existing slot with same times
            const existingSlot = availability.find(
              a => a.startTime === slot.from && a.endTime === slot.to
            )
            
            if (existingSlot) {
              // Add this day to existing slot with same times
              existingSlot.days.push(day.charAt(0) + day.slice(1).toLowerCase())
            } else {
              // Create new slot
              availability.push({
                days: [day.charAt(0) + day.slice(1).toLowerCase()],
                startTime: slot.from,
                endTime: slot.to
              })
            }
          })
        })
        
        return availability
      }

      // Default to America/New_York if no timezone is provided
      const timeZone = params.timezone || existingSchedule?.timeZone || "America/New_York"

      const scheduleData = {
        name: "Default Schedule",
        timeZone,
        availability: mapWeeklyScheduleToCalAvailability(params.schedule),
        isDefault: true,
        updatedAt: new Date().toISOString() // Required by project rules
      }

      let result;
      if (existingSchedule) {
        // Update existing schedule
        result = await supabase
          .from('CoachingAvailabilitySchedule')
          .update({
            timeZone: scheduleData.timeZone,
            availability: scheduleData.availability,
            updatedAt: scheduleData.updatedAt
          })
          .eq('ulid', existingSchedule.ulid)
      } else {
        // Create new schedule
        result = await supabase
          .from('CoachingAvailabilitySchedule')
          .insert({
            ulid: generateUlid(), // Use generateUlid instead of nanoid
            userUlid: userData.ulid,
            name: scheduleData.name,
            timeZone: scheduleData.timeZone,
            availability: scheduleData.availability,
            isDefault: true,
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
      }

      if (result.error) {
        console.error('[SAVE_AVAILABILITY_ERROR]', {
          error: result.error,
          userUlid: userData.ulid,
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
        // Use the centralized function to update profile completion
        const { updateProfileCompletion } = await import('@/utils/actions/update-profile-completion')
        await updateProfileCompletion(userData.ulid, true) // Force refresh since we just added availability
      } catch (updateError) {
        // Only log the error, don't fail the availability save
        console.error('[UPDATE_PROFILE_COMPLETION_ERROR]', {
          error: updateError,
          userUlid: userData.ulid,
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