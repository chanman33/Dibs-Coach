'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { WeekDay, TimeSlot } from '@/utils/types/coaching'

// New function to fetch coach availability schedule
export async function fetchCoachAvailability() {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get user's database ID
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single()

    if (userError || !user) {
      throw new Error('User not found')
    }

    // Get availability schedule - don't use .single() since it might not exist
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('CoachingAvailabilitySchedule')
      .select('rules')
      .eq('userDbId', user.id)
      .eq('isDefault', true)
      .maybeSingle() // Use maybeSingle() instead of single() to handle non-existent case

    // If there's an error that's not just "no data found", throw it
    if (scheduleError && scheduleError.code !== 'PGRST116') {
      console.error('[FETCH_AVAILABILITY_ERROR]', scheduleError)
      throw scheduleError
    }

    // Return the schedule if it exists, otherwise return null
    // This is an expected case for new coaches
    return scheduleData?.rules?.weeklySchedule || null
  } catch (error) {
    console.error('[FETCH_AVAILABILITY_ERROR]', error)
    throw error
  }
}

export async function saveCoachAvailability(schedule: Record<WeekDay, TimeSlot[]>) {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get user's database ID
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single()

    if (userError || !user) {
      throw new Error('User not found')
    }

    // First, check if user has any existing schedules
    const { data: existingSchedule, error: scheduleError } = await supabase
      .from('CoachingAvailabilitySchedule')
      .select('id')
      .eq('userDbId', user.id)
      .eq('isDefault', true)
      .single()

    if (scheduleError && scheduleError.code !== 'PGRST116') {
      throw scheduleError
    }

    // If schedule exists, update it. Otherwise, create new one.
    const scheduleData = {
      userDbId: user.id,
      name: 'Default Schedule',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isDefault: true,
      active: true,
      rules: {
        weeklySchedule: schedule,
        breaks: []
      },
      updatedAt: new Date().toISOString()
    }

    let result
    if (existingSchedule) {
      // Update existing schedule
      result = await supabase
        .from('CoachingAvailabilitySchedule')
        .update(scheduleData)
        .eq('id', existingSchedule.id)
        .select()
    } else {
      // Create new schedule
      result = await supabase
        .from('CoachingAvailabilitySchedule')
        .insert({
          ...scheduleData,
          createdAt: new Date().toISOString()
        })
        .select()
    }

    if (result.error) {
      throw result.error
    }

    return { success: true }
  } catch (error) {
    console.error('[SAVE_AVAILABILITY_ERROR]', error)
    throw error
  }
}

// New function to fetch availability for calendar display
export async function fetchCoachAvailabilityForCalendar(coachDbId: number) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the most recently updated active default schedule
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('CoachingAvailabilitySchedule')
      .select('rules, timezone')
      .eq('userDbId', coachDbId)
      .eq('isDefault', true)
      .eq('active', true)
      .order('updatedAt', { ascending: false })
      .limit(1)
      .single()

    if (scheduleError) {
      console.error('[FETCH_CALENDAR_AVAILABILITY_ERROR]', scheduleError)
      throw scheduleError
    }

    return scheduleData || null
  } catch (error) {
    console.error('[FETCH_CALENDAR_AVAILABILITY_ERROR]', error)
    throw error
  }
} 