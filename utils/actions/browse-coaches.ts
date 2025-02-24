'use server'

import { createAuthClient } from '@/utils/auth'
import { BrowseCoachData } from '@/utils/types/browse-coaches'
import { withServerAction } from '@/utils/middleware/withServerAction'

interface DbCoach {
  ulid: string
  userId: string
  firstName: string
  lastName: string
  profileImageUrl: string | null
  bio: string | null
  CoachProfile: {
    ulid: string
    coachingSpecialties: string[]
    hourlyRate: number | null
    yearsCoaching: number | null
    totalSessions: number
    averageRating: number | null
    defaultDuration: number
    minimumDuration: number
    maximumDuration: number
    allowCustomDuration: boolean
    isActive: boolean
    calendlyUrl: string | null
    eventTypeUrl: string | null
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
          userId,
          firstName,
          lastName,
          profileImageUrl,
          bio,
          CoachProfile (
            ulid,
            coachingSpecialties,
            hourlyRate,
            yearsCoaching,
            totalSessions,
            averageRating,
            defaultDuration,
            minimumDuration,
            maximumDuration,
            allowCustomDuration,
            isActive,
            calendlyUrl,
            eventTypeUrl
          )
        `)
        .eq('isCoach', true)
        .eq('status', 'ACTIVE')
        .not('CoachProfile', 'is', null)
        .order('createdAt', { ascending: false })

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

      const transformedCoaches: BrowseCoachData[] = (coaches as unknown as DbCoach[])
        .filter(coach => coach.CoachProfile)
        .map((coach) => ({
          ulid: coach.ulid,
          userId: coach.userId,
          firstName: coach.firstName,
          lastName: coach.lastName,
          profileImageUrl: coach.profileImageUrl,
          bio: coach.bio,
          coachingSpecialties: coach.CoachProfile?.coachingSpecialties || [],
          hourlyRate: coach.CoachProfile?.hourlyRate || null,
          yearsCoaching: coach.CoachProfile?.yearsCoaching || null,
          totalSessions: coach.CoachProfile?.totalSessions || 0,
          averageRating: coach.CoachProfile?.averageRating || null,
          defaultDuration: coach.CoachProfile?.defaultDuration || 60,
          minimumDuration: coach.CoachProfile?.minimumDuration || 30,
          maximumDuration: coach.CoachProfile?.maximumDuration || 90,
          allowCustomDuration: coach.CoachProfile?.allowCustomDuration || false,
          isActive: coach.CoachProfile?.isActive || false,
          calendlyUrl: coach.CoachProfile?.calendlyUrl || null,
          eventTypeUrl: coach.CoachProfile?.eventTypeUrl || null
        }));

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