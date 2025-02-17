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
import { ROLES } from '@/utils/roles/roles'
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

// Validation schemas
const SaveAvailabilitySchema = z.object({
  schedule: z.record(WeekDay, z.array(TimeSlot))
})

// Fetch coach availability schedule
export const fetchCoachAvailability = withServerAction<AvailabilitySchedule | null>(
  async (_, { userUlid, role }) => {
    try {
      if (role !== ROLES.COACH) {
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
        .select('*')
        .eq('userUlid', userUlid)
        .eq('isDefault', true)
        .maybeSingle()

      if (scheduleError) {
        console.error('[FETCH_AVAILABILITY_ERROR]', { userUlid, error: scheduleError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch availability schedule'
          }
        }
      }

      return {
        data: scheduleData,
        error: null
      }
    } catch (error) {
      console.error('[FETCH_AVAILABILITY_ERROR]', error)
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
  async (params, { userUlid, role }) => {
    try {
      if (role !== ROLES.COACH) {
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
        console.error('[SAVE_AVAILABILITY_ERROR] Schedule check failed:', { userUlid, error: scheduleError })
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
        console.error('[SAVE_AVAILABILITY_ERROR] Save operation failed:', { userUlid, error: saveError })
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
      console.error('[SAVE_AVAILABILITY_ERROR]', error)
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

// Fetch coach availability for calendar
export const fetchCoachAvailabilityForCalendar = withServerAction<AvailabilitySchedule | null>(
  async (params: { coachUlid: string }, { role }) => {
    try {
      const supabase = await createAuthClient()

      // Get the most recently updated active default schedule
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('CoachingAvailabilitySchedule')
        .select('*')
        .eq('userUlid', params.coachUlid)
        .eq('isDefault', true)
        .eq('active', true)
        .order('updatedAt', { ascending: false })
        .limit(1)
        .single()

      if (scheduleError) {
        console.error('[FETCH_CALENDAR_AVAILABILITY_ERROR]', { coachUlid: params.coachUlid, error: scheduleError })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch availability schedule'
          }
        }
      }

      return {
        data: scheduleData,
        error: null
      }
    } catch (error) {
      console.error('[FETCH_CALENDAR_AVAILABILITY_ERROR]', error)
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