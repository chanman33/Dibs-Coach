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
          profileSlug
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
        
        // Create basic profiles for coach users without profiles
        const defaultProfiles = coachUsers.map(user => ({
          ulid: crypto.randomUUID(),  // Generate a random UUID for the profile
          userUlid: user.ulid,
          coachSkills: [] as string[],
          coachRealEstateDomains: [] as string[],
          coachPrimaryDomain: null,
          hourlyRate: null,
          yearsCoaching: null,
          totalSessions: 0,
          averageRating: null,
          defaultDuration: 60,
          minimumDuration: 30,
          maximumDuration: 90,
          allowCustomDuration: false,
          isActive: true,
          slogan: null,
          profileStatus: 'DRAFT',
          completionPercentage: 0,
          profileSlug: null
        }));
        
        console.log('[BROWSE_COACHES_CREATED_DEFAULT_PROFILES]', {
          count: defaultProfiles.length,
          timestamp: new Date().toISOString()
        });
        
        // Continue with the default profiles
        const combinedData = defaultProfiles.map(profile => {
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
            CoachProfile: profile
          };
        }).filter(Boolean) as unknown as DbCoach[];
        
        console.log('[BROWSE_COACHES_DEFAULT_COMBINED_DATA]', {
          count: combinedData.length,
          timestamp: new Date().toISOString()
        });
        
        if (combinedData.length === 0) {
          return { data: [], error: null };
        }
        
        // Continue with transformation
        console.log('[BROWSE_COACHES_DEFAULT_TRANSFORM_START]', { 
          coachCount: combinedData.length,
          timestamp: new Date().toISOString()
        });
        
        const transformedCoaches: BrowseCoachData[] = combinedData.map((coach) => ({
          ulid: coach.ulid,
          userId: coach.userId,
          firstName: coach.firstName,
          lastName: coach.lastName,
          profileImageUrl: coach.profileImageUrl,
          bio: coach.bio,
          coachSkills: [],
          coachRealEstateDomains: [],
          coachPrimaryDomain: null,
          hourlyRate: null,
          yearsCoaching: null,
          totalSessions: 0,
          averageRating: null,
          defaultDuration: 60,
          minimumDuration: 30,
          maximumDuration: 90,
          allowCustomDuration: false,
          isActive: true,
          slogan: null,
          profileStatus: 'DRAFT',
          completionPercentage: 0,
          profileSlug: null
        }));
        
        return { data: transformedCoaches, error: null };
      }
      
      // Filter coaches based on active domains
      const activeDomainsArray = Object.entries(ACTIVE_DOMAINS)
        .filter(([_, isActive]) => isActive)
        .map(([domain]) => domain);

      const filteredCoachProfiles = coachProfilesData.filter(profile => {
        // Only include profiles with sufficient completion percentage if they're published
        if (profile.profileStatus === 'PUBLISHED' && (profile.completionPercentage || 0) < 80) {
          console.log('[BROWSE_COACHES_INCOMPLETE_PUBLISHED_PROFILE]', {
            userUlid: profile.userUlid,
            completionPercentage: profile.completionPercentage,
            timestamp: new Date().toISOString()
          });
          return false;
        }
        
        // Exclude profiles with no skills
        if (profile.profileStatus === 'PUBLISHED' && 
            (!profile.coachSkills || !Array.isArray(profile.coachSkills) || profile.coachSkills.length === 0)) {
          console.log('[BROWSE_COACHES_NO_SKILLS_PROFILE]', {
            userUlid: profile.userUlid,
            timestamp: new Date().toISOString()
          });
          return false;
        }
        
        // Check if the coach has any skills in active domains or if their primary domain is active
        return (
          (profile.coachRealEstateDomains && profile.coachRealEstateDomains.some((domain: string) => 
            activeDomainsArray.includes(domain)
          )) || 
          (profile.coachPrimaryDomain && activeDomainsArray.includes(profile.coachPrimaryDomain))
        );
      });

      console.log('[BROWSE_COACHES_FILTERED_PROFILES]', {
        totalProfiles: coachProfilesData.length,
        activeProfiles: filteredCoachProfiles.length,
        activeDomainsArray,
        timestamp: new Date().toISOString()
      });
      
      // Combine user data with coach profile data
      const combinedData = filteredCoachProfiles.map(profile => {
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
            coachSkills: profile.coachSkills,
            coachRealEstateDomains: profile.coachRealEstateDomains,
            coachPrimaryDomain: profile.coachPrimaryDomain,
            hourlyRate: profile.hourlyRate,
            yearsCoaching: profile.yearsCoaching,
            totalSessions: profile.totalSessions,
            averageRating: profile.averageRating,
            defaultDuration: profile.defaultDuration,
            minimumDuration: profile.minimumDuration,
            maximumDuration: profile.maximumDuration,
            allowCustomDuration: profile.allowCustomDuration,
            isActive: profile.isActive,
            slogan: profile.slogan,
            profileStatus: profile.profileStatus,
            completionPercentage: profile.completionPercentage,
            profileSlug: profile.profileSlug
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
        .map((coach) => {
          // Always create a transformed coach even if coach profile is missing
          return {
            ulid: coach.ulid,
            userId: coach.userId,
            firstName: coach.firstName,
            lastName: coach.lastName,
            profileImageUrl: coach.profileImageUrl,
            bio: coach.bio,
            coachSkills: coach.CoachProfile?.coachSkills || [],
            coachRealEstateDomains: (coach.CoachProfile?.coachRealEstateDomains || []) as RealEstateDomain[],
            coachPrimaryDomain: coach.CoachProfile?.coachPrimaryDomain as RealEstateDomain | null,
            hourlyRate: coach.CoachProfile?.hourlyRate || null,
            yearsCoaching: coach.CoachProfile?.yearsCoaching || null,
            totalSessions: coach.CoachProfile?.totalSessions || 0,
            averageRating: coach.CoachProfile?.averageRating || null,
            defaultDuration: coach.CoachProfile?.defaultDuration || 60,
            minimumDuration: coach.CoachProfile?.minimumDuration || 30,
            maximumDuration: coach.CoachProfile?.maximumDuration || 90,
            allowCustomDuration: coach.CoachProfile?.allowCustomDuration || false,
            isActive: coach.CoachProfile?.isActive ?? true,
            slogan: coach.CoachProfile?.slogan || null,
            profileStatus: coach.CoachProfile?.profileStatus || 'DRAFT',
            completionPercentage: coach.CoachProfile?.completionPercentage || 0,
            profileSlug: coach.CoachProfile?.profileSlug || null
          };
        });

      console.log('[BROWSE_COACHES_TRANSFORM_COMPLETE]', { 
        transformedCount: transformedCoaches.length,
        timestamp: new Date().toISOString()
      });

      console.log('[BROWSE_COACHES_PUBLISHED_PROFILES]', {
        publishedCount: coachProfilesData?.length || 0,
        unpublishedCoachUsers: coachUsers.length - (coachProfilesData?.length || 0),
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