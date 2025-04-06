'use server'

import { auth } from '@clerk/nextjs/server'
import { createAuthClient } from '@/utils/supabase/server'
import { ApiResponse } from '@/utils/types/api'
import { env } from '@/lib/env'
import { nanoid } from 'nanoid'
import { generateUlid } from '@/utils/ulid'
import { type EventType } from '@/components/cal/EventTypeCard'
import { isCalTokenExpired, refreshCalAccessToken } from '@/utils/auth/cal-token-service'
import { Decimal } from '@prisma/client/runtime/library'
import type { Database } from '@/types/supabase'
import { fetchCoachHourlyRate } from '@/utils/actions/cal-coach-rate-actions'

type DbCalEventType = Database['public']['Tables']['CalEventType']['Row'];

// Define API error codes
type ApiErrorCode = 'UNAUTHORIZED' | 'DATABASE_ERROR' | 'INTERNAL_ERROR' | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CREATE_ERROR' | 'AUTH_ERROR';

interface CalEventTypeResponse {
  id: number
  userId: number
  title: string
  slug: string
  description: string | null
  length: number
  hidden: boolean
  position: number
  price: number
  currency: string
  metadata: Record<string, any>
  // Additional fields for scheduling types
  seatsPerTimeSlot?: number
  schedulingType?: string
  // Plus other Cal.com API fields
}

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
  // Cal.com API required fields
  locations: {
    type: string
    displayName?: string
    address?: string
    public?: boolean
  }[]
  bookerLayouts: {
    defaultLayout: string
    enabledLayouts: string[]
  }
  beforeEventBuffer: number
  afterEventBuffer: number
  minimumBookingNotice: number
  // Optional fields
  maxParticipants?: number
  discountPercentage?: number
}

