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
  ScheduleOverrides
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
}

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

    // Get the Cal.com integration for this user
    const { data: integration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('calManagedUserId, calUsername, timeZone, createdAt')
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
      createdAt: integration.createdAt
    })

    // Now verify with Cal.com API that the managed user still exists
    let verifiedWithCal = false
    let verificationResponse = null
    
    try {
      if (integration.calManagedUserId) {
        const calApiUrl = `/oauth-clients/${env.NEXT_PUBLIC_CAL_CLIENT_ID}/users/${integration.calManagedUserId}`;
        console.log('[CAL_DEBUG] Verifying with Cal.com API:', calApiUrl);
        
        const responseData = await makeCalApiRequest({
          endpoint: calApiUrl,
          headers: getCalOAuthHeaders()
        });
        
        verificationResponse = {
          status: 200,
          statusText: 'OK',
          data: responseData
        };
        
        console.log('[CAL_DEBUG] Cal.com API response:', verificationResponse);
        verifiedWithCal = true;
        console.log('[CAL_DEBUG] Verification successful');
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
      
      // If 404, the user was deleted or doesn't exist on Cal.com
      if (error?.message?.includes('404')) {
        console.log('[CAL_DEBUG] User exists in DB but not found on Cal.com (404 error)');
        return {
          data: { 
            isConnected: false,
            verifiedWithCal: false 
          },
          error: { 
            code: 'NOT_FOUND',
            message: 'User exists in database but was not found on Cal.com' 
          }
        };
      }
    }

    // Integration found, return the details
    const result = {
      data: {
        isConnected: true,
        calManagedUserId: integration.calManagedUserId,
        calUsername: integration.calUsername,
        timeZone: integration.timeZone,
        createdAt: integration.createdAt,
        verifiedWithCal,
        verificationResponse
      },
      error: null
    }
    
    console.log('[CAL_DEBUG] Returning integration status:', {
      isConnected: true,
      verifiedWithCal,
      calManagedUserId: integration.calManagedUserId
    })
    
    return result
  } catch (error) {
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
    
    // Simple check if token is expired based on stored expiry time
    if (new Date(integration.calAccessTokenExpiresAt) < new Date()) {
      console.error('[SYNC_CAL_SCHEDULES]', {
        error: 'Token expired',
        userUlid: userData.ulid,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: null,
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Cal.com access token expired. Please reconnect your integration.' 
        }
      };
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
            lastSyncedAt: typeof newSchedule.lastSyncedAt === 'string' ? newSchedule.lastSyncedAt : newSchedule.lastSyncedAt?.toISOString() ?? null,
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