'use server'

import { createAuthClient } from '@/utils/auth'
import { auth } from '@clerk/nextjs'
import { Database } from '@/types/supabase'
import { ApiResponse, ApiErrorCode } from '@/utils/types/api'
import { env } from '@/lib/env'
import { generateUlid } from '@/utils/ulid'
import { 
  CalSchedule, 
  CoachingSchedule, 
  SCHEDULE_SYNC_SOURCE,
  ScheduleSyncSource,
  ScheduleAvailability,
  ScheduleOverrides,
  toIsoString
} from '@/utils/types/schedule'
import { 
  mapCalScheduleToDbSchedule, 
  mapDbScheduleToCalPayload,
  updateScheduleSyncStatus
} from '@/utils/mapping/schedule-mapper'
import { Json } from '@/types/supabase'
import { makeCalApiRequest, getCalOAuthHeaders, getCalAuthHeaders } from '@/utils/cal/cal-api-utils'

// Add custom error codes
type ExtendedApiErrorCode = ApiErrorCode 
  | 'INTEGRATION_NOT_FOUND'
  | 'TOKEN_EXPIRED'
  | 'CAL_API_ERROR';

export interface CalIntegrationDetails {
  isConnected: boolean
  calManagedUserId?: number
  calUsername?: string
  timeZone?: string | null
  createdAt?: string
  verifiedWithCal?: boolean
  verificationResponse?: any
  tokenStatus?: 'valid' | 'refreshed' | 'expired'
}

// Define token related error codes
type CalTokenErrorCode = 'TOKEN_EXPIRED' | 'TOKEN_REFRESH_FAILED' | 'TOKEN_INVALID';

/**
 * Fetch the current user's Cal.com integration status
 */
