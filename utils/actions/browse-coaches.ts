'use server'

import { createAuthClient } from '@/utils/auth'
import { BrowseCoachData } from '@/utils/types/browse-coaches'
import { withServerAction } from '@/utils/middleware/withServerAction'

interface DbCoach {
  ulid: string
  firstName: string
  lastName: string
  email: string
  profileImageUrl: string | null
  CoachProfile: {
    hourlyRate: number | null
  } | null
}

export const fetchCoaches = withServerAction<BrowseCoachData[]>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()
      
      const { data: coaches, error } = await supabase
        .from('User')
        .select(`
          ulid,
          firstName,
          lastName,
          email,
          profileImageUrl,
          CoachProfile (
            hourlyRate
          )
        `)
        .eq('isCoach', true)
        .eq('status', 'ACTIVE')
        .not('CoachProfile', 'is', null)

      if (error) {
        console.error('[BROWSE_COACHES_ERROR]', { userUlid, error })
        return {
          data: [],
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch coaches'
          }
        }
      }

      if (!coaches || coaches.length === 0) {
        return { data: [], error: null }
      }

      const transformedCoaches: BrowseCoachData[] = (coaches as unknown as DbCoach[]).map((coach) => ({
        id: parseInt(coach.ulid),
        firstName: coach.firstName,
        lastName: coach.lastName,
        email: coach.email,
        profileImageUrl: coach.profileImageUrl,
        bio: null,
        specialties: [], // Default empty array since specialties field doesn't exist yet
        hourlyRate: coach.CoachProfile?.hourlyRate || 0,
        rating: null,
        totalSessions: 0,
        isAvailable: true // Default to true since isAvailable field doesn't exist yet
      }))

      return { 
        data: transformedCoaches, 
        error: null 
      }

    } catch (error) {
      console.error('[BROWSE_COACHES_ERROR]', error)
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