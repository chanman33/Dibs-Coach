'use server'

import { createAuthClient } from '@/utils/auth'
import { BrowseCoachData } from '@/utils/types/browse-coaches'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { RealEstateDomain } from '@/utils/types/coach'

/**
 * Fetches coaches that the user has had past sessions with or has future bookings with
 */
export const fetchBookedCoaches = withServerAction<BrowseCoachData[]>(
  async (_, { userUlid, roleContext }) => {
    console.log('[FETCH_BOOKED_COACHES_START]', { 
      userUlid, 
      capabilities: roleContext.capabilities,
      timestamp: new Date().toISOString() 
    });
    
    // Early return if userUlid is undefined
    if (!userUlid) {
      console.log('[FETCH_BOOKED_COACHES_NO_USER_ID]', {
        timestamp: new Date().toISOString()
      });
      return { data: [], error: null };
    }
    
    try {
      const supabase = await createAuthClient();
      
      // Determine which side of the relationship to query based on the user's role
      let coachUlids: string[] = [];
      
      if (roleContext.capabilities.includes(USER_CAPABILITIES.MENTEE)) {
        // If user is a mentee, find all coaches they've had sessions with
        const { data: sessions, error: sessionsError } = await supabase
          .from('Session')
          .select('coachUlid')
          .eq('menteeUlid', userUlid)
          .not('status', 'eq', 'CANCELLED')
          .order('startTime', { ascending: false });
        
        if (sessionsError) {
          console.error('[FETCH_BOOKED_COACHES_ERROR]', { 
            error: sessionsError,
            context: 'mentee-sessions-query',
            userUlid,
            timestamp: new Date().toISOString()
          });
          return {
            data: [],
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to fetch session data',
              details: sessionsError
            }
          };
        }
        
        // Extract unique coach ULIDs
        coachUlids = Array.from(new Set(sessions?.map(s => s.coachUlid) || []));
        console.log('[FETCH_BOOKED_COACHES_MENTEE]', { 
          sessionCount: sessions?.length || 0,
          uniqueCoachCount: coachUlids.length,
          timestamp: new Date().toISOString()
        });
      } else if (roleContext.capabilities.includes(USER_CAPABILITIES.COACH)) {
        // If user is a coach, find all mentees they've had sessions with
        const { data: sessions, error: sessionsError } = await supabase
          .from('Session')
          .select('menteeUlid')
          .eq('coachUlid', userUlid)
          .not('status', 'eq', 'CANCELLED')
          .order('startTime', { ascending: false });
        
        if (sessionsError) {
          console.error('[FETCH_BOOKED_COACHES_ERROR]', { 
            error: sessionsError,
            context: 'coach-sessions-query',
            userUlid,
            timestamp: new Date().toISOString()
          });
          return {
            data: [],
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to fetch session data',
              details: sessionsError
            }
          };
        }
        
        // For coaches, we would need to get other coaches that their mentees have booked
        // This is a more complex query, so for simplicity we'll return empty for now
        // A full implementation would need to fetch coach profiles for mentees' other coaches
        console.log('[FETCH_BOOKED_COACHES_COACH]', { 
          sessionCount: sessions?.length || 0,
          timestamp: new Date().toISOString(),
          message: 'Coach role has no direct booked coaches to display'
        });
        
        // Return empty array for coaches
        return { data: [], error: null };
      } else {
        // User is neither a coach nor a mentee
        console.log('[FETCH_BOOKED_COACHES_INVALID_ROLE]', { 
          capabilities: roleContext.capabilities,
          userUlid,
          timestamp: new Date().toISOString()
        });
        return { data: [], error: null };
      }
      
      // If we have no coach ULIDs, return empty array
      if (coachUlids.length === 0) {
        console.log('[FETCH_BOOKED_COACHES_NO_COACHES]', {
          userUlid,
          timestamp: new Date().toISOString()
        });
        return { data: [], error: null };
      }
      
      // Fetch coach profiles for the coach ULIDs
      const { data: coachProfilesWithUsers, error: coachesError } = await supabase
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
        .in('userUlid', coachUlids)
        .eq('isActive', true)
        .eq('profileStatus', 'PUBLISHED');
      
      if (coachesError) {
        console.error('[FETCH_BOOKED_COACHES_ERROR]', { 
          error: coachesError,
          context: 'coach-profiles-query',
          coachUlids,
          userUlid,
          timestamp: new Date().toISOString()
        });
        return {
          data: [],
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch coach profiles',
            details: coachesError
          }
        };
      }
      
      console.log('[FETCH_BOOKED_COACHES_SUCCESS]', { 
        coachCount: coachProfilesWithUsers?.length || 0,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      // Transform data into expected format
      const transformedCoaches: BrowseCoachData[] = (coachProfilesWithUsers || [])
        .filter(profile => profile.User && profile.User.status === 'ACTIVE')
        .map((profile) => {
          const user = profile.User;
          
          return {
            ulid: user.ulid,
            userId: user.userId,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
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
        });
      
      return { data: transformedCoaches, error: null };
    } catch (error) {
      console.error('[FETCH_BOOKED_COACHES_ERROR]', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: [],
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      };
    }
  }
); 