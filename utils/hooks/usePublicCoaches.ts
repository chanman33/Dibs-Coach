import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { PublicCoach } from '@/utils/types/coach'
import crypto from 'crypto'

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
        // First get active users with COACH capability
        console.log('[PUBLIC_COACHES_USERS_QUERY_START]');
        
        // Wrap in try-catch to handle potential Supabase client errors
        let activeUsers;
        let activeUsersError;
        
        try {
          const response = await supabase
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
            
          activeUsers = response.data;
          activeUsersError = response.error;
        } catch (clientError) {
          console.error('[PUBLIC_COACHES_SUPABASE_CLIENT_ERROR]', {
            error: clientError,
            message: clientError instanceof Error ? clientError.message : 'Unknown client error',
            timestamp: new Date().toISOString()
          });
          throw new Error('Failed to connect to the database. Please try again later.');
        }
          
        if (activeUsersError) {
          console.error('[PUBLIC_COACHES_USERS_QUERY_ERROR]', {
            error: activeUsersError,
            timestamp: new Date().toISOString()
          });
          throw new Error(`Failed to fetch active users: ${activeUsersError.message}`);
        }
        
        if (!activeUsers || activeUsers.length === 0) {
          console.log('[PUBLIC_COACHES_NO_ACTIVE_USERS]', {
            timestamp: new Date().toISOString()
          });
          setCoaches([]);
          return;
        }
        
        console.log('[PUBLIC_COACHES_USERS_QUERY_COMPLETE]', {
          count: activeUsers?.length || 0,
          timestamp: new Date().toISOString()
        });
        
        // Filter users with COACH capability
        const coachUsers = activeUsers.filter(user => 
          (Array.isArray(user.capabilities) && user.capabilities.includes('COACH')) || 
          user.isCoach === true
        );
        
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
        
        // Get the list of coach ULIDs
        const coachUlids = coachUsers.map(u => u.ulid);
        
        // Now get coach profiles for these users
        console.log('[PUBLIC_COACHES_PROFILES_QUERY_START]', {
          coachCount: coachUlids.length,
          timestamp: new Date().toISOString()
        });
        
        // Split into smaller batches if there are many coaches
        // Supabase has a limit on the number of items in an 'in' clause
        const BATCH_SIZE = 30; // Reduced batch size to avoid potential limits
        let allCoachProfiles: any[] = [];
        let batchErrors = 0;
        
        for (let i = 0; i < coachUlids.length; i += BATCH_SIZE) {
          const batchUlids = coachUlids.slice(i, i + BATCH_SIZE);
          const batchNumber = Math.floor(i/BATCH_SIZE) + 1;
          
          console.log(`[PUBLIC_COACHES_PROFILES_BATCH_${batchNumber}]`, {
            batchSize: batchUlids.length,
            timestamp: new Date().toISOString()
          });
          
          if (batchUlids.length === 0) continue;
          
          try {
            const { data: batchProfiles, error: batchError } = await supabase
              .from('CoachProfile')
              .select(`
                ulid,
                userUlid,
                coachSkills,
                hourlyRate,
                isActive,
                averageRating,
                totalSessions,
                profileStatus,
                coachRealEstateDomains,
                coachPrimaryDomain,
                slogan,
                defaultDuration,
                minimumDuration,
                maximumDuration,
                allowCustomDuration,
                completionPercentage
              `)
              .eq('profileStatus', 'PUBLISHED')
              .in('userUlid', batchUlids);
              
            if (batchError) {
              console.error(`[PUBLIC_COACHES_PROFILES_BATCH_${batchNumber}_ERROR]`, {
                error: batchError,
                timestamp: new Date().toISOString()
              });
              batchErrors++;
              continue; // Skip this batch but continue with others
            }
            
            if (batchProfiles && batchProfiles.length > 0) {
              allCoachProfiles = [...allCoachProfiles, ...batchProfiles];
            }
          } catch (batchError) {
            console.error(`[PUBLIC_COACHES_PROFILES_BATCH_${batchNumber}_EXCEPTION]`, {
              error: batchError,
              timestamp: new Date().toISOString()
            });
            batchErrors++;
            // Continue with other batches
          }
        }
        
        // If all batches failed, throw an error
        if (batchErrors > 0 && batchErrors === Math.ceil(coachUlids.length / BATCH_SIZE)) {
          throw new Error('Failed to fetch coach profiles. Please try again later.');
        }
        
        console.log('[PUBLIC_COACHES_PUBLISHED_PROFILES]', {
          totalCoaches: coachUsers.length,
          publishedCount: allCoachProfiles.length,
          unpublishedCount: coachUsers.length - allCoachProfiles.length,
          timestamp: new Date().toISOString()
        });
        
        if (allCoachProfiles.length === 0) {
          console.log('[PUBLIC_COACHES_NO_PROFILES]', {
            timestamp: new Date().toISOString()
          });
          
          // Create default profiles for coach users without profiles, but don't display them
          console.log('[PUBLIC_COACHES_CREATING_DEFAULT_PROFILES]', {
            coachCount: coachUsers.length,
            timestamp: new Date().toISOString()
          });
          
          // Don't display default profiles to end users in public browsing
          // We only return published profiles
          if (isMounted) {
            setCoaches([]);
            console.log('[PUBLIC_COACHES_STATE_UPDATED_EMPTY]', {
              message: 'No published coach profiles available',
              timestamp: new Date().toISOString()
            });
          }
          return;
        }
        
        // Combine user data with coach profile data
        console.log('[PUBLIC_COACHES_TRANSFORM_START]', {
          count: allCoachProfiles.length,
          timestamp: new Date().toISOString()
        });
        
        // First filter for coaches with complete profiles
        const qualifiedProfiles = allCoachProfiles.filter(profile => 
          profile.completionPercentage >= 80 && 
          profile.coachSkills && 
          Array.isArray(profile.coachSkills) && 
          profile.coachSkills.length > 0
        );
        
        console.log('[PUBLIC_COACHES_QUALIFIED_PROFILES]', {
          totalProfiles: allCoachProfiles.length,
          qualifiedProfiles: qualifiedProfiles.length,
          timestamp: new Date().toISOString()
        });
        
        const transformedCoaches = qualifiedProfiles.map(profile => {
          const user = coachUsers.find(u => u.ulid === profile.userUlid);
          if (!user) return null;
          
          const transformed = {
            ulid: profile.ulid,
            userUlid: user.ulid,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            displayName: user.displayName || '',
            profileImageUrl: user.profileImageUrl || '',
            bio: user.bio || '',
            coachSkills: Array.isArray(profile.coachSkills) ? profile.coachSkills : [],
            coachRealEstateDomains: Array.isArray(profile.coachRealEstateDomains) ? profile.coachRealEstateDomains : [],
            coachPrimaryDomain: profile.coachPrimaryDomain || null,
            slogan: profile.slogan || null,
            profileSlug: null,
            hourlyRate: profile.hourlyRate || null,
            averageRating: profile.averageRating || null,
            totalSessions: profile.totalSessions || 0,
            sessionConfig: {
              defaultDuration: profile.defaultDuration || 60,
              minimumDuration: profile.minimumDuration || 30,
              maximumDuration: profile.maximumDuration || 90,
              allowCustomDuration: profile.allowCustomDuration || false
            }
          };
          
          return transformed;
        }).filter(Boolean) as PublicCoach[];
        
        console.log('[PUBLIC_COACHES_TRANSFORM_COMPLETE]', {
          transformedCount: transformedCoaches.length,
          timestamp: new Date().toISOString()
        });
        
        // Sort coaches by a combination of factors to get the best recommendations
        const sortedCoaches = [...transformedCoaches].sort((a, b) => {
          // First by rating
          const ratingDiff = (b.averageRating || 0) - (a.averageRating || 0);
          if (ratingDiff !== 0) return ratingDiff;
          
          // Then by total sessions
          return (b.totalSessions || 0) - (a.totalSessions || 0);
        });
        
        if (isMounted) {
          setCoaches(sortedCoaches);
          
          console.log('[PUBLIC_COACHES_STATE_UPDATED]', {
            coachCount: sortedCoaches.length,
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