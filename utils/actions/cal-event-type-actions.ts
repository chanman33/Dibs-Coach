'use server'

import { auth } from '@clerk/nextjs/server'
import { createAuthClient } from '@/utils/supabase/server'
import { ApiResponse, ApiErrorCode } from '@/utils/types/api'
import { env } from '@/lib/env'
import { nanoid } from 'nanoid'
import { generateUlid } from '@/utils/ulid'
import { 
  EventType, 
  CalEventTypeResponse, 
  CalEventTypeLocation,
  locationArrayToJson, 
  calculateEventPrice as calcEventPrice, 
  generateSlug as genSlug, 
  eventTypeToDbFields,
  eventTypeToCalFormat,
  dbToEventType
} from '@/utils/types/cal-event-types'
import { isCalTokenExpired, refreshCalAccessToken } from '@/utils/auth/cal-token-service'
import { Decimal } from '@prisma/client/runtime/library'
import type { Database } from '@/types/supabase'
import { fetchCoachHourlyRate } from '@/utils/actions/cal-coach-rate-actions'
import { ensureValidCalToken } from '@/utils/cal/token-util'

type DbCalEventType = Database['public']['Tables']['CalEventType']['Row'];

// Define API error codes
// type ApiErrorCode = 'UNAUTHORIZED' | 'DATABASE_ERROR' | 'INTERNAL_ERROR' | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CREATE_ERROR' | 'AUTH_ERROR';

interface SaveEventTypeParams {
  eventTypes: EventType[]
}

interface FetchEventTypesResponse {
  eventTypes: EventType[]
  coachHourlyRate?: {
    hourlyRate: number | null
    isValid: boolean
  }
}

// Define a type for default event types used in the system
interface DefaultEventType {
  name: string
  description: string
  duration: number
  isFree: boolean
  isActive: boolean
  isDefault: boolean
  scheduling: string
  position: number
  slug?: string
  // Cal.com API required fields
  locations: {
    type: string
    link?: string
    displayName?: string
    address?: string
    public?: boolean
  }[]
  beforeEventBuffer: number
  afterEventBuffer: number
  minimumBookingNotice: number
  // Optional fields
  maxParticipants?: number
  discountPercentage?: number
}

/**
 * Fetch event types for a coach from the database
 * 
 * This enhanced version now includes sync functionality that:
 * 1. Fetches event types from the local database
 * 2. Fetches event types directly from Cal.com
 * 3. Compares and reconciles any differences
 * 4. Returns the reconciled list
 */