/**
 * Fetch event types for a coach from the database
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

    // Get event types for this calendar integration
    const { data: eventTypes, error: eventTypesError } = await supabase
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

    // Map database event types to the UI format using the helper function
    const mappedEventTypes: EventType[] = eventTypes.map(mapDbEventTypeToUi);

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
              price: eventType.free ? 0 : calculateEventPrice(numericHourlyRate, eventType.duration),
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
              // New fields
              locations: eventType.locations || [{ type: 'integrations:daily', displayName: 'Video Call' }],
              bookerLayouts: eventType.bookerLayouts || { defaultLayout: 'month', enabledLayouts: ['month', 'week', 'column'] },
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
              price: eventType.free ? 0 : calculateEventPrice(numericHourlyRate, eventType.duration),
              isActive: eventType.enabled,
              schedulingType: eventType.schedulingType,
              maxParticipants: eventType.maxParticipants,
              discountPercentage: eventType.discountPercentage
            },
            userUlid // Pass userUlid to enable token refresh if needed
          );
        }
        
        // 2. Save to database ONLY if Cal.com creation succeeded (or wasn't applicable)
        // If calManagedUserId exists, calEventType MUST be non-null to proceed.
        if (!calendarIntegration.calManagedUserId || calEventType) {
          const { data: insertData, error: insertError } = await supabase
            .from('CalEventType')
            .insert({
              ulid: newUlid,
              calendarIntegrationUlid: calendarIntegration.ulid,
              calEventTypeId: calEventType?.id || null, // Use ID from Cal.com response
              name: eventType.name,
              description: eventType.description,
              duration: eventType.duration,
              isFree: eventType.free,
              isActive: eventType.enabled,
              isDefault: eventType.isDefault,
              slug: calEventType?.slug || generateSlug(eventType.name), // Use slug from Cal.com response
              position: params.eventTypes.indexOf(eventType),
              scheduling: eventType.schedulingType as 'MANAGED' | 'OFFICE_HOURS' | 'GROUP_SESSION',
              maxParticipants: eventType.maxParticipants || null,
              discountPercentage: eventType.discountPercentage || null,
              organizationUlid: eventType.organizationId || null,
              // New fields
              locations: eventType.locations || [{ type: 'integrations:daily', displayName: 'Video Call' }],
              bookerLayouts: eventType.bookerLayouts || { defaultLayout: 'month', enabledLayouts: ['month', 'week', 'column'] },
              beforeEventBuffer: eventType.beforeEventBuffer || 0,
              afterEventBuffer: eventType.afterEventBuffer || 0,
              minimumBookingNotice: eventType.minimumBookingNotice || 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })

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
): Promise<CalEventTypeResponse | null> {
  try {
    // Use the official Cal.com API URL
    const calApiUrl = `https://api.cal.com/v2/event-types`;
    
    // Build the event type metadata based on scheduling type
    let metadata: Record<string, any> = {};
    let seatsPerTimeSlot: number | undefined;
    
    if (eventType.schedulingType === 'OFFICE_HOURS') {
      metadata = {
        ...metadata,
        discountPercentage: eventType.discountPercentage || 0,
        isOfficeHours: true
      };
      seatsPerTimeSlot = eventType.maxParticipants;
    } else if (eventType.schedulingType === 'GROUP_SESSION') {
      metadata = {
        ...metadata,
        isGroupSession: true
      };
      seatsPerTimeSlot = eventType.maxParticipants;
    }
    
    // Format data according to Cal.com v2 API docs
    const calData = {
      title: eventType.name,
      slug: generateSlug(eventType.name),
      description: eventType.description,
      lengthInMinutes: eventType.duration,
      hidden: !eventType.isActive,
      price: eventType.price,
      // Required booker layout configuration
      bookerLayouts: eventType.bookerLayouts || {
        defaultLayout: "month",
        enabledLayouts: ["month", "week", "column"]
      },
      // Required locations
      locations: eventType.locations || [
        {
          type: "integrations:daily",
          displayName: "Video Call"
        }
      ],
      // Minimum booking notice in minutes
      minimumBookingNotice: 0,
      // Time buffers between meetings
      beforeEventBuffer: eventType.beforeEventBuffer || 0,
      afterEventBuffer: eventType.afterEventBuffer || 0,
      // Metadata fields
      metadata,
      // Scheduling type
      schedulingType: eventType.schedulingType === 'MANAGED' ? null : eventType.schedulingType.toLowerCase(),
      // Seats configuration if needed
      seats: seatsPerTimeSlot ? {
        seatsPerTimeSlot,
        showAttendeeInfo: true,
        showAvailabilityCount: true
      } : undefined
    };
    
    console.log('[CREATE_CAL_EVENT_TYPE_REQUEST]', {
      url: calApiUrl,
      calUserId,
      clientId: env.NEXT_PUBLIC_CAL_CLIENT_ID,
      data: calData,
      timestamp: new Date().toISOString()
    });
    
    // Send the request to Cal.com API using the User's Access Token
    const response = await fetch(calApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use the managed user's access token for authorization
        'Authorization': `Bearer ${accessToken}`, 
        'cal-api-version': '2024-01-01'
        // Remove x-cal-managed-user-id as it's not needed with Bearer token auth
      },
      body: JSON.stringify(calData)
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
        'cal-api-version': '2024-01-01'
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
        'cal-api-version': '2024-01-01'
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
const mapDbEventTypeToUi = (eventType: Record<string, any>): EventType => ({
  id: eventType.ulid,
  name: eventType.name,
  description: eventType.description || '',
  duration: eventType.duration,
  free: eventType.isFree,
  enabled: eventType.isActive,
  isDefault: eventType.isDefault,
  schedulingType: eventType.scheduling || 'MANAGED',
  maxParticipants: eventType.maxParticipants || null,
  discountPercentage: eventType.discountPercentage || null,
  organizationId: eventType.organizationUlid || null,
  // New Cal.com API fields
  locations: eventType.locations || [{ type: 'integrations:daily', displayName: 'Video Call' }],
  bookerLayouts: eventType.bookerLayouts || { defaultLayout: 'month', enabledLayouts: ['month', 'week', 'column'] },
  beforeEventBuffer: eventType.beforeEventBuffer || 0,
  afterEventBuffer: eventType.afterEventBuffer || 0,
  minimumBookingNotice: eventType.minimumBookingNotice || 0
});

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
        bookerLayouts: {
          defaultLayout: "month",
          enabledLayouts: ["month", "week", "column"]
        },
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
        position: 1,
        // Add new fields required by Cal.com API
        locations: [
          {
            type: "integrations:daily",
            displayName: "Video Call"
          }
        ],
        bookerLayouts: {
          defaultLayout: "month",
          enabledLayouts: ["month", "week", "column"]
        },
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
              price: eventType.isFree ? 0 : calculateEventPrice(numericHourlyRate, eventType.duration),
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
            duration: eventType.duration,
            isFree: eventType.isFree,
            isActive: eventType.isActive,
            isDefault: eventType.isDefault,
            slug: calEventType?.slug || generateSlug(eventType.name),
            position: eventType.position,
            scheduling: eventType.scheduling as 'MANAGED' | 'OFFICE_HOURS' | 'GROUP_SESSION',
            maxParticipants: null,
            discountPercentage: null,
            organizationUlid: null,
            // New fields
            locations: eventType.locations || [{ type: 'integrations:daily', displayName: 'Video Call' }],
            bookerLayouts: eventType.bookerLayouts || { defaultLayout: 'month', enabledLayouts: ['month', 'week', 'column'] },
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
      bookerLayouts: {
        defaultLayout: "month",
        enabledLayouts: ["month", "week", "column"]
      },
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
          duration: eventType.duration,
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
          locations: eventType.locations || [{ type: 'integrations:daily', displayName: 'Video Call' }],
          bookerLayouts: eventType.bookerLayouts || { defaultLayout: 'month', enabledLayouts: ['month', 'week', 'column'] },
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