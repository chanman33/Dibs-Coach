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
  capabilities: string[]
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
    console.log('[BROWSE_COACHES_START]', { userUlid, timestamp: new Date().toISOString() });
    
    try {
      const supabase = await createAuthClient()
      console.log('[BROWSE_COACHES_AUTH_CLIENT_CREATED]');
      
      // First, let's log the capabilities to understand what's in the database
      const { data: userCapabilities, error: capabilitiesError } = await supabase
        .from('User')
        .select('ulid, capabilities, isCoach')
        .limit(10);
        
      console.log('[BROWSE_COACHES_CAPABILITIES_CHECK]', {
        users: userCapabilities?.map(user => ({
          ulid: user.ulid,
          capabilities: user.capabilities,
          isCoach: user.isCoach
        })),
        error: capabilitiesError,
        timestamp: new Date().toISOString()
      });
      
      // Let's also check if there are any CoachProfile records
      const { data: coachProfiles, error: profilesError } = await supabase
        .from('CoachProfile')
        .select('ulid, userUlid')
        .limit(10);
        
      console.log('[BROWSE_COACHES_PROFILES_CHECK]', {
        profiles: coachProfiles,
        error: profilesError,
        timestamp: new Date().toISOString()
      });
      
      console.log('[BROWSE_COACHES_QUERY_START]', { 
        table: 'User',
        filters: { capabilities: 'COACH', status: 'ACTIVE' },
        joins: ['CoachProfile'],
        timestamp: new Date().toISOString()
      });
      
      // Try a different approach - first get all active users
      const { data: activeUsers, error: activeUsersError } = await supabase
        .from('User')
        .select(`
          ulid,
          userId,
          firstName,
          lastName,
          profileImageUrl,
          bio,
          capabilities,
          isCoach
        `)
        .eq('status', 'ACTIVE');
        
      console.log('[BROWSE_COACHES_ACTIVE_USERS]', {
        count: activeUsers?.length || 0,
        error: activeUsersError,
        timestamp: new Date().toISOString()
      });
      
      // Filter users with COACH capability
      const coachUsers = activeUsers?.filter(user => 
        (Array.isArray(user.capabilities) && user.capabilities.includes('COACH')) || 
        user.isCoach === true
      ) || [];
      
      console.log('[BROWSE_COACHES_COACH_USERS]', {
        count: coachUsers.length,
        users: coachUsers.map(u => ({ ulid: u.ulid, capabilities: u.capabilities, isCoach: u.isCoach })),
        timestamp: new Date().toISOString()
      });
      
      if (coachUsers.length === 0) {
        console.log('[BROWSE_COACHES_NO_COACH_USERS]', {
          timestamp: new Date().toISOString()
        });
        return { data: [], error: null };
      }
      
      // Now get coach profiles for these users
      const { data: coachProfilesData, error: coachProfilesError } = await supabase
        .from('CoachProfile')
        .select(`
          ulid,
          userUlid,
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
        `)
        .in('userUlid', coachUsers.map(u => u.ulid));
        
      console.log('[BROWSE_COACHES_COACH_PROFILES]', {
        count: coachProfilesData?.length || 0,
        error: coachProfilesError,
        timestamp: new Date().toISOString()
      });
      
      if (!coachProfilesData || coachProfilesData.length === 0) {
        console.log('[BROWSE_COACHES_NO_COACH_PROFILES]', {
          timestamp: new Date().toISOString()
        });
        return { data: [], error: null };
      }
      
      // Combine user data with coach profile data
      const combinedData = coachProfilesData.map(profile => {
        const user = coachUsers.find(u => u.ulid === profile.userUlid);
        if (!user) return null;
        
        return {
          ulid: user.ulid,
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          bio: user.bio,
          capabilities: user.capabilities,
          CoachProfile: {
            ulid: profile.ulid,
            coachingSpecialties: profile.coachingSpecialties,
            hourlyRate: profile.hourlyRate,
            yearsCoaching: profile.yearsCoaching,
            totalSessions: profile.totalSessions,
            averageRating: profile.averageRating,
            defaultDuration: profile.defaultDuration,
            minimumDuration: profile.minimumDuration,
            maximumDuration: profile.maximumDuration,
            allowCustomDuration: profile.allowCustomDuration,
            isActive: profile.isActive,
            calendlyUrl: profile.calendlyUrl,
            eventTypeUrl: profile.eventTypeUrl
          }
        };
      }).filter(Boolean) as DbCoach[];
      
      console.log('[BROWSE_COACHES_COMBINED_DATA]', {
        count: combinedData.length,
        timestamp: new Date().toISOString()
      });

      if (combinedData.length === 0) {
        console.log('[BROWSE_COACHES_NO_COMBINED_DATA]', {
          timestamp: new Date().toISOString()
        });
        return { data: [], error: null };
      }

      console.log('[BROWSE_COACHES_TRANSFORM_START]', { 
        coachCount: combinedData.length,
        timestamp: new Date().toISOString()
      });

      const transformedCoaches: BrowseCoachData[] = combinedData
        .filter(coach => {
          const hasCoachProfile = !!coach.CoachProfile;
          if (!hasCoachProfile) {
            console.log('[BROWSE_COACHES_MISSING_PROFILE]', { 
              coachUlid: coach.ulid,
              timestamp: new Date().toISOString()
            });
          }
          return hasCoachProfile;
        })
        .map((coach) => {
          const transformedCoach = {
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
          };
          
          // Log incomplete profiles to help identify data quality issues
          const incompleteFields = [];
          if (!transformedCoach.firstName || !transformedCoach.lastName) incompleteFields.push('name');
          if (!transformedCoach.bio) incompleteFields.push('bio');
          if (!transformedCoach.profileImageUrl) incompleteFields.push('profileImage');
          if (!transformedCoach.coachingSpecialties.length) incompleteFields.push('specialties');
          if (!transformedCoach.hourlyRate) incompleteFields.push('hourlyRate');
          
          if (incompleteFields.length > 0) {
            console.log('[BROWSE_COACHES_INCOMPLETE_PROFILE]', {
              coachUlid: coach.ulid,
              incompleteFields,
              timestamp: new Date().toISOString()
            });
          }
          
          return transformedCoach;
        });

      console.log('[BROWSE_COACHES_TRANSFORM_COMPLETE]', { 
        transformedCount: transformedCoaches.length,
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