export async function fetchCoachEventTypes(): Promise<ApiResponse<FetchEventTypesResponse>> {
  try {
    // Get the user's ID from auth
    const { userId } = auth()
    if (!userId) {
      return {
        data: { eventTypes: [] },
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      }
    }

    // Correct: Initialize server client
    const supabase = createAuthClient()
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()

    if (userError) {
      console.error('[FETCH_EVENT_TYPES_ERROR]', {
        error: userError,
        userId,
        timestamp: new Date().toISOString()
      })
      return {
        data: { eventTypes: [] },
        error: { code: 'DATABASE_ERROR', message: 'Failed to find user in database' }
      }
    }

    // Fetch coach hourly rate
    const { data: coachProfile, error: coachProfileError } = await supabase
      .from('CoachProfile')
      .select('hourlyRate')
      .eq('userUlid', userData.ulid)
      .maybeSingle()
      
    // Create hourly rate response object for client use
    const hourlyRate = coachProfile?.hourlyRate as number | null;
    const hourlyRateData = {
      hourlyRate,
      isValid: hourlyRate !== null && hourlyRate > 0
    };

    if (coachProfileError) {
      console.error('[FETCH_COACH_HOURLY_RATE_ERROR]', {
        error: coachProfileError,
        userUlid: userData.ulid,
        timestamp: new Date().toISOString()
      });
      // Continue with event types fetch even if hourly rate fails
    }

    // Get calendar integration for the user
    const { data: calendarIntegration, error: calendarError } = await supabase
      .from('CalendarIntegration')
      .select(`
        ulid,
        calManagedUserId,
        calAccessToken,
        calAccessTokenExpiresAt,
        calRefreshToken
      `)
      .eq('userUlid', userData.ulid)
      .maybeSingle()

    if (calendarError) {
      console.error('[FETCH_EVENT_TYPES_ERROR]', {
        error: calendarError,
        userUlid: userData.ulid,
        timestamp: new Date().toISOString()
      })
      return {
        data: { eventTypes: [], coachHourlyRate: hourlyRateData },
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch calendar integration' }
      }
    }

    if (!calendarIntegration) {
      // Not an error, just no calendar integration found
      return {
        data: { eventTypes: [], coachHourlyRate: hourlyRateData },
        error: null
      }
    }

    // Step 1: Get event types from local DB
    const { data: dbEventTypes, error: eventTypesError } = await supabase
      .from('CalEventType')
      .select('*')
      .eq('calendarIntegrationUlid', calendarIntegration.ulid)
      .order('position', { ascending: true })

    if (eventTypesError) {
      console.error('[FETCH_EVENT_TYPES_ERROR]', {
        error: eventTypesError,
        calendarIntegrationUlid: calendarIntegration.ulid,
        timestamp: new Date().toISOString()
      })
      return {
        data: { eventTypes: [], coachHourlyRate: hourlyRateData },
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch event types' }
      }
    }
    
    // Create a map of DB event types by Cal ID for faster lookup
    const dbEventTypesByCalId = new Map<number, any>();
    dbEventTypes.forEach(et => {
      if (et.calEventTypeId) {
        dbEventTypesByCalId.set(et.calEventTypeId, et);
      }
    });
    
    // Step 2: Fetch from Cal.com API directly for reconciliation
    // First check if we have valid tokens
    const isTokenExpired = await isCalTokenExpired(
      calendarIntegration.calAccessToken,
      Number(calendarIntegration.calAccessTokenExpiresAt)
    )
    
    let accessToken = calendarIntegration.calAccessToken;
    
    // Refresh token if needed
    if (isTokenExpired) {
      console.log('[FETCH_EVENT_TYPES_INFO] Cal token expired, refreshing...', { 
        userUlid: userData.ulid, 
        timestamp: new Date().toISOString() 
      });
      
      try {
        const refreshResult = await refreshCalAccessToken(
          userData.ulid
        );
        
        if (refreshResult.success && refreshResult.tokens) {
          accessToken = refreshResult.tokens.access_token;
          console.log('[FETCH_EVENT_TYPES_INFO] Cal token refreshed successfully', { 
            userUlid: userData.ulid,
            timestamp: new Date().toISOString() 
          });
        } else {
          console.error('[FETCH_EVENT_TYPES_ERROR] Failed to refresh Cal token', { 
            error: refreshResult.error,
            userUlid: userData.ulid,
            timestamp: new Date().toISOString() 
          });
          // Continue with local data only, skip reconciliation
          const mappedLocalEventTypes = dbEventTypes.map(mapDbEventTypeToUi);
          return {
            data: { 
              eventTypes: mappedLocalEventTypes,
              coachHourlyRate: hourlyRateData
            },
            error: null
          }
        }
      } catch (refreshError) {
        console.error('[FETCH_EVENT_TYPES_ERROR] Exception during token refresh', { 
          error: refreshError,
          userUlid: userData.ulid,
          timestamp: new Date().toISOString() 
        });
        // Continue with local data only, skip reconciliation
        const mappedLocalEventTypes = dbEventTypes.map(mapDbEventTypeToUi);
        return {
          data: { 
            eventTypes: mappedLocalEventTypes,
            coachHourlyRate: hourlyRateData
          },
          error: null
        }
      }
    }
    
    // Fetch event types from Cal.com API
    console.log('[FETCH_EVENT_TYPES_INFO] Fetching event types from Cal.com API for reconciliation', { 
      userUlid: userData.ulid,
      timestamp: new Date().toISOString() 
    });
    
    let calEventTypes: any[] = [];
    try {
      // Fetch the user's calUsername first - we need this for the API request
      const { data: calIntegrationData, error: calIntegrationError } = await supabase
        .from('CalendarIntegration')
        .select('calUsername')
        .eq('userUlid', userData.ulid)
        .single();
        
      if (calIntegrationError || !calIntegrationData?.calUsername) {
        console.error('[FETCH_EVENT_TYPES_ERROR] Failed to get Cal.com username', { 
          error: calIntegrationError, 
          userUlid: userData.ulid,
          timestamp: new Date().toISOString() 
        });
        // Continue with local data only
        const mappedLocalEventTypes = dbEventTypes.map(mapDbEventTypeToUi);
        return {
          data: { 
            eventTypes: mappedLocalEventTypes,
            coachHourlyRate: hourlyRateData
          },
          error: null
        }
      }
      
      const calUsername = calIntegrationData.calUsername;
      
      // Use the username in the request URL, matching the format that works in Postman
      const response = await fetch(`https://api.cal.com/v2/event-types?username=${encodeURIComponent(calUsername)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'cal-api-version': '2024-06-14'
        }
      });
      
      if (response.ok) {
        const calData = await response.json();
        calEventTypes = calData.data || [];
        console.log('[FETCH_EVENT_TYPES_INFO] Successfully fetched from Cal.com API', { 
          count: calEventTypes.length,
          userUlid: userData.ulid,
          timestamp: new Date().toISOString() 
        });
      } else {
        console.error('[FETCH_EVENT_TYPES_ERROR] Failed to fetch from Cal.com API', { 
          status: response.status,
          statusText: response.statusText,
          userUlid: userData.ulid,
          timestamp: new Date().toISOString() 
        });
        // Continue with local data only
        const mappedLocalEventTypes = dbEventTypes.map(mapDbEventTypeToUi);
        return {
          data: { 
            eventTypes: mappedLocalEventTypes,
            coachHourlyRate: hourlyRateData
          },
          error: null
        }
      }
    } catch (calApiError) {
      console.error('[FETCH_EVENT_TYPES_ERROR] Exception during Cal.com API fetch', { 
        error: calApiError,
        userUlid: userData.ulid,
        timestamp: new Date().toISOString() 
      });
      // Continue with local data only
      const mappedLocalEventTypes = dbEventTypes.map(mapDbEventTypeToUi);
      return {
        data: { 
          eventTypes: mappedLocalEventTypes,
          coachHourlyRate: hourlyRateData
        },
        error: null
      }
    }
    
    // Step 3: Reconcile data between Cal.com and local DB
    console.log('[FETCH_EVENT_TYPES_INFO] Starting reconciliation', { 
      dbCount: dbEventTypes.length,
      calCount: calEventTypes.length,
      userUlid: userData.ulid,
      timestamp: new Date().toISOString() 
    });
    
    const reconciliationStats = {
      added: 0,
      updated: 0,
      deactivated: 0
    };
    
    // 3.1 Process Cal.com event types that might be missing or need updates locally
    for (const calEventType of calEventTypes) {
      const dbEventType = dbEventTypesByCalId.get(calEventType.id);
      
      if (!dbEventType) {
        // Event type exists in Cal.com but not in local DB - add it
        console.log('[FETCH_EVENT_TYPES_INFO] Found event type in Cal.com not in local DB, adding', { 
          calEventTypeId: calEventType.id,
          title: calEventType.title,
          userUlid: userData.ulid,
          timestamp: new Date().toISOString() 
        });
        
        try {
          // Log the structure of the Cal.com event type to help debug
          console.log('[FETCH_EVENT_TYPES_DEBUG] Cal.com event type structure', {
            id: calEventType.id,
            title: calEventType.title,
            lengthInMinutes: calEventType.lengthInMinutes,
            length: calEventType.length,
            duration: typeof calEventType.duration !== 'undefined' ? calEventType.duration : null
          });
          
          const newDbEventType = {
            ulid: generateUlid(),
            calendarIntegrationUlid: calendarIntegration.ulid,
            calEventTypeId: calEventType.id,
            name: calEventType.title,
            description: calEventType.description || '',
            lengthInMinutes: calEventType.lengthInMinutes || calEventType.length || 30,
            isActive: !calEventType.hidden,
            isDefault: ['Coaching Session', 'Office Hours', 'Get to Know You'].includes(calEventType.title),
            isFree: calEventType.price === 0,
            scheduling: (calEventType.schedulingType?.toUpperCase() || 'MANAGED'),
            position: calEventType.position,
            price: calEventType.price,
            currency: calEventType.currency || 'USD',
            minimumBookingNotice: calEventType.minimumBookingNotice || 0,
            locations: calEventType.locations || [],
            bookerLayouts: calEventType.bookerLayouts || { defaultLayout: 'month', enabledLayouts: ['month', 'week', 'column'] },
            beforeEventBuffer: calEventType.beforeEventBuffer || 0,
            afterEventBuffer: calEventType.afterEventBuffer || 0,
            maxParticipants: calEventType.seatsPerTimeSlot ?? null,
            discountPercentage: calEventType.metadata?.discountPercentage as number | null,
            // Fill in required fields
            slug: calEventType.slug || genSlug(calEventType.title),
            metadata: calEventType.metadata ?? null,
            organizationUlid: null,
            slotInterval: 30,
            hidden: calEventType.hidden,
            successRedirectUrl: null,
            disableGuests: true,
            customName: null,
            useDestinationCalendarEmail: true,
            hideCalendarEventDetails: false,
            color: null,
            requiresConfirmation: false,
            bookingLimits: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          const { error: insertError } = await supabase
            .from('CalEventType')
            .insert(newDbEventType);
            
          if (insertError) {
            console.error('[FETCH_EVENT_TYPES_ERROR] Failed to insert reconciled event type', { 
              error: insertError,
              calEventTypeId: calEventType.id,
              userUlid: userData.ulid,
              timestamp: new Date().toISOString() 
            });
            // Continue with other event types
          } else {
            reconciliationStats.added++;
            // Add to dbEventTypes array for return
            dbEventTypes.push(newDbEventType);
          }
        } catch (insertError) {
          console.error('[FETCH_EVENT_TYPES_ERROR] Exception during reconciliation insert', { 
            error: insertError,
            calEventTypeId: calEventType.id,
            userUlid: userData.ulid,
            timestamp: new Date().toISOString() 
          });
          // Continue reconciliation
        }
      } else {
        // Event type exists in both - check for key differences and update if needed
        const needsUpdate = (
          dbEventType.name !== calEventType.title ||
          dbEventType.description !== (calEventType.description || '') ||
          dbEventType.duration !== calEventType.length ||
          dbEventType.isActive !== !calEventType.hidden ||
          dbEventType.price !== calEventType.price
        );
        
        if (needsUpdate) {
          console.log('[FETCH_EVENT_TYPES_INFO] Found differences in event type, updating local DB', { 
            calEventTypeId: calEventType.id,
            title: calEventType.title,
            userUlid: userData.ulid,
            timestamp: new Date().toISOString() 
          });
          
          try {
            const updatePayload = {
              name: calEventType.title,
              description: calEventType.description || '',
              duration: calEventType.length,
              isActive: !calEventType.hidden,
              price: calEventType.price,
              locations: calEventType.locations || dbEventType.locations,
              bookerLayouts: calEventType.bookerLayouts || dbEventType.bookerLayouts,
              updatedAt: new Date().toISOString()
            };
            
            const { error: updateError } = await supabase
              .from('CalEventType')
              .update(updatePayload)
              .eq('ulid', dbEventType.ulid);
              
            if (updateError) {
              console.error('[FETCH_EVENT_TYPES_ERROR] Failed to update reconciled event type', { 
                error: updateError,
                calEventTypeId: calEventType.id,
                userUlid: userData.ulid,
                timestamp: new Date().toISOString() 
              });
              // Continue with other event types
            } else {
              reconciliationStats.updated++;
              // Update the local event type in our array
              Object.assign(dbEventType, updatePayload);
            }
          } catch (updateError) {
            console.error('[FETCH_EVENT_TYPES_ERROR] Exception during reconciliation update', { 
              error: updateError,
              calEventTypeId: calEventType.id,
              userUlid: userData.ulid,
              timestamp: new Date().toISOString() 
            });
            // Continue reconciliation
          }
        }
      }
    }
    
    // 3.2 Check for event types in local DB that don't exist in Cal.com anymore
    // Create a map of Cal.com event types by ID for faster lookup
    const calEventTypesById = new Map<number, any>();
    calEventTypes.forEach(et => calEventTypesById.set(et.id, et));
    
    for (const dbEventType of dbEventTypes) {
      // Skip event types without a Cal ID (local-only types)
      if (!dbEventType.calEventTypeId) continue;
      
      if (!calEventTypesById.has(dbEventType.calEventTypeId) && dbEventType.isActive) {
        // Event type exists locally but not in Cal.com - mark as inactive
        console.log('[FETCH_EVENT_TYPES_INFO] Found event type in local DB not in Cal.com, deactivating', { 
          calEventTypeId: dbEventType.calEventTypeId,
          name: dbEventType.name,
          userUlid: userData.ulid,
          timestamp: new Date().toISOString() 
        });
        
        try {
          // We don't delete, just mark as inactive to preserve history
          const { error: deactivateError } = await supabase
            .from('CalEventType')
            .update({ 
              isActive: false,
              updatedAt: new Date().toISOString()
            })
            .eq('ulid', dbEventType.ulid);
            
          if (deactivateError) {
            console.error('[FETCH_EVENT_TYPES_ERROR] Failed to deactivate event type during reconciliation', { 
              error: deactivateError,
              calEventTypeId: dbEventType.calEventTypeId,
              userUlid: userData.ulid,
              timestamp: new Date().toISOString() 
            });
            // Continue with other event types
          } else {
            reconciliationStats.deactivated++;
            // Update the local event type in our array
            dbEventType.isActive = false;
          }
        } catch (deactivateError) {
          console.error('[FETCH_EVENT_TYPES_ERROR] Exception during reconciliation deactivation', { 
            error: deactivateError,
            calEventTypeId: dbEventType.calEventTypeId,
            userUlid: userData.ulid,
            timestamp: new Date().toISOString() 
          });
          // Continue reconciliation
        }
      }
    }
    
    // Log reconciliation results
    console.log('[FETCH_EVENT_TYPES_INFO] Reconciliation completed', { 
      stats: reconciliationStats,
      userUlid: userData.ulid,
      timestamp: new Date().toISOString() 
    });

    // Map the potentially updated database event types to the UI format
    const mappedEventTypes: EventType[] = dbEventTypes.map(mapDbEventTypeToUi);

    return {
      data: { 
        eventTypes: mappedEventTypes,
        coachHourlyRate: hourlyRateData
      },
      error: null
    }
  } catch (error) {
    console.error('[FETCH_EVENT_TYPES_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    })
    return {
      data: { eventTypes: [] },
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    }
  }
}

/**
 * Save event types to the database and sync with Cal.com
 */
export async function saveCoachEventTypes(
  params: SaveEventTypeParams
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    // Get the user's ID from auth
    const { userId } = auth()
    if (!userId) {
      return {
        data: { success: false },
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      }
    }

    // Correct: Initialize server client
    const supabase = createAuthClient()
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()

    if (userError) {
      console.error('[SAVE_EVENT_TYPES_ERROR]', {
        error: userError,
        userId,
        timestamp: new Date().toISOString()
      })
      return {
        data: { success: false },
        error: { code: 'DATABASE_ERROR', message: 'Failed to find user in database' }
      }
    }

    const userUlid = userData.ulid;

    // Get calendar integration for the user
    const { data: calendarIntegration, error: calendarError } = await supabase
      .from('CalendarIntegration')
      .select(`
        ulid,
        calManagedUserId,
        calAccessToken,
        calAccessTokenExpiresAt,
        calRefreshToken
      `)
      .eq('userUlid', userUlid)
      .maybeSingle()

    if (calendarError || !calendarIntegration) {
      console.error('[SAVE_EVENT_TYPES_ERROR]', {
        error: calendarError || 'No integration found',
        userUlid,
        timestamp: new Date().toISOString()
      })
      return {
        data: { success: false },
        error: { code: 'DATABASE_ERROR', message: 'Calendar integration required' }
      }
    }

    // Check access token expiration and refresh if needed
    let isExpired;
    try {
      isExpired = await isCalTokenExpired(calendarIntegration.calAccessTokenExpiresAt);
    } catch (error) {
      console.error('[SAVE_EVENT_TYPES_ERROR] Error checking token expiration', {
        error,
        userUlid,
        timestamp: new Date().toISOString()
      });
      // Assume token is expired if we can't verify
      isExpired = true;
    }

    let accessToken = calendarIntegration.calAccessToken;
    const calUserId = calendarIntegration.calManagedUserId;

    if (isExpired) {
      console.log('[SAVE_EVENT_TYPES_INFO] Cal.com token expired, attempting refresh', {
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      try {
        const refreshResult = await refreshCalAccessToken(userUlid);
        
        if (!refreshResult.success || !refreshResult.tokens) {
          console.error('[SAVE_EVENT_TYPES_ERROR] Token refresh failed', {
            error: refreshResult.error,
            userUlid,
            timestamp: new Date().toISOString()
          });
          
          return {
            data: { success: false },
            error: { 
              code: 'UNAUTHORIZED', 
              message: `Your Cal.com connection needs to be refreshed. Please reconnect in settings.`
            }
          };
        }
        
        // Update the access token with the new one
        accessToken = refreshResult.tokens.access_token;
        
        // Only update database if token service didn't already update it
        // This is to avoid race conditions between two different DB updates
        if (refreshResult.error?.includes('Failed to update integration record')) {
          // Save the new token to the database for future requests
          const { error: updateError } = await supabase
            .from('CalendarIntegration')
            .update({
              calAccessToken: refreshResult.tokens.access_token,
              calRefreshToken: refreshResult.tokens.refresh_token || calendarIntegration.calRefreshToken,
              calAccessTokenExpiresAt: new Date(Date.now() + (refreshResult.tokens.expires_in * 1000)).toISOString(),
              lastSyncedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
            .eq('userUlid', userUlid);
          
          if (updateError) {
            console.error('[SAVE_EVENT_TYPES_ERROR] Failed to update token in database', {
              error: updateError,
              userUlid,
              timestamp: new Date().toISOString()
            });
            // Continue anyway with the new token since we have it in memory
          } else {
            console.log('[SAVE_EVENT_TYPES_INFO] Updated Cal.com token in database', {
              userUlid,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          console.log('[SAVE_EVENT_TYPES_INFO] Token was already updated by token service', {
            userUlid,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('[SAVE_EVENT_TYPES_ERROR] Unexpected error refreshing token', {
          error,
          userUlid,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: { success: false },
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Failed to refresh Cal.com access. Please reconnect your Cal.com account in settings.'
          }
        };
      }
    }

    // Check if we have non-free event types
    const hasNonFreeEvent = params.eventTypes.some(et => !et.free);

    // Fetch coach hourly rate directly from database if we have non-free events
    let hourlyRate = 0;
    if (hasNonFreeEvent) {
      const { data: coachProfile, error: coachProfileError } = await supabase
        .from('CoachProfile')
        .select('hourlyRate')
        .eq('userUlid', userUlid)
        .maybeSingle();

      if (coachProfileError) {
        console.error('[SAVE_EVENT_TYPES_ERROR] Failed to fetch hourly rate', {
          error: coachProfileError,
          userUlid,
          timestamp: new Date().toISOString()
        });
        return {
          data: { success: false },
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to validate hourly rate'
          }
        };
      }

      hourlyRate = coachProfile?.hourlyRate as number || 0;
      const hasValidHourlyRate = typeof hourlyRate === 'number' && hourlyRate > 0;
      
      if (!hasValidHourlyRate) {
        console.error('[SAVE_EVENT_TYPES_ERROR] Hourly rate missing or invalid for paid event type.', { 
          userUlid, 
          hourlyRate: hourlyRate
        });
        return {
          data: { success: false },
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Please set a valid hourly rate in your coach profile before saving paid event types.'
          }
        };
      }
    }
    
    // Use the hourly rate directly for calculations
    const numericHourlyRate = hourlyRate || 0;

    // Get existing event types to determine which ones to update, create, or delete
    const { data: existingEventTypes, error: existingError } = await supabase
      .from('CalEventType')
      .select('*')
      .eq('calendarIntegrationUlid', calendarIntegration.ulid)

    if (existingError) {
      console.error('[SAVE_EVENT_TYPES_ERROR]', {
        error: existingError,
        calendarIntegrationUlid: calendarIntegration.ulid,
        timestamp: new Date().toISOString()
      })
      return {
        data: { success: false },
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch existing event types' }
      }
    }

    // Ensure existingEventTypes is an array before proceeding
    const dbEventTypes: DbCalEventType[] = existingEventTypes || [];

    // Map of existing event type IDs
    const existingEventTypeMap = new Map<string, DbCalEventType>(
      dbEventTypes.map((et: DbCalEventType) => [et.ulid, et])
    )

    // Track if any Cal.com operation fails
    let hasCalComFailure = false; 

    // Process each event type from the UI
    for (const eventType of params.eventTypes) {
      const existingDbEntry: DbCalEventType | undefined = existingEventTypeMap.get(eventType.id);

      if (existingDbEntry) {
        // --- UPDATE FLOW ---
        let calSyncSuccess = true;
        let updatedCalEventTypeId = existingDbEntry.calEventTypeId;

        // 1. Sync with Cal.com first (if it exists there)
        if (calendarIntegration.calManagedUserId) {
          calSyncSuccess = await syncEventTypeWithCal(
            accessToken,
            calendarIntegration.calManagedUserId,
            existingDbEntry.calEventTypeId, // Use existing Cal ID or null
            {
              name: eventType.name,
              description: eventType.description || '', // Ensure description is not null
              duration: eventType.duration,
              price: eventType.free ? 0 : calcEventPrice(numericHourlyRate, eventType.duration),
              isActive: eventType.enabled,
              schedulingType: eventType.schedulingType,
              maxParticipants: eventType.maxParticipants,
              discountPercentage: eventType.discountPercentage
            },
            userUlid // Pass userUlid to enable token refresh if needed
          );
          
          // If syncEventTypeWithCal created a new Cal event because ID was null,
          // we might need to fetch the new ID, but syncEventTypeWithCal doesn't return it.
          // For now, we assume if it existed locally, it should exist remotely or be created by sync.
          // A more robust approach might involve fetching the event type by slug after sync if ID was null.
          
          if (!calSyncSuccess) {
            console.error('[SAVE_EVENT_TYPES_SYNC_ERROR]', {
              eventTypeId: eventType.id,
              calEventTypeId: existingDbEntry.calEventTypeId,
              timestamp: new Date().toISOString()
            });
            // Decide if we should continue processing other types or return an error immediately.
            // For now, let's continue but skip DB update for this one.
            hasCalComFailure = true; // Mark failure
          }
        }
        
        // 2. Update database ONLY if Cal.com sync succeeded (or wasn't needed)
        if (calSyncSuccess) {
          const { data: updateData, error: updateError } = await supabase
            .from('CalEventType')
            .update({
              name: eventType.name,
              description: eventType.description,
              duration: eventType.duration,
              isDefault: eventType.isDefault,
              isFree: eventType.free,
              isActive: eventType.enabled,
              scheduling: eventType.schedulingType as 'MANAGED' | 'OFFICE_HOURS' | 'GROUP_SESSION',
              maxParticipants: eventType.maxParticipants || null,
              discountPercentage: eventType.discountPercentage || null,
              organizationUlid: eventType.organizationId || null,
              locations: locationArrayToJson(eventType.locations || [{ 
                type: 'link',
                link: 'https://dibs.coach/call/session',
                public: true
              }]),
              beforeEventBuffer: eventType.beforeEventBuffer || 0,
              afterEventBuffer: eventType.afterEventBuffer || 0,
              minimumBookingNotice: eventType.minimumBookingNotice || 0,
              // We don't update calEventTypeId here, it should be set on creation
              updatedAt: new Date().toISOString()
            })
            .eq('ulid', eventType.id)
            .select()
            .single()

          if (updateError) {
            console.error('[SAVE_EVENT_TYPES_UPDATE_DB_ERROR]', {
              error: updateError,
              eventTypeId: eventType.id,
              timestamp: new Date().toISOString()
            });
            // Continue processing others
          } else {
             console.log('[SAVE_EVENT_TYPES_UPDATE_DB_SUCCESS]', { eventTypeId: eventType.id });
          }
        }
        
        // Remove from map to track which ones need to be deleted later
        existingEventTypeMap.delete(eventType.id)
      } else {
        // --- CREATE FLOW ---
        const newUlid = generateUlid(); // Generate local ULID first
        let calEventType: CalEventTypeResponse | null = null;

        // 1. Create in Cal.com API first (if integration exists)
        if (calendarIntegration.calManagedUserId) {
          calEventType = await createCalEventType(
            accessToken,
            calendarIntegration.calManagedUserId,
            {
              name: eventType.name,
              description: eventType.description || '',
              duration: eventType.duration,
              price: eventType.free ? 0 : calcEventPrice(numericHourlyRate, eventType.duration),
              isActive: eventType.enabled,
              schedulingType: eventType.schedulingType || 'MANAGED', // Default to MANAGED instead of null
              maxParticipants: eventType.maxParticipants || undefined,
              locations: eventType.locations || [{ 
                type: 'link',
                link: 'https://dibs.coach/call/session',
                public: true
              }],
              discountPercentage: eventType.discountPercentage,
              beforeEventBuffer: eventType.beforeEventBuffer,
              afterEventBuffer: eventType.afterEventBuffer,
              minimumBookingNotice: eventType.minimumBookingNotice
            },
            userUlid // Pass userUlid to enable token refresh if needed
          );
        }
        
        // 2. Save to database ONLY if Cal.com creation succeeded (or wasn't applicable)
        // If calManagedUserId exists, calEventType MUST be non-null to proceed.
        if (!calendarIntegration.calManagedUserId || calEventType) {
          // Apply type conversion for database operation
          const dbFields = eventTypeToDbFields(eventType, calendarIntegration.ulid);
          
          const { data: insertData, error: insertError } = await supabase
            .from('CalEventType')
            .insert({
              ulid: newUlid,
              calEventTypeId: calEventType?.id || null, // Use ID from Cal.com response
              slug: calEventType?.slug || genSlug(eventType.name), // Use slug from Cal.com response
              position: params.eventTypes.indexOf(eventType),
              beforeEventBuffer: eventType.beforeEventBuffer || 0,
              afterEventBuffer: eventType.afterEventBuffer || 0,
              minimumBookingNotice: eventType.minimumBookingNotice || 0,
              // Convert locations array to Json for database
              locations: locationArrayToJson(eventType.locations) || locationArrayToJson([{ 
                type: 'link',
                link: 'https://dibs.coach/call/session',
                public: true
              }]),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              // Include all fields from dbFields
              ...dbFields
            });
            
          if (insertError) {
            console.error('[SAVE_EVENT_TYPES_INSERT_DB_ERROR]', {
              error: insertError,
              newUlid,
              calAttempted: !!calendarIntegration.calManagedUserId,
              calSuccess: !!calEventType,
              timestamp: new Date().toISOString()
            });
             // Continue processing others
          } else {
             console.log('[SAVE_EVENT_TYPES_INSERT_DB_SUCCESS]', { newUlid, calEventTypeId: calEventType?.id });
          }
        } else {
           console.error('[SAVE_EVENT_TYPES_INSERT_CAL_FAILED]', {
              message: "Cal.com creation failed, skipping database insert.",
              eventTypeName: eventType.name,
              calUserId: calendarIntegration.calManagedUserId,
              timestamp: new Date().toISOString()
            });
           // Continue processing others
           hasCalComFailure = true; // Mark failure
        }
      }
    }

    // --- DELETE FLOW ---
    const entriesToDelete: DbCalEventType[] = Array.from(existingEventTypeMap.values()); // Get the actual DB entries
    for (const eventToDelete of entriesToDelete) {
      let calDeleteSuccess = true;
      
      // 1. Delete from Cal.com first if it exists there
      if (eventToDelete.calEventTypeId && calendarIntegration.calManagedUserId) {
        calDeleteSuccess = await deleteCalEventType(
          accessToken,
          calendarIntegration.calManagedUserId,
          eventToDelete.calEventTypeId,
          userUlid
        );
      }
      
      // 2. Delete from database ONLY if Cal.com deletion succeeded (or wasn't needed)
      if (calDeleteSuccess) {
        const { error: deleteError } = await supabase
          .from('CalEventType')
          .delete()
          .eq('ulid', eventToDelete.ulid);

        if (deleteError) {
          console.error('[SAVE_EVENT_TYPES_DELETE_DB_ERROR]', {
            error: deleteError,
            ulid: eventToDelete.ulid,
            timestamp: new Date().toISOString()
          });
        } else {
           console.log('[SAVE_EVENT_TYPES_DELETE_DB_SUCCESS]', { ulid: eventToDelete.ulid });
        }
      } else {
        console.error('[SAVE_EVENT_TYPES_DELETE_CAL_FAILED]', {
            message: "Cal.com deletion failed, skipping database delete.",
            ulid: eventToDelete.ulid,
            calEventTypeId: eventToDelete.calEventTypeId,
            timestamp: new Date().toISOString()
        });
        hasCalComFailure = true; // Mark failure
      }
    }

    // Return overall success only if no Cal.com operations failed
    if (hasCalComFailure) {
      return {
        data: { success: false },
        error: { 
          code: 'CREATE_ERROR',
          message: 'Some event types failed to sync with Cal.com. This may be due to connection issues or token expiration. Please try again or reconnect your Cal.com account in settings if the problem persists.'
        }
      };
    }

    return {
      data: { success: true },
      error: null
    }
  } catch (error) {
    console.error('[SAVE_EVENT_TYPES_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    })
    return {
      data: { success: false },
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    }
  }
}

/**
 * Create an event type in Cal.com using the API
 * Will automatically retry once if token is expired
 */
async function createCalEventType(
  accessToken: string,
  calUserId: number,
  eventType: {
    name: string
    description: string
    duration: number
    price: number
    isActive: boolean
    schedulingType: string
    maxParticipants?: number
    discountPercentage?: number
    // Add new fields
    locations?: {
      type: string
      link?: string
      displayName?: string
      address?: string
      public?: boolean
    }[]
    // Remove bookerLayouts from parameter definition
    beforeEventBuffer?: number
    afterEventBuffer?: number
    minimumBookingNotice?: number
  },
  userUlid?: string // Added to support token refresh
): Promise<CalEventTypeResponse | null> {
  try {
    // Use hardcoded API URL like other parts of the application
    const calApiUrl = `https://api.cal.com/v2/event-types`
    
    // Generate slug from event type name
    const slug = genSlug(eventType.name)
    
    // Map our internal fields to Cal.com API field names
    // IMPORTANT: Cal API uses 'lengthInMinutes' for the duration with API version 2024-06-14
    const payload = {
      title: eventType.name,
      slug: slug,
      description: eventType.description || '',
      lengthInMinutes: eventType.duration, // Use lengthInMinutes as per Cal.com API docs
      hidden: !eventType.isActive,
      price: eventType.price,
      currency: 'USD',
      schedulingType: eventType.schedulingType || null, // Only set if defined
      seatsPerTimeSlot: eventType.maxParticipants || null, // Only set if defined
      locations: eventType.locations || [{ 
        type: 'link',
        link: 'https://dibs.coach/call/session',
        public: true
      }], // Default to link location
      bookingLimits: null,
      metadata: {
        discountPercentage: eventType.discountPercentage // Store discount percentage in metadata if provided
      },
      // Include new fields if they are provided
      beforeEventBuffer: eventType.beforeEventBuffer,
      afterEventBuffer: eventType.afterEventBuffer,
      minimumBookingNotice: eventType.minimumBookingNotice
    }
    
    console.log('[CREATE_CAL_EVENT_TYPE_REQUEST]', {
      url: calApiUrl,
      calUserId,
      clientId: env.NEXT_PUBLIC_CAL_CLIENT_ID,
      data: payload,
      timestamp: new Date().toISOString()
    });
    
    // Send the request to Cal.com API using the User's Access Token
    const response = await fetch(calApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use the managed user's access token for authorization
        'Authorization': `Bearer ${accessToken}`, 
        'cal-api-version': '2024-06-14'
        // Remove x-cal-managed-user-id as it's not needed with Bearer token auth
      },
      body: JSON.stringify(payload)
    });
    
    // Check for token expiration specifically (status 498)
    if (response.status === 498) {
      console.log('[CREATE_CAL_EVENT_TYPE_TOKEN_EXPIRED] Detected expired token, attempting refresh', {
        status: response.status,
        calUserId,
        timestamp: new Date().toISOString()
      });
      
      // If we have a userUlid, try to refresh token and retry
      if (userUlid) {
        try {
          // Refresh the token
          const refreshResult = await refreshCalAccessToken(userUlid);
          
          if (refreshResult.success && refreshResult.tokens?.access_token) {
            console.log('[CREATE_CAL_EVENT_TYPE_TOKEN_REFRESHED] Successfully refreshed token, retrying request', {
              calUserId,
              timestamp: new Date().toISOString()
            });
            
            // Retry the creation with the new token (but don't pass userUlid to prevent infinite loop)
            return await createCalEventType(
              refreshResult.tokens.access_token,
              calUserId,
              eventType
            );
          } else {
            console.error('[CREATE_CAL_EVENT_TYPE_TOKEN_REFRESH_FAILED]', {
              error: refreshResult.error,
              calUserId,
              timestamp: new Date().toISOString()
            });
          }
        } catch (refreshError) {
          console.error('[CREATE_CAL_EVENT_TYPE_TOKEN_REFRESH_ERROR]', {
            error: refreshError,
            calUserId,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.error('[CREATE_CAL_EVENT_TYPE_TOKEN_EXPIRED_NO_RETRY]', {
          reason: 'No userUlid provided for token refresh',
          calUserId,
          timestamp: new Date().toISOString()
        });
      }
      
      return null;
    }
    
    // Debugging response
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('[CREATE_CAL_EVENT_TYPE_PARSE_ERROR]', {
        text: responseText.substring(0, 200) + '...',
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        calUserId,
        timestamp: new Date().toISOString()
      });
      return null;
    }
    
    // Check for token expiration errors in the response
    if (responseData?.error?.code === 'TokenExpiredException' || 
        responseData?.error?.message?.includes('EXPIRED') ||
        (typeof responseData?.error?.details === 'string' && responseData?.error?.details.includes('EXPIRED'))) {
      
      console.log('[CREATE_CAL_EVENT_TYPE_TOKEN_EXPIRED_IN_RESPONSE] Detected expired token in response, attempting refresh', {
        status: response.status,
        error: responseData?.error,
        calUserId,
        timestamp: new Date().toISOString()
      });
      
      // If we have a userUlid, try to refresh token and retry
      if (userUlid) {
        try {
          // Refresh the token
          const refreshResult = await refreshCalAccessToken(userUlid);
          
          if (refreshResult.success && refreshResult.tokens?.access_token) {
            console.log('[CREATE_CAL_EVENT_TYPE_TOKEN_REFRESHED] Successfully refreshed token, retrying request', {
              calUserId,
              timestamp: new Date().toISOString()
            });
            
            // Retry the creation with the new token (but don't pass userUlid to prevent infinite loop)
            return await createCalEventType(
              refreshResult.tokens.access_token,
              calUserId,
              eventType
            );
          } else {
            console.error('[CREATE_CAL_EVENT_TYPE_TOKEN_REFRESH_FAILED]', {
              error: refreshResult.error,
              calUserId,
              timestamp: new Date().toISOString()
            });
          }
        } catch (refreshError) {
          console.error('[CREATE_CAL_EVENT_TYPE_TOKEN_REFRESH_ERROR]', {
            error: refreshError,
            calUserId,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      return null;
    }
    
    if (!response.ok) {
      console.error('[CREATE_CAL_EVENT_TYPE_ERROR]', {
        status: response.status,
        error: responseData,
        details: responseData?.error?.details ? JSON.stringify(responseData.error.details) : 'No detailed error information',
        calUserId,
        timestamp: new Date().toISOString()
      });
      return null;
    }
    
    return responseData?.data || null;
  } catch (error) {
    console.error('[CREATE_CAL_EVENT_TYPE_ERROR]', {
      error,
      calUserId,
      timestamp: new Date().toISOString()
    });
    return null;
  }
}

/**
 * Update an event type in Cal.com using the API
 * Will automatically retry once if token is expired
 */
async function syncEventTypeWithCal(
  accessToken: string,
  calUserId: number,
  calEventTypeId: number | null,
  eventType: {
    name: string
    description: string
    duration: number
    price: number
    isActive: boolean
    schedulingType: string
    maxParticipants?: number
    discountPercentage?: number
    // Add new fields
    locations?: {
      type: string
      link?: string
      displayName?: string
      address?: string
      public?: boolean
    }[]
    bookerLayouts?: {
      defaultLayout: string
      enabledLayouts: string[]
    }
    beforeEventBuffer?: number
    afterEventBuffer?: number
    minimumBookingNotice?: number
  },
  userUlid?: string // Added to support token refresh
): Promise<boolean> {
  try {
    // If no Cal event type ID, we need to create instead of update
    if (!calEventTypeId) {
      // Pass accessToken and updated eventType structure (with price) to create function
      const createdEventType = await createCalEventType(accessToken, calUserId, eventType, userUlid)
      return !!createdEventType
    }

    // Use the official Cal.com API URL
    const calApiUrl = `https://api.cal.com/v2/event-types/${calEventTypeId}`;
    
    // Format data according to Cal.com v2 API docs
    const calData = {
      title: eventType.name,
      description: eventType.description,
      lengthInMinutes: eventType.duration,
      hidden: !eventType.isActive,
      price: eventType.price,
      // Required booker layout configuration
      bookerLayouts: eventType.bookerLayouts || {
        defaultLayout: "month",
        enabledLayouts: ["month", "week", "column"]
      },
      // Required locations - maintain existing ones if updating
      locations: eventType.locations || [
        {
          type: "integrations:daily",
          displayName: "Video Call"
        }
      ],
      // Minimum booking notice in minutes
      minimumBookingNotice: eventType.minimumBookingNotice || 0,
      // Time buffers between meetings
      beforeEventBuffer: eventType.beforeEventBuffer || 0,
      afterEventBuffer: eventType.afterEventBuffer || 0,
      // Scheduling type
      schedulingType: eventType.schedulingType === 'MANAGED' ? null : eventType.schedulingType.toLowerCase(),
      // Seats configuration if needed
      seats: eventType.maxParticipants ? {
        seatsPerTimeSlot: eventType.maxParticipants,
        showAttendeeInfo: true,
        showAvailabilityCount: true
      } : undefined
    };
    
    console.log('[UPDATE_CAL_EVENT_TYPE_REQUEST]', {
      url: calApiUrl,
      data: calData,
      calEventTypeId,
      timestamp: new Date().toISOString()
    });

    // Send the request to Cal.com API using the User's Access Token
    const response = await fetch(calApiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        // Use the managed user's access token for authorization
        'Authorization': `Bearer ${accessToken}`,
        'cal-api-version': '2024-06-14'
        // Remove x-cal-managed-user-id as it's not needed with Bearer token auth
      },
      body: JSON.stringify(calData)
    });

    // Check for token expiration specifically (status 498)
    if (response.status === 498) {
      console.log('[UPDATE_CAL_EVENT_TYPE_TOKEN_EXPIRED] Detected expired token, attempting refresh', {
        status: response.status,
        calUserId,
        calEventTypeId,
        timestamp: new Date().toISOString()
      });
      
      // If we have a userUlid, try to refresh token and retry
      if (userUlid) {
        try {
          // Refresh the token
          const refreshResult = await refreshCalAccessToken(userUlid);
          
          if (refreshResult.success && refreshResult.tokens?.access_token) {
            console.log('[UPDATE_CAL_EVENT_TYPE_TOKEN_REFRESHED] Successfully refreshed token, retrying request', {
              calUserId,
              calEventTypeId,
              timestamp: new Date().toISOString()
            });
            
            // Retry the update with the new token (but don't pass userUlid to prevent infinite loop)
            return await syncEventTypeWithCal(
              refreshResult.tokens.access_token,
              calUserId,
              calEventTypeId,
              eventType
            );
          } else {
            console.error('[UPDATE_CAL_EVENT_TYPE_TOKEN_REFRESH_FAILED]', {
              error: refreshResult.error,
              calUserId,
              calEventTypeId,
              timestamp: new Date().toISOString()
            });
          }
        } catch (refreshError) {
          console.error('[UPDATE_CAL_EVENT_TYPE_TOKEN_REFRESH_ERROR]', {
            error: refreshError,
            calUserId,
            calEventTypeId,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.error('[UPDATE_CAL_EVENT_TYPE_TOKEN_EXPIRED_NO_RETRY]', {
          reason: 'No userUlid provided for token refresh',
          calUserId,
          calEventTypeId,
          timestamp: new Date().toISOString()
        });
      }
      
      return false;
    }

    // Debugging response
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('[UPDATE_CAL_EVENT_TYPE_PARSE_ERROR]', {
        text: responseText.substring(0, 200) + '...',
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        calEventTypeId,
        timestamp: new Date().toISOString()
      });
      return false;
    }

    // Check for token expiration errors in the response
    if (responseData?.error?.code === 'TokenExpiredException' || 
        responseData?.error?.message?.includes('EXPIRED') ||
        (typeof responseData?.error?.details === 'string' && responseData?.error?.details.includes('EXPIRED'))) {
          
      console.log('[UPDATE_CAL_EVENT_TYPE_TOKEN_EXPIRED_IN_RESPONSE] Detected expired token in response, attempting refresh', {
        status: response.status,
        error: responseData?.error,
        calUserId,
        calEventTypeId,
        timestamp: new Date().toISOString()
      });
      
      // If we have a userUlid, try to refresh token and retry
      if (userUlid) {
        try {
          // Refresh the token
          const refreshResult = await refreshCalAccessToken(userUlid);
          
          if (refreshResult.success && refreshResult.tokens?.access_token) {
            console.log('[UPDATE_CAL_EVENT_TYPE_TOKEN_REFRESHED] Successfully refreshed token, retrying request', {
              calUserId,
              calEventTypeId,
              timestamp: new Date().toISOString()
            });
            
            // Retry the update with the new token (but don't pass userUlid to prevent infinite loop)
            return await syncEventTypeWithCal(
              refreshResult.tokens.access_token,
              calUserId,
              calEventTypeId,
              eventType
            );
          } else {
            console.error('[UPDATE_CAL_EVENT_TYPE_TOKEN_REFRESH_FAILED]', {
              error: refreshResult.error,
              calUserId,
              calEventTypeId,
              timestamp: new Date().toISOString()
            });
          }
        } catch (refreshError) {
          console.error('[UPDATE_CAL_EVENT_TYPE_TOKEN_REFRESH_ERROR]', {
            error: refreshError,
            calUserId,
            calEventTypeId,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      return false;
    }

    if (!response.ok) {
      console.error('[UPDATE_CAL_EVENT_TYPE_ERROR]', {
        status: response.status,
        statusText: response.statusText,
        error: responseData,
        calUserId,
        calEventTypeId,
        timestamp: new Date().toISOString()
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('[UPDATE_CAL_EVENT_TYPE_ERROR]', {
      error,
      calUserId,
      calEventTypeId,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Delete an event type in Cal.com using the API
 * Will automatically retry once if token is expired
 */
async function deleteCalEventType(
  accessToken: string,
  calUserId: number,
  calEventTypeId: number,
  userUlid?: string // Added to support token refresh
): Promise<boolean> {
  try {
    // Use the official Cal.com API URL
    const calApiUrl = `https://api.cal.com/v2/event-types/${calEventTypeId}`;
    
    console.log('[DELETE_CAL_EVENT_TYPE_REQUEST]', {
      url: calApiUrl,
      calEventTypeId,
      timestamp: new Date().toISOString()
    });

    const response = await fetch(calApiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // Use the managed user's access token for authorization
        'Authorization': `Bearer ${accessToken}`,
        'cal-api-version': '2024-06-14'
        // Remove x-cal-managed-user-id as it's not needed with Bearer token auth
      }
    });

    // Check for token expiration specifically (status 498)
    if (response.status === 498) {
      console.log('[DELETE_CAL_EVENT_TYPE_TOKEN_EXPIRED] Detected expired token, attempting refresh', {
        status: response.status,
        calUserId,
        calEventTypeId,
        timestamp: new Date().toISOString()
      });
      
      // If we have a userUlid, try to refresh token and retry
      if (userUlid) {
        try {
          // Refresh the token
          const refreshResult = await refreshCalAccessToken(userUlid);
          
          if (refreshResult.success && refreshResult.tokens?.access_token) {
            console.log('[DELETE_CAL_EVENT_TYPE_TOKEN_REFRESHED] Successfully refreshed token, retrying request', {
              calUserId,
              calEventTypeId,
              timestamp: new Date().toISOString()
            });
            
            // Retry the deletion with the new token (but don't pass userUlid to prevent infinite loop)
            return await deleteCalEventType(
              refreshResult.tokens.access_token,
              calUserId,
              calEventTypeId
            );
          } else {
            console.error('[DELETE_CAL_EVENT_TYPE_TOKEN_REFRESH_FAILED]', {
              error: refreshResult.error,
              calUserId,
              calEventTypeId,
              timestamp: new Date().toISOString()
            });
          }
        } catch (refreshError) {
          console.error('[DELETE_CAL_EVENT_TYPE_TOKEN_REFRESH_ERROR]', {
            error: refreshError,
            calUserId,
            calEventTypeId,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.error('[DELETE_CAL_EVENT_TYPE_TOKEN_EXPIRED_NO_RETRY]', {
          reason: 'No userUlid provided for token refresh',
          calUserId,
          calEventTypeId,
          timestamp: new Date().toISOString()
        });
      }
      
      return false;
    }

    // Debugging response
    const responseText = await response.text();
    let responseData;
    
    try {
      if (responseText) {
        responseData = JSON.parse(responseText);
      }
    } catch (e) {
      console.error('[DELETE_CAL_EVENT_TYPE_PARSE_ERROR]', {
        text: responseText.substring(0, 200) + '...',
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        calEventTypeId,
        timestamp: new Date().toISOString()
      });
      // Don't return false yet, as empty responses are common for DELETE
    }

    // Check for token expiration errors in the response
    if (responseData?.error?.code === 'TokenExpiredException' || 
        responseData?.error?.message?.includes('EXPIRED') ||
        (typeof responseData?.error?.details === 'string' && responseData?.error?.details.includes('EXPIRED'))) {
          
      console.log('[DELETE_CAL_EVENT_TYPE_TOKEN_EXPIRED_IN_RESPONSE] Detected expired token in response, attempting refresh', {
        status: response.status,
        error: responseData?.error,
        calUserId,
        calEventTypeId,
        timestamp: new Date().toISOString()
      });
      
      // If we have a userUlid, try to refresh token and retry
      if (userUlid) {
        try {
          // Refresh the token
          const refreshResult = await refreshCalAccessToken(userUlid);
          
          if (refreshResult.success && refreshResult.tokens?.access_token) {
            console.log('[DELETE_CAL_EVENT_TYPE_TOKEN_REFRESHED] Successfully refreshed token, retrying request', {
              calUserId,
              calEventTypeId,
              timestamp: new Date().toISOString()
            });
            
            // Retry the deletion with the new token (but don't pass userUlid to prevent infinite loop)
            return await deleteCalEventType(
              refreshResult.tokens.access_token,
              calUserId,
              calEventTypeId
            );
          } else {
            console.error('[DELETE_CAL_EVENT_TYPE_TOKEN_REFRESH_FAILED]', {
              error: refreshResult.error,
              calUserId,
              calEventTypeId,
              timestamp: new Date().toISOString()
            });
          }
        } catch (refreshError) {
          console.error('[DELETE_CAL_EVENT_TYPE_TOKEN_REFRESH_ERROR]', {
            error: refreshError,
            calUserId,
            calEventTypeId,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      return false;
    }

    if (!response.ok) {
      console.error('[DELETE_CAL_EVENT_TYPE_ERROR]', {
        status: response.status,
        statusText: response.statusText,
        response: responseData || responseText,
        calUserId,
        calEventTypeId,
        timestamp: new Date().toISOString()
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('[DELETE_CAL_EVENT_TYPE_ERROR]', {
      error,
      calUserId,
      calEventTypeId,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Generate a slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Calculate event price based on hourly rate and duration
 */
function calculateEventPrice(hourlyRate: number, durationMinutes: number): number {
  if (hourlyRate <= 0 || durationMinutes <= 0) return 0;
  const price = (hourlyRate / 60) * durationMinutes;
  // Round to 2 decimal places
  return Math.round(price * 100) / 100;
}

/**
 * Map database event types to the UI format
 */
const mapDbEventTypeToUi = (eventType: Record<string, any>): EventType => {
  return dbToEventType(eventType);
};

/**
 * Create default event types for a new coach
 */
export async function createDefaultEventTypes(userUlid: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    // Correct: Initialize server client
    const supabase = createAuthClient()
    const { data: calendarIntegration, error: calendarError } = await supabase
      .from('CalendarIntegration')
      .select(`
        ulid,
        calManagedUserId,
        calAccessToken,
        calAccessTokenExpiresAt
      `)
      .eq('userUlid', userUlid)
      .maybeSingle()

    if (calendarError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR]', {
        error: calendarError,
        userUlid,
        timestamp: new Date().toISOString()
      })
      return {
        data: { success: false },
        error: { 
          code: 'DATABASE_ERROR', 
          message: 'Failed to fetch calendar integration' 
        }
      }
    }

    if (!calendarIntegration) {
      // Not an error, just no calendar integration found yet
      console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO]', {
        message: 'No calendar integration found for user',
        userUlid,
        timestamp: new Date().toISOString()
      })
      
      return {
        data: { success: false },
        error: { 
          code: 'CREATE_ERROR', 
          message: 'Calendar integration needed before creating event types' 
        }
      }
    }

    let accessToken = calendarIntegration.calAccessToken;
    const expiresAt = calendarIntegration.calAccessTokenExpiresAt;

    // Check if token is expired or missing, and try to refresh
    if (!accessToken || await isCalTokenExpired(expiresAt)) {
      console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Token expired or missing, attempting refresh.', { userUlid });
      const refreshResult = await refreshCalAccessToken(userUlid);
      
      if (refreshResult.success && refreshResult.tokens?.access_token) {
        accessToken = refreshResult.tokens.access_token;
        console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Token refreshed successfully.', { userUlid });
      } else {
        console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Token refresh failed.', {
          userUlid,
          error: refreshResult.error,
          timestamp: new Date().toISOString()
        });
        return {
          data: { success: false },
          error: { 
            code: 'UNAUTHORIZED', 
            message: `Failed to refresh Cal.com token: ${refreshResult.error || 'Unknown error'}. Please reconnect Cal.com in settings.`
          }
        }
      }
    }

    // Fetch Coach Profile for hourly rate needed for price calculation
    const { data: coachProfile, error: profileError } = await supabase
      .from('CoachProfile')
      .select('hourlyRate')
      .eq('userUlid', userUlid)
      .maybeSingle();

    if (profileError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Failed to fetch coach profile.', { userUlid, error: profileError });
      // Decide if this is a hard error or if we can proceed with free types only
      // For now, let's return an error
      return {
        data: { success: false },
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch coach profile for pricing.' }
      };
    }
    const hourlyRate = coachProfile?.hourlyRate as number | null | undefined;
    
    // Validate hourly rate
    const hasValidHourlyRate = hourlyRate !== null && hourlyRate !== undefined && hourlyRate > 0;
    
    // Use the hourly rate directly for calculations
    const numericHourlyRate = hourlyRate || 0;

    // Define default event types
    const defaultEventTypes: DefaultEventType[] = [
      {
        name: 'Coaching Session',
        description: '30-minute 1:1 coaching video call',
        duration: 30,
        isFree: false,
        isActive: true,
        isDefault: true,
        scheduling: 'MANAGED',
        position: 0,
        // Add new fields required by Cal.com API
        locations: [
          {
            type: "integrations:daily",
            displayName: "Video Call"
          }
        ],
        beforeEventBuffer: 5,
        afterEventBuffer: 5,
        minimumBookingNotice: 0
      },
      {
        name: '1:1 Deep Dive Coaching Call',
        description: 'A comprehensive 60-minute 1-on-1 coaching session for deeper exploration and problem-solving',
        duration: 60,
        isFree: false,
        isActive: true,
        isDefault: true,
        scheduling: 'MANAGED',
        position: 1,
        // Add new fields required by Cal.com API
        locations: [
          {
            type: "integrations:daily",
            displayName: "Video Call"
          }
        ],
        beforeEventBuffer: 5,
        afterEventBuffer: 5,
        minimumBookingNotice: 0
      },
      {
        name: 'Get to Know You',
        description: '15-minute goal setting and introduction session',
        duration: 15,
        isFree: true,
        isActive: true,
        isDefault: true,
        scheduling: 'MANAGED',
        position: 2,
        // Add new fields required by Cal.com API
        locations: [
          {
            type: "integrations:daily",
            displayName: "Video Call"
          }
        ],
        beforeEventBuffer: 0,
        afterEventBuffer: 0,
        minimumBookingNotice: 0
      }
    ]
    
    // Check if any default event types are non-free
    const hasNonFreeDefaultEvents = defaultEventTypes.some(et => !et.isFree);
    
    if (hasNonFreeDefaultEvents && !hasValidHourlyRate) {
       console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Hourly rate missing or invalid for paid event type.', { 
           userUlid, 
           hourlyRate: hourlyRate
       });
       return {
         data: { success: false },
         error: {
           code: 'VALIDATION_ERROR',
           message: 'Please set a valid hourly rate in your coach profile before saving paid event types.'
         }
       };
    }

    // Create each event type
    for (let i = 0; i < defaultEventTypes.length; i++) {
      const eventType = defaultEventTypes[i];
      const newUlid = generateUlid();
      let calEventType: CalEventTypeResponse | null = null;
      
      // 1. Try to create in Cal.com API first (if integration exists)
      if (calendarIntegration.calManagedUserId) {
        try {
          // Skip creating paid default event if rate is invalid
          if (!eventType.isFree && numericHourlyRate <= 0) {
             console.warn('[CREATE_DEFAULT_EVENT_TYPE_SKIP] Skipping paid default event due to missing/invalid hourly rate.', {
                userUlid,
                eventName: eventType.name,
                hourlyRate: numericHourlyRate
             });
             continue; // Skip this iteration
          }
          
          calEventType = await createCalEventType(
            accessToken,
            calendarIntegration.calManagedUserId,
            {
              name: eventType.name,
              description: eventType.description,
              duration: eventType.duration,
              price: eventType.isFree ? 0 : calcEventPrice(numericHourlyRate, eventType.duration),
              isActive: eventType.isActive,
              schedulingType: eventType.scheduling
            },
            userUlid // Pass userUlid to enable token refresh if needed
          );
        } catch (error) {
          console.error('[CREATE_DEFAULT_EVENT_TYPE_CAL_ERROR]', {
            error,
            eventType: eventType.name,
            userUlid,
            timestamp: new Date().toISOString()
          });
          // Do not proceed to DB insert if Cal.com failed
        }
      }
      
      // 2. Create in database ONLY if Cal.com succeeded (or wasn't applicable)
      if (!calendarIntegration.calManagedUserId || calEventType) {
        const { error: insertError } = await supabase
          .from('CalEventType')
          .insert({
            ulid: newUlid,
            calendarIntegrationUlid: calendarIntegration.ulid,
            calEventTypeId: calEventType?.id || null,
            name: eventType.name,
            description: eventType.description,
            lengthInMinutes: eventType.duration,
            isFree: eventType.isFree,
            isActive: eventType.isActive,
            isDefault: eventType.isDefault,
            slug: calEventType?.slug || genSlug(eventType.name),
            position: eventType.position,
            scheduling: eventType.scheduling as 'MANAGED' | 'OFFICE_HOURS' | 'GROUP_SESSION',
            maxParticipants: null,
            discountPercentage: null,
            organizationUlid: null,
            // New fields
            locations: eventType.locations || [{ type: 'integrations:daily', displayName: 'Video Call' }],
            beforeEventBuffer: eventType.beforeEventBuffer || 0,
            afterEventBuffer: eventType.afterEventBuffer || 0,
            minimumBookingNotice: eventType.minimumBookingNotice || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

        if (insertError) {
          console.error('[CREATE_DEFAULT_EVENT_TYPE_INSERT_DB_ERROR]', {
            error: insertError,
            eventType: eventType.name,
            newUlid,
            timestamp: new Date().toISOString()
          });
          // Continue to try creating other default event types
        } else {
          console.log('[CREATE_DEFAULT_EVENT_TYPE_SUCCESS]', {
            eventType: eventType.name,
            newUlid,
            calEventTypeId: calEventType?.id,
            timestamp: new Date().toISOString()
          });
        }
      } else {
          console.warn('[CREATE_DEFAULT_EVENT_TYPE_CAL_FAILED_SKIP_DB]', {
            message: "Cal.com creation failed for default event, skipping database insert.",
            eventType: eventType.name,
            userUlid,
            timestamp: new Date().toISOString()
          });
      }
    }

    return {
      data: { success: true },
      error: null
    }
  } catch (error) {
    console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR]', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return {
      data: { success: false },
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    }
  }
}

/**
 * Create default event types for all coaches that don't have any event types yet
 */
export async function createDefaultEventTypesForAllCoaches(): Promise<ApiResponse<{ success: boolean, stats: { total: number, created: number, skipped: number, errors: number } }>> {
  try {
    // Correct: Initialize server client
    const supabase = createAuthClient()
    
    // Get all users with coach capability
    const { data: coachUsers, error: coachError } = await supabase
      .from('User')
      .select('ulid')
      .contains('capabilities', ['COACH'])
    
    if (coachError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ALL_ERROR]', {
        error: coachError,
        timestamp: new Date().toISOString()
      })
      return {
        data: null,
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch coach users' }
      }
    }
    
    if (!coachUsers || coachUsers.length === 0) {
      return {
        data: { 
          success: true, 
          stats: { total: 0, created: 0, skipped: 0, errors: 0 } 
        },
        error: null
      }
    }
    
    console.log('[CREATE_DEFAULT_EVENT_TYPES_ALL]', {
      coachCount: coachUsers.length,
      timestamp: new Date().toISOString()
    })
    
    // Stats to track results
    const stats = {
      total: coachUsers.length,
      created: 0,
      skipped: 0,
      errors: 0
    }
    
    // Process each coach
    for (const coach of coachUsers) {
      try {
        // Check if coach already has event types
        const { data: existingEventTypes, error: eventTypesError } = await supabase
          .from('CalEventType')
          .select('ulid')
          .eq('calendarIntegrationUlid', coach.ulid)
          .limit(1)
        
        if (eventTypesError) {
          console.error('[CREATE_DEFAULT_EVENT_TYPES_CHECK_ERROR]', {
            error: eventTypesError,
            coachUlid: coach.ulid,
            timestamp: new Date().toISOString()
          })
          stats.errors++
          continue
        }
        
        // Skip if coach already has event types
        if (existingEventTypes && existingEventTypes.length > 0) {
          console.log('[CREATE_DEFAULT_EVENT_TYPES_SKIP]', {
            coachUlid: coach.ulid,
            reason: 'Already has event types',
            timestamp: new Date().toISOString()
          })
          stats.skipped++
          continue
        }
        
        // Create default event types for this coach
        const result = await createDefaultEventTypes(coach.ulid)
        
        if (result.error) {
          console.error('[CREATE_DEFAULT_EVENT_TYPES_COACH_ERROR]', {
            error: result.error,
            coachUlid: coach.ulid,
            timestamp: new Date().toISOString()
          })
          stats.errors++
        } else {
          console.log('[CREATE_DEFAULT_EVENT_TYPES_COACH_SUCCESS]', {
            coachUlid: coach.ulid,
            timestamp: new Date().toISOString()
          })
          stats.created++
        }
      } catch (error) {
        console.error('[CREATE_DEFAULT_EVENT_TYPES_COACH_ERROR]', {
          error,
          coachUlid: coach.ulid,
          timestamp: new Date().toISOString()
        })
        stats.errors++
      }
    }
    
    console.log('[CREATE_DEFAULT_EVENT_TYPES_ALL_COMPLETE]', {
      stats,
      timestamp: new Date().toISOString()
    })
    
    return {
      data: { success: true, stats },
      error: null
    }
  } catch (error) {
    console.error('[CREATE_DEFAULT_EVENT_TYPES_ALL_ERROR]', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return {
      data: null,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    }
  }
}

/**
 * Create a free intro call event type for a coach
 * This is useful for coaches who want to offer a free intro call to potential clients
 */
export async function createFreeIntroCallEventType(userUlid: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    // Correct: Initialize server client
    const supabase = createAuthClient()
    // Get calendar integration for the user
    const { data: calendarIntegration, error: calendarError } = await supabase
      .from('CalendarIntegration')
      .select(`
        ulid,
        calManagedUserId,
        calAccessToken,
        calAccessTokenExpiresAt
      `)
      .eq('userUlid', userUlid)
      .maybeSingle()

    if (calendarError) {
      console.error('[CREATE_FREE_INTRO_EVENT_TYPE_ERROR]', {
        error: calendarError,
        userUlid,
        timestamp: new Date().toISOString()
      })
      return {
        data: { success: false },
        error: { 
          code: 'DATABASE_ERROR', 
          message: 'Failed to fetch calendar integration' 
        }
      }
    }

    if (!calendarIntegration) {
      console.log('[CREATE_FREE_INTRO_EVENT_TYPE_INFO]', {
        message: 'No calendar integration found for user',
        userUlid,
        timestamp: new Date().toISOString()
      })
      
      return {
        data: { success: false },
        error: { 
          code: 'CREATE_ERROR', 
          message: 'Calendar integration needed before creating event types' 
        }
      }
    }

    let accessToken = calendarIntegration.calAccessToken;
    const expiresAt = calendarIntegration.calAccessTokenExpiresAt;

    // Check if token is expired or missing, and try to refresh
    if (!accessToken || await isCalTokenExpired(expiresAt)) {
      console.log('[CREATE_FREE_INTRO_EVENT_TYPE_INFO] Token expired or missing, attempting refresh.', { userUlid });
      const refreshResult = await refreshCalAccessToken(userUlid);
      
      if (refreshResult.success && refreshResult.tokens?.access_token) {
        accessToken = refreshResult.tokens.access_token;
        console.log('[CREATE_FREE_INTRO_EVENT_TYPE_INFO] Token refreshed successfully.', { userUlid });
      } else {
        console.error('[CREATE_FREE_INTRO_EVENT_TYPE_ERROR] Token refresh failed.', {
          userUlid,
          error: refreshResult.error,
          timestamp: new Date().toISOString()
        });
        return {
          data: { success: false },
          error: { 
            code: 'UNAUTHORIZED', 
            message: `Failed to refresh Cal.com token: ${refreshResult.error || 'Unknown error'}. Please reconnect Cal.com in settings.`
          }
        }
      }
    }

    // Fetch Coach Profile for hourly rate (although only free type is created here)
    // We might fetch it anyway for consistency or future expansion
    const { data: coachProfile, error: profileError } = await supabase
      .from('CoachProfile')
      .select('hourlyRate')
      .eq('userUlid', userUlid)
      .maybeSingle();
      
     if (profileError) {
      console.error('[CREATE_FREE_INTRO_EVENT_TYPE_ERROR] Failed to fetch coach profile.', { userUlid, error: profileError });
       // Potentially ignore this for free calls, but log it.
    }
    // const hourlyRateDecimal = coachProfile?.hourlyRate as Decimal | null | undefined;
    // const numericHourlyRate = hourlyRateDecimal ? new Decimal(hourlyRateDecimal).toNumber() : 0;
    // Not strictly needed for free call, but kept for potential future logic

    // Define the free intro call event type
    const eventType: DefaultEventType = {
      name: 'Get to Know You',
      description: '15-minute goal setting and introduction session',
      duration: 15,
      isFree: true,
      isActive: true,
      isDefault: true,
      scheduling: 'MANAGED',
      position: 1,
      // Add new fields required by Cal.com API
      locations: [
        {
          type: "integrations:daily",
          displayName: "Video Call"
        }
      ],
      beforeEventBuffer: 0,
      afterEventBuffer: 0,
      minimumBookingNotice: 0
    }

    const newUlid = generateUlid();
    let calEventType: CalEventTypeResponse | null = null;
    
    // 1. Try to create in Cal.com API first (if integration exists)
    if (calendarIntegration.calManagedUserId) {
      try {
        calEventType = await createCalEventType(
          accessToken,
          calendarIntegration.calManagedUserId,
          {
            name: eventType.name,
            description: eventType.description,
            duration: eventType.duration,
            // Free intro call always has price 0
            price: 0, 
            isActive: eventType.isActive,
            schedulingType: eventType.scheduling
          },
          userUlid // Pass userUlid to enable token refresh if needed
        );
      } catch (error) {
        console.error('[CREATE_FREE_INTRO_EVENT_TYPE_CAL_ERROR]', {
          error,
          eventType: eventType.name,
          userUlid,
          timestamp: new Date().toISOString()
        });
         // Do not proceed to DB insert if Cal.com failed
      }
    }
    
    // Check if this event type already exists locally (before attempting insert)
    const { data: existingEventTypes, error: checkError } = await supabase
      .from('CalEventType')
      .select('ulid')
      .eq('calendarIntegrationUlid', calendarIntegration.ulid)
      .eq('name', eventType.name)
      .eq('duration', eventType.duration)
      .limit(1)
    
    if (checkError) {
      console.error('[CREATE_FREE_INTRO_EVENT_TYPE_CHECK_ERROR]', {
        error: checkError,
        userUlid,
        timestamp: new Date().toISOString()
      })
      // Continue anyway since it's better to try creating it
    } else if (existingEventTypes && existingEventTypes.length > 0) {
      console.log('[CREATE_FREE_INTRO_EVENT_TYPE_EXISTS]', {
        userUlid,
        existingEventTypeUlid: existingEventTypes[0].ulid,
        timestamp: new Date().toISOString()
      })
      
      // Return success since it already exists
      return {
        data: { success: true },
        error: null
      }
    }
    
    // 2. Create in database ONLY if Cal.com succeeded (or wasn't applicable)
    // AND if it doesn't already exist locally.
    if (!calEventType) {
      console.warn('[CREATE_FREE_INTRO_EVENT_TYPE_CAL_FAILED_SKIP_DB]', {
          message: "Cal.com creation failed for free intro event, skipping database insert.",
          eventType: eventType.name,
          userUlid,
          timestamp: new Date().toISOString()
      });
      // If Cal failed, return an error even if it didn't exist locally before
      return {
          data: { success: false },
          error: { 
              code: 'CREATE_ERROR', 
              message: 'Failed to create event type on Cal.com.' 
          }
      }
    } else {
      const { data: insertData, error: insertError } = await supabase
        .from('CalEventType')
        .insert({
          ulid: newUlid,
          calendarIntegrationUlid: calendarIntegration.ulid,
          calEventTypeId: calEventType.id,
          name: eventType.name,
          description: eventType.description,
          lengthInMinutes: eventType.duration,
          isFree: eventType.isFree,
          isActive: eventType.isActive,
          isDefault: eventType.isDefault,
          slug: calEventType.slug,
          position: eventType.position,
          scheduling: eventType.scheduling as 'MANAGED' | 'OFFICE_HOURS' | 'GROUP_SESSION',
          maxParticipants: null,
          discountPercentage: null,
          organizationUlid: null,
          // New fields
          locations: eventType.locations || [{ 
            type: 'link',
            link: 'https://dibs.coach/call/session',
            public: true
          }],
          beforeEventBuffer: eventType.beforeEventBuffer || 0,
          afterEventBuffer: eventType.afterEventBuffer || 0,
          minimumBookingNotice: eventType.minimumBookingNotice || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

      if (insertError) {
        console.error('[CREATE_FREE_INTRO_EVENT_TYPE_INSERT_DB_ERROR]', {
          error: insertError,
          eventType: eventType.name,
          newUlid,
          timestamp: new Date().toISOString()
        });
        return {
          data: { success: false },
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to create free intro event type in database' 
          }
        }
      }
      
      console.log('[CREATE_FREE_INTRO_EVENT_TYPE_SUCCESS]', {
        eventType: eventType.name,
        newUlid,
        calEventTypeId: calEventType.id,
        timestamp: new Date().toISOString()
      });
    }

    return {
      data: { success: true },
      error: null
    }
  } catch (error) {
    console.error('[CREATE_FREE_INTRO_EVENT_TYPE_ERROR]', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return {
      data: { success: false },
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    }
  }
} 

/**
 * Creates default event types with unique slugs by appending a timestamp
 * This helps avoid collisions with "hidden" event types in Cal.com
 */
export async function createDefaultEventTypesWithUniqueSlug(userUlid: string): Promise<ApiResponse<{ success: boolean, totalCreated?: number, createdEventTypes?: any[] }>> {
  try {
    // Get Supabase client
    const supabase = createAuthClient()

    // Get the calendar integration for the user
    const { data: calendarIntegration, error: calendarError } = await supabase
      .from('CalendarIntegration')
      .select('ulid, calManagedUserId, calAccessToken, calAccessTokenExpiresAt')
      .eq('userUlid', userUlid)
      .maybeSingle()

    if (calendarError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Calendar Integration lookup', { 
        error: calendarError, 
        userUlid,
        timestamp: new Date().toISOString()
      })
      return {
        data: { success: false },
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch calendar integration' }
      }
    }

    if (!calendarIntegration || !calendarIntegration.calManagedUserId) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] No Cal.com connection found', { 
        userUlid,
        timestamp: new Date().toISOString()
      })
      return {
        data: { success: false },
        error: { 
          code: 'NOT_FOUND', 
          message: 'No Cal.com integration found for this user. Please connect Cal.com in settings.'
        }
      }
    }

    // Fetch coach's hourly rate for pricing
    const { data: coachProfile, error: profileError } = await supabase
      .from('CoachProfile')
      .select('hourlyRate')
      .eq('userUlid', userUlid)
      .maybeSingle()

    if (profileError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Coach Profile lookup', { 
        error: profileError, 
        userUlid, 
        timestamp: new Date().toISOString()
      })
      // Continue with default hourly rate as fallback
    }

    const hourlyRate = coachProfile?.hourlyRate as number || 0
    const hasValidHourlyRate = hourlyRate !== null && hourlyRate !== undefined && hourlyRate > 0

    // Check if token is valid
    const isTokenExpired = await isCalTokenExpired(
      calendarIntegration.calAccessToken,
      Number(calendarIntegration.calAccessTokenExpiresAt)
    )

    let accessToken = calendarIntegration.calAccessToken

    // Refresh token if needed
    if (isTokenExpired) {
      console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Cal token expired, refreshing...', { 
        userUlid, 
        timestamp: new Date().toISOString() 
      })
      
      const refreshResult = await refreshCalAccessToken(userUlid)
      
      if (refreshResult.success && refreshResult.tokens) {
        accessToken = refreshResult.tokens.access_token
      } else {
        console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Failed to refresh token', { 
          error: refreshResult.error, 
          userUlid, 
          timestamp: new Date().toISOString() 
        })
        return {
          data: { success: false },
          error: { 
            code: 'UNAUTHORIZED', // Use valid code from ApiErrorCode 
            message: 'Failed to refresh Cal.com token. Please reconnect in settings.'
          }
        }
      }
    }

    // Create unique suffix for each event type to ensure no slug collisions
    const uniqueSuffix = Math.floor(Date.now() / 1000).toString()
    const calUserId = calendarIntegration.calManagedUserId

    // Define default event types
    const defaultEventTypes: DefaultEventType[] = [
      {
        name: '1:1 Q&A Coaching Call',
        description: '30-minute Q&A coaching call to address specific questions',
        duration: 30,
        isFree: false,
        isActive: true,
        isDefault: true,
        scheduling: 'MANAGED' as const,
        position: 0,
        // Use unique slug with timestamp
        slug: `coaching-qa-30-${uniqueSuffix}`,
        // Add locations and other required fields
        locations: [
          {
            type: "link",
            link: "https://dibs.coach/call/session",
            public: true
          }
        ],
        beforeEventBuffer: 0,
        afterEventBuffer: 0,
        minimumBookingNotice: 60,
        maxParticipants: 1,
        discountPercentage: undefined
      },
      {
        name: '1:1 Deep Dive Coaching Call',
        description: 'A comprehensive 60-minute 1-on-1 coaching session for deeper exploration and problem-solving.',
        duration: 60,
        isFree: false,
        isActive: true,
        isDefault: true,
        scheduling: 'MANAGED' as const,
        position: 1,
        // Use unique slug with timestamp
        slug: `coaching-deep-dive-60-${uniqueSuffix}`,
        locations: [
          {
            type: "link",
            link: "https://dibs.coach/call/session",
            public: true
          }
        ],
        beforeEventBuffer: 0,
        afterEventBuffer: 0,
        minimumBookingNotice: 60,
        maxParticipants: 1,
        discountPercentage: undefined
      },
      {
        name: 'Get to Know You',
        description: '15-minute goal setting and introduction session',
        duration: 15,
        isFree: true,
        isActive: true,
        isDefault: true,
        scheduling: 'MANAGED' as const,
        position: 2,
        // Use unique slug with timestamp
        slug: `get-to-know-you-15-${uniqueSuffix}`,
        locations: [
          {
            type: "link",
            link: "https://dibs.coach/call/session",
            public: true
          }
        ],
        beforeEventBuffer: 0,
        afterEventBuffer: 0,
        minimumBookingNotice: 60,
        maxParticipants: 1,
        discountPercentage: undefined
      }
    ]
    
    const createdEventTypes = []
    let totalCreatedCount = 0
    let allCreationFailed = true
    
    // Create each event type
    for (const eventType of defaultEventTypes) {
      // Skip paid event types if no valid hourly rate
      if (!eventType.isFree && !hasValidHourlyRate) {
        console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Skipping paid event type due to missing hourly rate', {
          eventType: eventType.name,
          userUlid,
          timestamp: new Date().toISOString()
        })
        continue
      }
      
      // Calculate price for paid event types
      const price = eventType.isFree ? 0 : calcEventPrice(hourlyRate, eventType.duration)
      
      try {
        // Create in Cal.com
        const calEventType = await createCalEventType(
          accessToken,
          calUserId,
          {
            name: eventType.name,
            description: eventType.description,
            duration: eventType.duration, // This gets mapped to lengthInMinutes in createCalEventType
            price,
            isActive: eventType.isActive,
            schedulingType: 'MANAGED',
            maxParticipants: eventType.maxParticipants,
            discountPercentage: eventType.discountPercentage,
            locations: eventType.locations,
            beforeEventBuffer: eventType.beforeEventBuffer,
            afterEventBuffer: eventType.afterEventBuffer,
            minimumBookingNotice: eventType.minimumBookingNotice
          },
          userUlid
        )
        
        if (!calEventType) {
          console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Failed to create Cal.com event type', {
            eventType: eventType.name,
            userUlid,
            timestamp: new Date().toISOString()
          })
          continue
        }
        
        // Create in our database
        const { data: dbEventType, error: insertError } = await supabase
          .from('CalEventType')
          .insert({
            ulid: generateUlid(),
            calendarIntegrationUlid: calendarIntegration.ulid,
            calEventTypeId: calEventType.id,
            name: eventType.name,
            description: eventType.description,
            lengthInMinutes: eventType.duration,
            isFree: eventType.isFree,
            isActive: eventType.isActive,
            isDefault: true,
            scheduling: eventType.scheduling as 'MANAGED' | 'OFFICE_HOURS' | 'GROUP_SESSION',
            position: eventType.position,
            price,
            currency: 'USD',
            slug: calEventType.slug,
            locations: eventType.locations,
            bookerLayouts: null, // Set to null since field exists in DB schema
            beforeEventBuffer: eventType.beforeEventBuffer || 0, 
            afterEventBuffer: eventType.afterEventBuffer || 0,
            minimumBookingNotice: eventType.minimumBookingNotice || 0,
            maxParticipants: eventType.maxParticipants,
            discountPercentage: eventType.discountPercentage,
            metadata: {
              isRequired: eventType.name.includes('Q&A') || eventType.name.includes('Deep Dive')
            },
            // Add required fields that were missing
            organizationUlid: null,
            hidden: !eventType.isActive,
            requiresConfirmation: false,
            slotInterval: 30,
            customName: null,
            color: null,
            useDestinationCalendarEmail: true,
            hideCalendarEventDetails: false,
            successRedirectUrl: null,
            bookingLimits: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .select()
          .single()
        
        if (insertError) {
          console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Failed to create DB event type', {
            eventType: eventType.name,
            error: insertError,
            userUlid,
            timestamp: new Date().toISOString()
          })
          continue
        }
        
        createdEventTypes.push(dbEventType)
        totalCreatedCount++
        allCreationFailed = false
      } catch (error) {
        console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Error creating event type', {
          eventType: eventType.name,
          error,
          userUlid,
          timestamp: new Date().toISOString()
        })
      }
    }
    
    // If all creation attempts failed, return an error
    if (allCreationFailed && defaultEventTypes.length > 0) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] All event type creation attempts failed', {
        userUlid,
        timestamp: new Date().toISOString()
      })
      return {
        data: { success: false },
        error: { 
          code: 'CREATE_ERROR', 
          message: 'Failed to create default event types. Check Cal.com API response for details.' 
        }
      }
    }
    
    return {
      data: { 
        success: true, 
        totalCreated: totalCreatedCount,
        createdEventTypes: createdEventTypes
      },
      error: null
    }
  } catch (error) {
    console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR]', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return {
      data: { success: false },
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    }
  }
  
  // Explicit return for the case when no default event types were defined
  return {
    data: { 
      success: true, 
      totalCreated: 0,
      createdEventTypes: []
    },
    error: null
  }
} 