export async function fetchCalIntegrationStatus(): Promise<ApiResponse<CalIntegrationDetails>> {
  try {
    // Get the user's ID from auth
    const { userId } = auth()
    if (!userId) {
      console.log('[CAL_DEBUG] No user ID found in auth context')
      return {
        data: { isConnected: false },
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      }
    }

    console.log('[CAL_DEBUG] Starting integration check for user:', userId)

    // Get the user's ULID from the database
    const supabase = createAuthClient()
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()

    if (userError) {
      console.error('[FETCH_CAL_STATUS_ERROR]', {
        error: userError,
        userId,
        timestamp: new Date().toISOString()
      })
      return {
        data: { isConnected: false },
        error: { code: 'DATABASE_ERROR', message: 'Failed to find user in database' }
      }
    }

    console.log('[CAL_DEBUG] Found user ULID in database:', userData.ulid)

    // Get the Cal.com integration for this user with all needed token fields
    const { data: integration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('calManagedUserId, calUsername, timeZone, createdAt, calAccessToken, calRefreshToken, calAccessTokenExpiresAt')
      .eq('userUlid', userData.ulid)
      .maybeSingle()

    if (integrationError) {
      console.error('[FETCH_CAL_STATUS_ERROR]', {
        error: integrationError,
        userUlid: userData.ulid,
        timestamp: new Date().toISOString()
      })
      return {
        data: { isConnected: false },
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch integration data' }
      }
    }

    if (!integration) {
      // Not an error, just no integration found
      console.log('[CAL_DEBUG] No integration found for user ULID:', userData.ulid)
      return {
        data: { isConnected: false },
        error: null
      }
    }

    console.log('[CAL_DEBUG] Integration data from database:', {
      calManagedUserId: integration.calManagedUserId,
      calUsername: integration.calUsername,
      timeZone: integration.timeZone,
      createdAt: integration.createdAt,
      hasAccessToken: !!integration.calAccessToken,
      hasRefreshToken: !!integration.calRefreshToken,
      expiresAt: integration.calAccessTokenExpiresAt
    })

    // Token validity check - Step 1: Check if token is expired or expiring soon (using 5 minute buffer)
    let tokenStatus: 'valid' | 'refreshed' | 'expired' = 'valid';
    let accessToken = integration.calAccessToken;
    let isTokenExpired = false;
    
    try {
      // Use the utility function to check expiration with buffer
      const { isCalTokenExpired } = await import('@/utils/auth/cal-token-service');
      isTokenExpired = await isCalTokenExpired(integration.calAccessTokenExpiresAt, 5);
      
      console.log('[CAL_DEBUG] Token expiration check:', {
        isExpired: isTokenExpired,
        expiresAt: integration.calAccessTokenExpiresAt,
        timestamp: new Date().toISOString()
      });
      
      // If the token is not expired according to our records, but is close to expiration
      // (within 30 minutes), perform a verification check against Cal.com API
      if (!isTokenExpired && integration.calAccessTokenExpiresAt) {
        const expiryTime = new Date(integration.calAccessTokenExpiresAt).getTime();
        const currentTime = Date.now();
        const thirtyMinutesMs = 30 * 60 * 1000;
        
        if (expiryTime - currentTime < thirtyMinutesMs) {
          console.log('[CAL_DEBUG] Token is close to expiration, performing verification check');
          
          // Make a lightweight call to Cal.com API to verify token is still valid
          try {
            const verificationResponse = await fetch('https://api.cal.com/v2/me', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${integration.calAccessToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            // If the response indicates an expired token, override our check
            if (!verificationResponse.ok) {
              const errorData = await verificationResponse.text();
              
              try {
                const parsedError = JSON.parse(errorData);
                if (
                  verificationResponse.status === 498 || 
                  parsedError?.error?.code === 'TokenExpiredException' ||
                  parsedError?.error?.message === 'ACCESS_TOKEN_IS_EXPIRED'
                ) {
                  console.log('[CAL_DEBUG] Token verification failed - token is actually expired');
                  isTokenExpired = true;
                }
              } catch (e) {
                // If we can't parse the error, assume token might be expired
                console.error('[CAL_DEBUG] Could not parse verification error, assuming token needs refresh:', e);
                isTokenExpired = true;
              }
            } else {
              console.log('[CAL_DEBUG] Token verification succeeded - token is still valid');
            }
          } catch (verificationError) {
            console.error('[CAL_DEBUG] Error during token verification:', verificationError);
            // On error, assume we might need to refresh to be safe
            isTokenExpired = true;
          }
        }
      }
      
      // Step 2: If token is expired or expiring soon, try to refresh it
      if (isTokenExpired) {
        console.log('[CAL_DEBUG] Token expired or expiring soon, attempting refresh');
        tokenStatus = 'expired';
        
        // Use the refreshUserCalTokens utility to refresh the token
        const { refreshUserCalTokens } = await import('@/utils/actions/cal-tokens');
        
        // Always use force refresh for managed users to ensure we use the correct endpoint
        const isManagedUser = !!integration.calManagedUserId;
        console.log('[CAL_DEBUG] Using force refresh for managed user:', {
          isManagedUser,
          calManagedUserId: integration.calManagedUserId
        });
        
        const refreshResult = await refreshUserCalTokens(userData.ulid, isManagedUser);
        
        if (!refreshResult.success) {
          console.error('[CAL_DEBUG] Token refresh failed:', refreshResult.error);
          
          // Check if managed user still exists before returning failure
          const managedUserExists = await verifyManagedUser(integration.calManagedUserId);
          
          if (!managedUserExists) {
            console.error('[CAL_DEBUG] Managed user no longer exists on Cal.com');
            return {
              data: { 
                isConnected: false,
                verifiedWithCal: false,
                tokenStatus: 'expired'
              },
              error: { 
                code: 'INTERNAL_ERROR' as ApiErrorCode,
                message: 'Failed to refresh token and managed user may not exist'
              }
            };
          }
          
          // Return partial success if user exists but token refresh failed
          return {
            data: {
              isConnected: false,
              calManagedUserId: integration.calManagedUserId,
              calUsername: integration.calUsername,
              timeZone: integration.timeZone,
              createdAt: integration.createdAt,
              verifiedWithCal: true, // User exists, just token issues
              tokenStatus: 'expired'
            },
            error: {
              code: 'INTERNAL_ERROR' as ApiErrorCode,
              message: 'Calendar connection needs to be refreshed'
            }
          }
        }
        
        // Token refreshed successfully
        console.log('[CAL_DEBUG] Token refreshed successfully');
        tokenStatus = 'refreshed';
        
        // Fetch updated integration data to get the new token
        const { data: updatedIntegration, error: updatedError } = await supabase
          .from('CalendarIntegration')
          .select('calAccessToken')
          .eq('userUlid', userData.ulid)
          .single();
        
        if (!updatedError && updatedIntegration?.calAccessToken) {
          accessToken = updatedIntegration.calAccessToken;
        }
      }
    } catch (error) {
      console.error('[CAL_DEBUG] Error during token expiry check or refresh:', error);
      // Continue with the existing token even if expiry check fails
    }
    
    // Step 3: Verify that the managed user still exists via Cal.com API
    let verifiedWithCal = false;
    let verificationResponse = null;
    
    try {
      if (integration.calManagedUserId) {
        verifiedWithCal = await verifyManagedUser(integration.calManagedUserId);
        console.log('[CAL_DEBUG] Cal.com managed user verification result:', verifiedWithCal);
      } else {
        console.log('[CAL_DEBUG] No Cal.com managed user ID - cannot verify')
      }
    } catch (error: any) {
      console.error('[CAL_INTEGRATION_VERIFICATION_ERROR]', {
        error: error?.message || error,
        calManagedUserId: integration.calManagedUserId,
        userUlid: userData.ulid,
        timestamp: new Date().toISOString()
      });
    }
    
    // Only consider connected if managed user is verified and token is not expired
    const isConnected = verifiedWithCal && tokenStatus !== 'expired';
    
    console.log('[CAL_DEBUG] Returning integration status:', {
      isConnected,
      verifiedWithCal,
      tokenStatus,
      calManagedUserId: integration.calManagedUserId
    });
    
    return {
      data: {
        isConnected,
        calManagedUserId: integration.calManagedUserId,
        calUsername: integration.calUsername,
        timeZone: integration.timeZone,
        createdAt: integration.createdAt,
        verifiedWithCal,
        tokenStatus
      },
      error: null
    };
  } catch (error: any) {
    console.error('[FETCH_CAL_STATUS_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    })
    return {
      data: { isConnected: false },
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    }
  }
}

/**
 * Helper function to verify if a managed user exists in Cal.com
 */
async function verifyManagedUser(calManagedUserId: number): Promise<boolean> {
  if (!calManagedUserId) return false;
  
  try {
    const calApiUrl = `/oauth-clients/${env.NEXT_PUBLIC_CAL_CLIENT_ID}/users/${calManagedUserId}`;
    console.log('[CAL_DEBUG] Verifying managed user with Cal.com API:', calApiUrl);
    
    // Use the utility function that handles token authentication properly
    const responseData = await makeCalApiRequest({
      endpoint: calApiUrl,
      headers: getCalOAuthHeaders()
    });
    
    console.log('[CAL_DEBUG] Cal.com API response:', responseData);
    return true;
  } catch (error: any) {
    console.error('[CAL_MANAGED_USER_VERIFICATION_ERROR]', {
      error: error?.message || error,
      calManagedUserId,
      timestamp: new Date().toISOString()
    });
    
    // If 404, the user was deleted or doesn't exist on Cal.com
    if (error?.message?.includes('404')) {
      console.log('[CAL_DEBUG] User not found on Cal.com (404 error)');
      return false;
    }
    
    // For auth errors (401, 403), try using client secret directly
    if (error?.message?.includes('401') || error?.message?.includes('403')) {
      try {
        console.log('[CAL_DEBUG] Auth error, attempting direct verification with client secret');
        // Direct API call using client secret
        const clientId = env.NEXT_PUBLIC_CAL_CLIENT_ID;
        const clientSecret = env.CAL_CLIENT_SECRET;
        
        if (!clientId || !clientSecret) {
          console.error('[CAL_DEBUG] Missing client credentials');
          return false;
        }
        
        const directResponse = await fetch(
          `https://api.cal.com/v2/oauth-clients/${clientId}/users/${calManagedUserId}`, 
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-cal-secret-key': clientSecret
            }
          }
        );
        
        if (directResponse.ok) {
          console.log('[CAL_DEBUG] Direct verification successful');
          return true;
        }
        
        console.error('[CAL_DEBUG] Direct verification failed:', directResponse.status);
        return false;
      } catch (directError) {
        console.error('[CAL_DEBUG] Direct verification error:', directError);
        return false;
      }
    }
    
    // For other errors, we can't be sure, so assume false
    return false;
  }
}

interface SyncResult {
  created: number;
  updated: number;
  deleted: number;
  errors: number;
  calSchedules: CalSchedule[];
  dbSchedules: CoachingSchedule[];
}

/**
 * Synchronize Cal.com schedules with the local CoachingAvailabilitySchedule table
 * This ensures that the two systems have consistent data
 */
export async function syncCalendarSchedules(): Promise<ApiResponse<SyncResult>> {
  try {
    // Get the user's ID from auth
    const { userId } = auth();
    if (!userId) {
      return {
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      };
    }

    console.log('[SYNC_CAL_SCHEDULES]', {
      userId,
      timestamp: new Date().toISOString(),
      step: 'Starting schedule synchronization'
    });

    // Get the user's ULID from the database
    const supabase = createAuthClient();
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single();

    if (userError || !userData?.ulid) {
      console.error('[SYNC_CAL_SCHEDULES]', {
        error: userError || 'User not found',
        userId,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: { code: 'DATABASE_ERROR', message: 'Failed to find user in database' }
      };
    }

    // Get the Cal.com integration for this user
    const { data: integration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('*')
      .eq('userUlid', userData.ulid)
      .single();

    if (integrationError || !integration) {
      console.error('[SYNC_CAL_SCHEDULES]', {
        error: integrationError || 'Integration not found',
        userUlid: userData.ulid,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: { 
          code: 'NOT_FOUND', 
          message: 'Cal.com integration not found for this user' 
        }
      };
    }

    // Check if token is expired and refresh if needed
    let accessToken = integration.calAccessToken;
    
    // Use proper token expiration check instead of simple date comparison
    try {
      const { isCalTokenExpired } = await import('@/utils/auth/cal-token-service');
      const isTokenExpired = await isCalTokenExpired(integration.calAccessTokenExpiresAt, 5);
      
      if (isTokenExpired) {
        console.log('[SYNC_CAL_SCHEDULES]', {
          step: 'Token expired, attempting refresh',
          userUlid: userData.ulid,
          timestamp: new Date().toISOString()
        });
        
        // Use the refreshUserCalTokens utility with force refresh for managed users
        const { refreshUserCalTokens } = await import('@/utils/actions/cal-tokens');
        const isManagedUser = !!integration.calManagedUserId;
        const refreshResult = await refreshUserCalTokens(userData.ulid, isManagedUser);
        
        if (!refreshResult.success) {
          console.error('[SYNC_CAL_SCHEDULES]', {
            error: 'Token refresh failed',
            refreshError: refreshResult.error,
            userUlid: userData.ulid,
            timestamp: new Date().toISOString()
          });
          
          return {
            data: null,
            error: { 
              code: 'UNAUTHORIZED', 
              message: 'Cal.com access token expired and refresh failed. Please reconnect your integration.' 
            }
          };
        }
        
        // Get updated token after refresh
        const { data: refreshedIntegration } = await supabase
          .from('CalendarIntegration')
          .select('calAccessToken')
          .eq('userUlid', userData.ulid)
          .single();
        
        if (refreshedIntegration?.calAccessToken) {
          accessToken = refreshedIntegration.calAccessToken;
          console.log('[SYNC_CAL_SCHEDULES]', {
            step: 'Token refreshed successfully',
            userUlid: userData.ulid,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('[SYNC_CAL_SCHEDULES]', {
        step: 'Error checking token expiration',
        error,
        userUlid: userData.ulid,
        timestamp: new Date().toISOString()
      });
      
      // Continue with current token as fallback
    }

    // Fetch schedules from Cal.com
    console.log('[SYNC_CAL_SCHEDULES]', {
      step: 'Fetching schedules from Cal.com',
      userUlid: userData.ulid,
      timestamp: new Date().toISOString()
    });
    
    const calResponse = await fetch('https://api.cal.com/v2/schedules', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-01-01'
      }
    });

    if (!calResponse.ok) {
      const errorData = await calResponse.json();
      console.error('[SYNC_CAL_SCHEDULES]', {
        error: 'Failed to fetch schedules from Cal.com',
        status: calResponse.status,
        response: errorData,
        userUlid: userData.ulid,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: null,
        error: { 
          code: 'FETCH_ERROR', 
          message: 'Failed to fetch schedules from Cal.com API' 
        }
      };
    }

    const responseData = await calResponse.json();
    const calSchedules: CalSchedule[] = responseData?.data || [];
    
    console.log('[SYNC_CAL_SCHEDULES]', {
      step: 'Fetched schedules from Cal.com',
      schedulesCount: calSchedules.length,
      userUlid: userData.ulid,
      timestamp: new Date().toISOString()
    });

    // Now fetch the local coaching schedules
    const { data: dbSchedulesRaw, error: dbSchedulesError } = await supabase
      .from('CoachingAvailabilitySchedule')
      .select('*')
      .eq('userUlid', userData.ulid);

    if (dbSchedulesError) {
      console.error('[SYNC_CAL_SCHEDULES]', {
        error: dbSchedulesError,
        step: 'Failed to fetch coaching schedules from database',
        userUlid: userData.ulid,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: null,
        error: { 
          code: 'DATABASE_ERROR', 
          message: 'Failed to fetch coaching schedules from database' 
        }
      };
    }
    
    // Cast database schedules to our CoachingSchedule type and ensure timezone is converted to timeZone
    const dbSchedules = (dbSchedulesRaw || []).map(schedule => {
      // First create a properly typed object from the database schedule
      const typedSchedule: CoachingSchedule = {
        ulid: schedule.ulid,
        userUlid: schedule.userUlid,
        name: schedule.name,
        timeZone: schedule.timeZone || 'UTC',
        calScheduleId: schedule.calScheduleId,
        availability: (schedule.availability as unknown as ScheduleAvailability) || [],
        overrides: (schedule.overrides as unknown as ScheduleOverrides) || [],
        syncSource: (schedule.syncSource as ScheduleSyncSource) || SCHEDULE_SYNC_SOURCE.LOCAL,
        lastSyncedAt: schedule.lastSyncedAt || null,
        isDefault: schedule.isDefault || false,
        active: schedule.active || true,
        allowCustomDuration: schedule.allowCustomDuration || true,
        defaultDuration: schedule.defaultDuration || 60,
        maximumDuration: schedule.maximumDuration || 120,
        minimumDuration: schedule.minimumDuration || 30,
        bufferAfter: schedule.bufferAfter || 0,
        bufferBefore: schedule.bufferBefore || 0,
        averageRating: schedule.averageRating || null,
        totalSessions: schedule.totalSessions || 0,
        zoomEnabled: schedule.zoomEnabled || false,
        calendlyEnabled: schedule.calendlyEnabled || false,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt
      };
      
      return typedSchedule;
    });
    
    console.log('[SYNC_CAL_SCHEDULES]', {
      step: 'Fetched schedules from database',
      schedulesCount: dbSchedules.length || 0,
      userUlid: userData.ulid,
      timestamp: new Date().toISOString()
    });

    // Initialize sync results
    const result: SyncResult = {
      created: 0,
      updated: 0,
      deleted: 0,
      errors: 0,
      calSchedules,
      dbSchedules
    };

    // Get the set of Cal.com schedule IDs
    const calScheduleIds = new Set(calSchedules.map(schedule => schedule.id));
    
    // Map database schedules by Cal.com schedule ID
    const dbScheduleMap = new Map<number, CoachingSchedule>();
    
    for (const schedule of dbSchedules) {
      if (schedule.calScheduleId) {
        dbScheduleMap.set(schedule.calScheduleId, schedule);
      }
    }

    // Create or update schedules in our DB based on Cal.com schedules
    for (const calSchedule of calSchedules) {
      try {
        // Check if we already have this schedule in the DB
        const existingSchedule = dbScheduleMap.get(calSchedule.id);
        
        if (!existingSchedule) {
          // Create new schedule in DB using our mapper
          const newSchedule = mapCalScheduleToDbSchedule(calSchedule, userData.ulid);
          
          // Extract the appropriate database fields for insert
          const scheduleForDb = {
            ulid: newSchedule.ulid,
            userUlid: newSchedule.userUlid,
            name: newSchedule.name,
            timeZone: newSchedule.timeZone,
            timezone: newSchedule.timeZone,
            calScheduleId: newSchedule.calScheduleId,
            availability: JSON.parse(JSON.stringify(newSchedule.availability)) as unknown as Json,
            overrides: JSON.parse(JSON.stringify(newSchedule.overrides)) as unknown as Json,
            syncSource: newSchedule.syncSource,
            lastSyncedAt: toIsoString(newSchedule.lastSyncedAt),
            isDefault: newSchedule.isDefault,
            active: newSchedule.active,
            allowCustomDuration: newSchedule.allowCustomDuration,
            defaultDuration: newSchedule.defaultDuration,
            maximumDuration: newSchedule.maximumDuration,
            minimumDuration: newSchedule.minimumDuration,
            bufferAfter: newSchedule.bufferAfter,
            bufferBefore: newSchedule.bufferBefore,
            totalSessions: newSchedule.totalSessions,
            zoomEnabled: newSchedule.zoomEnabled,
            calendlyEnabled: newSchedule.calendlyEnabled,
            updatedAt: new Date().toISOString()
          };
          
          const { error: createError } = await supabase
            .from('CoachingAvailabilitySchedule')
            .insert(scheduleForDb);
            
          if (createError) {
            console.error('[SYNC_CAL_SCHEDULES]', {
              error: createError,
              step: 'Failed to create new schedule in database',
              calScheduleId: calSchedule.id,
              userUlid: userData.ulid,
              timestamp: new Date().toISOString()
            });
            result.errors++;
          } else {
            console.log('[SYNC_CAL_SCHEDULES]', {
              step: 'Created new schedule in database',
              calScheduleId: calSchedule.id,
              userUlid: userData.ulid,
              timestamp: new Date().toISOString()
            });
            result.created++;
          }
        } else {
          // Update existing schedule in DB
          const { error: updateError } = await supabase
            .from('CoachingAvailabilitySchedule')
            .update({
              name: calSchedule.name,
              timeZone: calSchedule.timeZone,
              availability: JSON.parse(JSON.stringify(calSchedule.availability)) as unknown as Json,
              overrides: JSON.parse(JSON.stringify(calSchedule.overrides || [])) as unknown as Json,
              isDefault: calSchedule.isDefault,
              syncSource: SCHEDULE_SYNC_SOURCE.CALCOM,
              lastSyncedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
            .eq('ulid', existingSchedule.ulid);
            
          if (updateError) {
            console.error('[SYNC_CAL_SCHEDULES]', {
              error: updateError,
              step: 'Failed to update schedule in database',
              calScheduleId: calSchedule.id,
              dbScheduleUlid: existingSchedule.ulid,
              userUlid: userData.ulid,
              timestamp: new Date().toISOString()
            });
            result.errors++;
          } else {
            console.log('[SYNC_CAL_SCHEDULES]', {
              step: 'Updated schedule in database',
              calScheduleId: calSchedule.id,
              dbScheduleUlid: existingSchedule.ulid,
              userUlid: userData.ulid,
              timestamp: new Date().toISOString()
            });
            result.updated++;
          }
        }
      } catch (error) {
        console.error('[SYNC_CAL_SCHEDULES]', {
          error,
          step: 'Error processing schedule',
          calScheduleId: calSchedule.id,
          userUlid: userData.ulid,
          timestamp: new Date().toISOString()
        });
        result.errors++;
      }
    }

    // Handle locally created schedules that need to be pushed to Cal.com
    for (const dbSchedule of dbSchedules) {
      // Check for local schedules that need to be synced to Cal.com
      if (dbSchedule.syncSource === SCHEDULE_SYNC_SOURCE.LOCAL && !dbSchedule.calScheduleId) {
        try {
          // Prepare payload for Cal.com
          const calPayload = mapDbScheduleToCalPayload(dbSchedule);
          
          // Create schedule in Cal.com
          const createResponse = await fetch('https://api.cal.com/v2/schedules', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'cal-api-version': '2024-01-01'
            },
            body: JSON.stringify(calPayload)
          });

          if (createResponse.ok) {
            const newCalSchedule = await createResponse.json();
            const calId = newCalSchedule?.data?.id;
            
            if (calId) {
              // Update our local schedule with the Cal.com ID and mark as synced
              const { error: updateError } = await supabase
                .from('CoachingAvailabilitySchedule')
                .update({
                  calScheduleId: calId,
                  syncSource: SCHEDULE_SYNC_SOURCE.SYNCED,
                  lastSyncedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                })
                .eq('ulid', dbSchedule.ulid);
                
              if (updateError) {
                console.error('[SYNC_CAL_SCHEDULES]', {
                  error: updateError,
                  step: 'Failed to update local schedule after Cal.com creation',
                  dbScheduleUlid: dbSchedule.ulid,
                  calScheduleId: calId,
                  timestamp: new Date().toISOString()
                });
                result.errors++;
              } else {
                console.log('[SYNC_CAL_SCHEDULES]', {
                  step: 'Created schedule in Cal.com and updated local reference',
                  dbScheduleUlid: dbSchedule.ulid,
                  calScheduleId: calId,
                  timestamp: new Date().toISOString()
                });
                result.created++;
              }
            }
          } else {
            console.error('[SYNC_CAL_SCHEDULES]', {
              error: await createResponse.text(),
              step: 'Failed to create schedule in Cal.com',
              dbScheduleUlid: dbSchedule.ulid,
              timestamp: new Date().toISOString()
            });
            result.errors++;
          }
        } catch (error) {
          console.error('[SYNC_CAL_SCHEDULES]', {
            error,
            step: 'Error syncing local schedule to Cal.com',
            dbScheduleUlid: dbSchedule.ulid,
            timestamp: new Date().toISOString()
          });
          result.errors++;
        }
      }
    }

    // Delete schedules from our DB that no longer exist in Cal.com
    for (const [calId, dbSchedule] of Array.from(dbScheduleMap.entries())) {
      if (!calScheduleIds.has(calId) && dbSchedule.syncSource !== SCHEDULE_SYNC_SOURCE.LOCAL) {
        try {
          const { error: deleteError } = await supabase
            .from('CoachingAvailabilitySchedule')
            .delete()
            .eq('ulid', dbSchedule.ulid);
            
          if (deleteError) {
            console.error('[SYNC_CAL_SCHEDULES]', {
              error: deleteError,
              step: 'Failed to delete schedule from database',
              calScheduleId: calId,
              dbScheduleUlid: dbSchedule.ulid,
              userUlid: userData.ulid,
              timestamp: new Date().toISOString()
            });
            result.errors++;
          } else {
            console.log('[SYNC_CAL_SCHEDULES]', {
              step: 'Deleted schedule from database',
              calScheduleId: calId,
              dbScheduleUlid: dbSchedule.ulid,
              userUlid: userData.ulid,
              timestamp: new Date().toISOString()
            });
            result.deleted++;
          }
        } catch (error) {
          console.error('[SYNC_CAL_SCHEDULES]', {
            error,
            step: 'Error deleting schedule',
            calScheduleId: calId,
            dbScheduleUlid: dbSchedule.ulid,
            userUlid: userData.ulid,
            timestamp: new Date().toISOString()
          });
          result.errors++;
        }
      }
    }

    console.log('[SYNC_CAL_SCHEDULES]', {
      step: 'Completed synchronization',
      created: result.created,
      updated: result.updated,
      deleted: result.deleted,
      errors: result.errors,
      userUlid: userData.ulid,
      timestamp: new Date().toISOString()
    });

    return {
      data: result,
      error: null
    };
  } catch (error) {
    console.error('[SYNC_CAL_SCHEDULES]', {
      error,
      timestamp: new Date().toISOString()
    });
    
    return {
      data: null,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred during synchronization' }
    };
  }
} 