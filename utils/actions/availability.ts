"use server"

import { createAuthClient } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { ApiResponse } from '@/utils/types/api'
import { 
  WeekDay, 
  TimeSlot,
  CoachingScheduleSchema,
  AvailabilityRules
} from '@/utils/types/coaching'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { z } from 'zod'

// Response types
interface AvailabilitySchedule {
  ulid: string
  userUlid: string
  name: string
  timezone: string
  rules: AvailabilityRules
  isDefault: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

interface AvailabilityResponse {
  schedule: Record<WeekDay, TimeSlot[]>
  timezone: string
}

interface BookedSession {
  ulid: string
  startTime: string
  endTime: string
  coachUlid: string
  menteeUlid: string
  status: 'scheduled' | 'completed' | 'canceled'
  createdAt: string
}

// Validation schemas
const SaveAvailabilitySchema = z.object({
  schedule: z.record(WeekDay, z.array(TimeSlot))
})

// Fetch coach availability schedule
export const fetchCoachAvailability = withServerAction<AvailabilityResponse | null>(
  async (_, { userUlid, roleContext }) => {
    try {
      // Verify coach role
      if (!roleContext.capabilities.includes(USER_CAPABILITIES.COACH)) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only coaches can access availability schedules'
          }
        }
      }

      const supabase = await createAuthClient()

      // Get availability schedule
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('CoachingAvailabilitySchedule')
        .select('ulid, userUlid, name, timezone, rules, isDefault, active, createdAt, updatedAt')
        .eq('userUlid', userUlid)
        .eq('isDefault', true)
        .maybeSingle()

      if (scheduleError) {
        console.error('[FETCH_AVAILABILITY_ERROR]', { 
          userUlid, 
          error: scheduleError,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch availability schedule'
          }
        }
      }

      // If no schedule exists, return null
      if (!scheduleData) {
        return {
          data: null,
          error: null
        }
      }

      // Transform the data into the expected format
      const weeklySchedule = scheduleData.rules?.weeklySchedule || {}
      
      // Ensure all days have an array, even if empty
      const transformedSchedule = Object.keys(WeekDay).reduce((acc, day) => {
        acc[day as WeekDay] = Array.isArray(weeklySchedule[day as WeekDay]) 
          ? weeklySchedule[day as WeekDay] 
          : []
        return acc
      }, {} as Record<WeekDay, TimeSlot[]>)

      return {
        data: {
          schedule: transformedSchedule,
          timezone: scheduleData.timezone
        },
        error: null
      }
    } catch (error) {
      console.error('[FETCH_AVAILABILITY_ERROR]', {
        error,
        userUlid,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)

// Save coach availability schedule
export const saveCoachAvailability = withServerAction<{ success: true }, z.infer<typeof SaveAvailabilitySchema>>(
  async (params, { userUlid, roleContext }) => {
    try {
      // Verify coach role
      if (!roleContext.capabilities.includes(USER_CAPABILITIES.COACH)) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only coaches can update availability schedules'
          }
        }
      }

      // Validate parameters
      const validatedData = SaveAvailabilitySchema.parse(params)
      
      const supabase = await createAuthClient()

      // Check for existing schedule
      const { data: existingSchedule, error: scheduleError } = await supabase
        .from('CoachingAvailabilitySchedule')
        .select('ulid')
        .eq('userUlid', userUlid)
        .eq('isDefault', true)
        .single()

      if (scheduleError && scheduleError.code !== 'PGRST116') {
        console.error('[SAVE_AVAILABILITY_ERROR]', { 
          userUlid, 
          error: scheduleError,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to check existing schedule'
          }
        }
      }

      // Prepare schedule data
      const scheduleData = {
        userUlid,
        name: 'Default Schedule',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isDefault: true,
        active: true,
        rules: {
          weeklySchedule: validatedData.schedule,
          breaks: []
        },
        updatedAt: new Date().toISOString()
      }

      // Update or create schedule
      const operation = existingSchedule
        ? supabase
            .from('CoachingAvailabilitySchedule')
            .update(scheduleData)
            .eq('ulid', existingSchedule.ulid)
        : supabase
            .from('CoachingAvailabilitySchedule')
            .insert({
              ...scheduleData,
              createdAt: new Date().toISOString()
            })

      const { error: saveError } = await operation

      if (saveError) {
        console.error('[SAVE_AVAILABILITY_ERROR]', {
          userUlid,
          error: saveError,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to save availability schedule'
          }
        }
      }

      return {
        data: { success: true },
        error: null
      }
    } catch (error) {
      console.error('[SAVE_AVAILABILITY_ERROR]', {
        error,
        userUlid,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid schedule data',
            details: error.flatten()
          }
        }
      }
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
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
        .from('CoachingSession')
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