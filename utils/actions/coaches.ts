"use server"

import { createAuthClient } from '@/utils/auth'
import { ApiResponse } from '@/utils/types/api'
import { PublicCoach } from '@/utils/types/coach'
import { Database } from '@/types/supabase'

type CoachWithProfile = Database['public']['Tables']['User']['Row'] & {
  CoachProfile: (Database['public']['Tables']['CoachProfile']['Row'] & {
    profileSlug?: string | null
  }) | null
}

export async function getPublicCoaches(): Promise<ApiResponse<PublicCoach[]>> {
  try {
    const supabase = createAuthClient()
    console.log('[GET_PUBLIC_COACHES] Querying Supabase for public coaches...');
    const { data: coaches, error } = await supabase
      .from('User')
      .select(`
        ulid,
        firstName,
        lastName,
        displayName,
        bio,
        profileImageUrl,
        capabilities,
        isCoach,
        CoachProfile (
          slogan,
          coachSkills,
          coachRealEstateDomains,
          coachPrimaryDomain,
          hourlyRate,
          averageRating,
          totalSessions,
          profileSlug
        )
      `)
      .eq('status', 'ACTIVE')
      .order('createdAt', { ascending: false }) as { data: CoachWithProfile[] | null, error: any }
    console.log('[GET_PUBLIC_COACHES] Supabase query result:', { coaches, error });

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
      ?.filter(coach => {
        const profile = Array.isArray(coach.CoachProfile) ? coach.CoachProfile[0] : coach.CoachProfile;
        return profile && profile.profileStatus === 'PUBLISHED';
      })
      .map(coach => {
        const profile = Array.isArray(coach.CoachProfile) ? coach.CoachProfile[0] : coach.CoachProfile;
        return {
          ulid: coach.ulid,
          userUlid: coach.ulid, // Using ulid as userUlid for compatibility
          firstName: coach.firstName,
          lastName: coach.lastName,
          displayName: coach.displayName,
          bio: coach.bio,
          profileImageUrl: coach.profileImageUrl,
          slogan: profile?.slogan || '',
          profileSlug: profile?.profileSlug || null,
          coachSkills: profile?.coachSkills || [],
          coachRealEstateDomains: profile?.coachRealEstateDomains || [],
          coachPrimaryDomain: profile?.coachPrimaryDomain || null,
          hourlyRate: profile?.hourlyRate ?? null,
          averageRating: profile?.averageRating ?? null,
          totalSessions: profile?.totalSessions || 0
        }
      }) || []

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