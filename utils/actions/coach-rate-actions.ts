import { createAuthClient } from '@/utils/supabase/server'
import { ApiResponse } from '@/utils/types/api'
import { withServerAction } from '@/utils/middleware/withServerAction'

// Response type for the hourly rate
export interface CoachHourlyRateResponse {
  hourlyRate: number | null
  isValid: boolean // Helper to check if rate is valid (exists and > 0)
}

/**
 * Fetches a coach's hourly rate from their profile
 * Used by Cal.com related actions to validate and calculate session prices
 */
export const fetchCoachHourlyRate = withServerAction<CoachHourlyRateResponse>(
  async (_, { userUlid }) => {
    try {
      console.log('[FETCH_COACH_HOURLY_RATE_START]', {
        userUlid,
        timestamp: new Date().toISOString()
      })

      // Validate that userUlid is defined
      if (!userUlid) {
        return {
          data: null,
          error: {
            code: 'AUTH_ERROR',
            message: 'User ID is required'
          }
        }
      }

      const supabase = createAuthClient()

      const { data: coachProfile, error } = await supabase
        .from('CoachProfile')
        .select('hourlyRate')
        .eq('userUlid', userUlid)
        .maybeSingle()

      if (error) {
        console.error('[FETCH_COACH_HOURLY_RATE_ERROR]', {
          error,
          userUlid,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch coach hourly rate',
            details: error
          }
        }
      }

      // If no profile found, return null rate
      if (!coachProfile) {
        return {
          data: {
            hourlyRate: null,
            isValid: false
          },
          error: null
        }
      }

      const hourlyRate = coachProfile.hourlyRate as number | null
      const isValid = hourlyRate !== null && hourlyRate > 0

      return {
        data: {
          hourlyRate,
          isValid
        },
        error: null
      }

    } catch (error) {
      console.error('[FETCH_COACH_HOURLY_RATE_ERROR]', {
        error,
        userUlid,
        timestamp: new Date().toISOString()
      })
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while fetching coach hourly rate',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
) 