"use server"

import { createAuthClient } from '@/utils/auth'
import { ApiResponse } from '@/utils/types/api'
import { PublicCoach } from '@/utils/types/coach'
import { Database } from '@/types/supabase'

type CoachWithProfile = Database['public']['Tables']['User']['Row'] & {
  CoachProfile: Database['public']['Tables']['CoachProfile']['Row'] | null
}

export async function getPublicCoaches(): Promise<ApiResponse<PublicCoach[]>> {
  try {
    const supabase = createAuthClient()
    
    const { data: coaches, error } = await supabase
      .from('User')
      .select(`
        ulid,
        firstName,
        lastName,
        displayName,
        bio,
        profileImageUrl,
        CoachProfile (
          slogan,
          coachSkills,
          coachRealEstateDomains,
          coachPrimaryDomain,
          hourlyRate,
          averageRating,
          totalSessions
        )
      `)
      .eq('isCoach', true)
      .eq('status', 'ACTIVE')
      .order('createdAt', { ascending: false }) as { data: CoachWithProfile[] | null, error: any }

    if (error) {
      console.error('[GET_PUBLIC_COACHES_ERROR]', error)
      return { 
        data: null, 
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch coaches'
        }
      }
    }

    const publicCoaches = coaches
      ?.filter(coach => coach.CoachProfile)
      .map(coach => ({
        ulid: coach.ulid,
        userUlid: coach.ulid, // Using ulid as userUlid for compatibility
        firstName: coach.firstName,
        lastName: coach.lastName,
        displayName: coach.displayName,
        bio: coach.bio,
        profileImageUrl: coach.profileImageUrl,
        slogan: coach.CoachProfile?.slogan || null,
        coachSkills: coach.CoachProfile?.coachSkills || [],
        coachRealEstateDomains: coach.CoachProfile?.coachRealEstateDomains || [],
        coachPrimaryDomain: coach.CoachProfile?.coachPrimaryDomain || null,
        hourlyRate: coach.CoachProfile?.hourlyRate ?? null,
        averageRating: coach.CoachProfile?.averageRating ?? null,
        totalSessions: coach.CoachProfile?.totalSessions || 0
      })) || []

    return { data: publicCoaches, error: null }
  } catch (error) {
    console.error('[GET_PUBLIC_COACHES_ERROR]', error)
    return { 
      data: null, 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch coaches'
      }
    }
  }
} 