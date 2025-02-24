import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { PublicCoach } from '@/utils/types/coach'

export function usePublicCoaches() {
  const [coaches, setCoaches] = useState<PublicCoach[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true
    console.log('[PUBLIC_COACHES_FETCH_START]', {
      timestamp: new Date().toISOString()
    });

    async function fetchCoaches() {
      try {
        // First, let's check a few users to understand the capabilities structure
        console.log('[PUBLIC_COACHES_CAPABILITIES_CHECK_START]');
        const { data: userCapabilities, error: capabilitiesError } = await supabase
          .from('User')
          .select('ulid, capabilities, isCoach')
          .limit(10);
          
        console.log('[PUBLIC_COACHES_CAPABILITIES_CHECK]', {
          users: userCapabilities?.map(user => ({
            ulid: user.ulid,
            capabilities: user.capabilities,
            isCoach: user.isCoach
          })),
          error: capabilitiesError,
          timestamp: new Date().toISOString()
        });

        // First get active users with COACH capability
        console.log('[PUBLIC_COACHES_USERS_QUERY_START]');
        const { data: activeUsers, error: activeUsersError } = await supabase
          .from('User')
          .select(`
            ulid,
            firstName,
            lastName,
            displayName,
            profileImageUrl,
            bio,
            capabilities,
            isCoach
          `)
          .eq('status', 'ACTIVE');
          
        if (activeUsersError) {
          console.error('[PUBLIC_COACHES_USERS_QUERY_ERROR]', {
            error: activeUsersError,
            timestamp: new Date().toISOString()
          });
          throw activeUsersError;
        }
        
        console.log('[PUBLIC_COACHES_USERS_QUERY_COMPLETE]', {
          count: activeUsers?.length || 0,
          timestamp: new Date().toISOString()
        });
        
        // Filter users with COACH capability
        const coachUsers = activeUsers?.filter(user => 
          (Array.isArray(user.capabilities) && user.capabilities.includes('COACH')) || 
          user.isCoach === true
        ) || [];
        
        console.log('[PUBLIC_COACHES_COACH_USERS]', {
          count: coachUsers.length,
          users: coachUsers.map(u => ({ 
            ulid: u.ulid, 
            capabilities: u.capabilities, 
            isCoach: u.isCoach 
          })),
          timestamp: new Date().toISOString()
        });
        
        if (coachUsers.length === 0) {
          console.log('[PUBLIC_COACHES_NO_COACH_USERS]', {
            timestamp: new Date().toISOString()
          });
          setCoaches([]);
          return;
        }
        
        // Now get coach profiles for these users
        console.log('[PUBLIC_COACHES_PROFILES_QUERY_START]');
        const { data: coachProfiles, error: profilesError } = await supabase
          .from('CoachProfile')
          .select(`
            ulid,
            userUlid,
            coachingSpecialties,
            hourlyRate,
            isActive,
            averageRating,
            totalSessions
          `)
          .eq('isActive', true)
          .in('userUlid', coachUsers.map(u => u.ulid));
          
        if (profilesError) {
          console.error('[PUBLIC_COACHES_PROFILES_QUERY_ERROR]', {
            error: profilesError,
            timestamp: new Date().toISOString()
          });
          throw profilesError;
        }
        
        console.log('[PUBLIC_COACHES_PROFILES_QUERY_COMPLETE]', {
          count: coachProfiles?.length || 0,
          timestamp: new Date().toISOString()
        });
        
        if (!coachProfiles || coachProfiles.length === 0) {
          console.log('[PUBLIC_COACHES_NO_PROFILES]', {
            timestamp: new Date().toISOString()
          });
          setCoaches([]);
          return;
        }
        
        // Combine user data with coach profile data
        console.log('[PUBLIC_COACHES_TRANSFORM_START]', {
          count: coachProfiles.length,
          timestamp: new Date().toISOString()
        });
        
        const transformedCoaches = coachProfiles.map(profile => {
          const user = coachUsers.find(u => u.ulid === profile.userUlid);
          if (!user) return null;
          
          const transformed = {
            ulid: profile.ulid,
            userUlid: user.ulid,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName,
            profileImageUrl: user.profileImageUrl,
            bio: user.bio,
            coachingSpecialties: profile.coachingSpecialties || [],
            hourlyRate: profile.hourlyRate,
            averageRating: profile.averageRating,
            totalSessions: profile.totalSessions || 0
          };
          
          // Log incomplete profiles to help identify data quality issues
          const incompleteFields = [];
          if (!transformed.firstName || !transformed.lastName) incompleteFields.push('name');
          if (!transformed.bio) incompleteFields.push('bio');
          if (!transformed.profileImageUrl) incompleteFields.push('profileImage');
          if (!transformed.coachingSpecialties.length) incompleteFields.push('specialties');
          if (!transformed.hourlyRate) incompleteFields.push('hourlyRate');
          
          if (incompleteFields.length > 0) {
            console.log('[PUBLIC_COACHES_INCOMPLETE_PROFILE]', {
              coachUlid: profile.ulid,
              userUlid: user.ulid,
              incompleteFields,
              timestamp: new Date().toISOString()
            });
          }
          
          return transformed;
        }).filter(Boolean) as PublicCoach[];
        
        console.log('[PUBLIC_COACHES_TRANSFORM_COMPLETE]', {
          transformedCount: transformedCoaches.length,
          timestamp: new Date().toISOString()
        });
        
        if (isMounted) {
          setCoaches(transformedCoaches);
          
          console.log('[PUBLIC_COACHES_STATE_UPDATED]', {
            coachCount: transformedCoaches.length,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('[PUBLIC_COACHES_ERROR]', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        if (isMounted) {
          setError('Failed to load coaches. Please try again later.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
          console.log('[PUBLIC_COACHES_FETCH_COMPLETE]', {
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    fetchCoaches()

    return () => {
      isMounted = false
    }
  }, [supabase])

  return { coaches, isLoading, error }
} 