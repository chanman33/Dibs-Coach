'use server'

import { createAuthClient } from '@/utils/auth'
import { BrowseCoachData } from '@/utils/types/browse-coaches'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { ACTIVE_DOMAINS, REAL_ESTATE_DOMAINS, RealEstateDomain } from '@/utils/types/coach'
import crypto from 'crypto'

interface DbCoach {
  ulid: string
  userId: string
  firstName: string
  lastName: string
  profileImageUrl: string | null
  bio: string | null
  capabilities: string[]
  CoachProfile: {
    ulid: string
    coachSkills: string[]
    coachRealEstateDomains: string[]
    coachPrimaryDomain: string | null
    hourlyRate: number | null
    yearsCoaching: number | null
    totalSessions: number
    averageRating: number | null
    defaultDuration: number
    minimumDuration: number
    maximumDuration: number
    allowCustomDuration: boolean
    isActive: boolean
    slogan: string | null
    profileStatus: string
    completionPercentage: number
    profileSlug: string | null
  } | null
}

export const fetchCoaches = withServerAction<BrowseCoachData[]>(
  async (_, { userUlid }) => {
    console.log('[BROWSE_COACHES_START]', { userUlid, timestamp: new Date().toISOString() });
    
    try {
      const supabase = await createAuthClient()
      console.log('[BROWSE_COACHES_AUTH_CLIENT_CREATED]');
      
      // Directly query CoachProfiles with User join in a single efficient query
      console.log('[BROWSE_COACHES_QUERY_START]', { 
        table: 'CoachProfile',
        filters: { isActive: true },
        joins: ['User'],
        timestamp: new Date().toISOString()
      });
      
      const { data: coachProfilesWithUsers, error: queryError } = await supabase
        .from('CoachProfile')
        .select(`
          ulid,
          userUlid,
          coachSkills,
          coachRealEstateDomains,
          coachPrimaryDomain,
          hourlyRate,
          yearsCoaching,
          totalSessions,
          averageRating,
          defaultDuration,
          minimumDuration,
          maximumDuration,
          allowCustomDuration,
          isActive,
          profileStatus,
          slogan,
          completionPercentage,
          profileSlug,
          User (
            ulid,
            userId,
            firstName,
            lastName,
            profileImageUrl,
            bio,
            capabilities,
            isCoach,
            status
          )
        `)
        .eq('isActive', true)
        .eq('profileStatus', 'PUBLISHED')
        .eq('User.status', 'ACTIVE');
        
      console.log('[BROWSE_COACHES_QUERY_COMPLETE]', {
        count: coachProfilesWithUsers?.length || 0,
        error: queryError,
        timestamp: new Date().toISOString()
      });
      
      if (queryError) {
        console.error('[BROWSE_COACHES_QUERY_ERROR]', {
          error: queryError,
          timestamp: new Date().toISOString()
        });
        return {
          data: [],
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch coaches',
            details: queryError
          }
        };
      }
      
      if (!coachProfilesWithUsers || coachProfilesWithUsers.length === 0) {
        console.log('[BROWSE_COACHES_NO_COACHES]', {
          timestamp: new Date().toISOString()
        });
        return { data: [], error: null };
      }
      
      // Get active domains for UI purposes only
      const activeDomainsArray = Object.entries(ACTIVE_DOMAINS)
        .filter(([_, isActive]) => isActive)
        .map(([domain]) => domain);
      
      console.log('[BROWSE_COACHES_TRANSFORM_START]', { 
        coachCount: coachProfilesWithUsers.length,
        timestamp: new Date().toISOString()
      });
      
      // Transform data into expected format
      const transformedCoaches: BrowseCoachData[] = coachProfilesWithUsers
        .map((profile) => {
          const user = profile.User;
          
          // Skip if user is not found or not active
          if (!user || user.status !== 'ACTIVE') return null;
          
          return {
            ulid: user.ulid,
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
            bio: user.bio,
            coachSkills: profile.coachSkills || [],
            coachRealEstateDomains: (profile.coachRealEstateDomains || []) as RealEstateDomain[],
            coachPrimaryDomain: profile.coachPrimaryDomain as RealEstateDomain | null,
            hourlyRate: profile.hourlyRate || null,
            yearsCoaching: profile.yearsCoaching || null,
            totalSessions: profile.totalSessions || 0,
            averageRating: profile.averageRating || null,
            defaultDuration: profile.defaultDuration || 60,
            minimumDuration: profile.minimumDuration || 30,
            maximumDuration: profile.maximumDuration || 90,
            allowCustomDuration: profile.allowCustomDuration || false,
            isActive: profile.isActive ?? true,
            slogan: profile.slogan || null,
            profileStatus: profile.profileStatus || 'DRAFT',
            completionPercentage: profile.completionPercentage || 0,
            profileSlug: profile.profileSlug || null
          };
        })
        .filter(Boolean) as BrowseCoachData[];
      
      console.log('[BROWSE_COACHES_TRANSFORM_COMPLETE]', { 
        transformedCount: transformedCoaches.length,
        timestamp: new Date().toISOString()
      });
      
      console.log('[BROWSE_COACHES_PUBLISHED_COUNT]', {
        publishedCount: transformedCoaches.filter(c => c.profileStatus === 'PUBLISHED').length,
        totalCount: transformedCoaches.length,
        timestamp: new Date().toISOString()
      });

      return { 
        data: transformedCoaches, 
        error: null 
      }

    } catch (error) {
      console.error('[BROWSE_COACHES_ERROR]', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
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