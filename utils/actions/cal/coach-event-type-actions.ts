'use server'

import { revalidatePath } from 'next/cache'
import { ApiResponse, ApiError, ApiErrorCode } from '@/utils/types/api'
import { 
  EventType, 
  FetchEventTypesResponse,
  SaveEventTypeParams,
  calculateEventPrice,
  DbCalEventType
} from '@/utils/types/cal-event-types'
import { auth } from '@clerk/nextjs/server'
import { createAuthClient } from '@/utils/auth'

// Import the newer server action functions
import { createEventType as createEventTypeInternal, updateEventType as updateEventTypeInternal, deleteEventType as deleteEventTypeInternal } from '@/utils/actions/cal/cal-event-type-crud'
import { createDefaultEventTypes } from '@/utils/actions/cal/cal-default-event-type'
import { syncCalEventTypesWithDb } from '@/utils/actions/cal/cal-event-type-sync'

// Extend the ApiErrorCode type to include SYNC_ERROR
type ExtendedApiErrorCode = ApiErrorCode | 'SYNC_ERROR';

// Extend the ApiError type to use our extended error code
interface ExtendedApiError extends Omit<ApiError, 'code'> {
  code: ExtendedApiErrorCode;
}

/**
 * Fetch all coach event types, including hourly rate data
 * 
 * This function:
 * 1. Fetches event types from the database
 * 2. Fetches the coach's hourly rate
 * 3. Returns both pieces of data
 * 
 * @returns ApiResponse with event types and hourly rate
 */
export async function fetchCoachEventTypes(): Promise<ApiResponse<FetchEventTypesResponse>> {
  try {
    // Get authenticated user
    const { userId } = auth()
    if (!userId) {
      return {
        data: { eventTypes: [] },
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      }
    }

    // Initialize Supabase client
    const supabase = createAuthClient()

    // Get the user's ULID
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
      .select('ulid')
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

    // Fetch event types from database
    const { data: dbEventTypes, error: eventTypesError } = await supabase
      .from('CalEventType')
      .select('*')
      .eq('calendarIntegrationUlid', calendarIntegration.ulid)
      .eq('isActive', true)
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

    // Map database event types to UI format
    const mappedEventTypes: EventType[] = (dbEventTypes || []).map(et => {
      // Safely extract metadata properties
      const metadata = et.metadata ? (typeof et.metadata === 'object' ? et.metadata : {}) : {};
      const isRequired = 'isRequired' in metadata ? !!metadata.isRequired : false;

      return {
        id: et.ulid,
        name: et.name,
        description: et.description || '',
        duration: et.lengthInMinutes,
        free: et.isFree,
        enabled: et.isActive,
        isDefault: et.isDefault,
        schedulingType: et.scheduling,
        // Convert null to undefined for optional number properties
        maxParticipants: et.maxParticipants === null ? undefined : et.maxParticipants,
        discountPercentage: et.discountPercentage === null ? undefined : et.discountPercentage,
        beforeEventBuffer: et.beforeEventBuffer === null ? undefined : et.beforeEventBuffer,
        afterEventBuffer: et.afterEventBuffer === null ? undefined : et.afterEventBuffer,
        minimumBookingNotice: et.minimumBookingNotice === null ? undefined : et.minimumBookingNotice,
        slotInterval: et.slotInterval === null ? undefined : et.slotInterval,
        locations: et.locations as any[] || [],
        // UI-specific fields
        isRequired,
        canDisable: !isRequired
      };
    });

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
 * Save changes to coach event types
 * 
 * This function:
 * 1. Validates the hourly rate for non-free event types
 * 2. For each event type, creates, updates, or deletes as needed
 * 3. Handles Cal.com synchronization
 * 
 * @param params Event types to save
 * @returns ApiResponse with success status
 */
export async function saveCoachEventTypes(
  params: SaveEventTypeParams
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    // Get authenticated user
    const { userId } = auth()
    if (!userId) {
      return {
        data: { success: false },
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      }
    }

    // Initialize Supabase client
    const supabase = createAuthClient()

    // Get the user's ULID
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

    const userUlid = userData.ulid

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

    // Get existing event types to determine which ones to update, create, or delete
    const { data: calendarIntegration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('ulid')
      .eq('userUlid', userUlid)
      .maybeSingle();

    if (integrationError || !calendarIntegration) {
      console.error('[SAVE_EVENT_TYPES_ERROR] Failed to fetch calendar integration', {
        error: integrationError,
        userUlid,
        timestamp: new Date().toISOString()
      });
      return {
        data: { success: false },
        error: { code: 'DATABASE_ERROR', message: 'Failed to find calendar integration' }
      };
    }

    const { data: existingEventTypes, error: existingError } = await supabase
      .from('CalEventType')
      .select('ulid, calEventTypeId, isDefault, name')
      .eq('calendarIntegrationUlid', calendarIntegration.ulid);

    if (existingError) {
      console.error('[SAVE_EVENT_TYPES_ERROR]', {
        error: existingError,
        calendarIntegrationUlid: calendarIntegration.ulid,
        timestamp: new Date().toISOString()
      });
      return {
        data: { success: false },
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch existing event types' }
      };
    }

    // Map existing event types for quick lookup
    const existingMap = new Map();
    existingEventTypes?.forEach(et => existingMap.set(et.ulid, et));

    // Categorize event types by action needed
    const toCreate = params.eventTypes.filter(et => !et.id || !existingMap.has(et.id));
    const toUpdate = params.eventTypes.filter(et => et.id && existingMap.has(et.id));
    const currentIds = new Set(params.eventTypes.map(et => et.id).filter(Boolean));
    const toDelete = existingEventTypes?.filter(et => 
      !currentIds.has(et.ulid) && !et.isDefault
    ) || [];

    let hasError = false;

    // Process creates
    for (const eventType of toCreate) {
      // ID should not be present for creation
      const { id, ...createPayload } = eventType;
      
      const result = await createEventTypeInternal(createPayload);
      if (result.error) {
        hasError = true;
        console.error('[SAVE_EVENT_TYPES_CREATE_ERROR]', {
          error: result.error,
          eventType: createPayload.name,
          timestamp: new Date().toISOString()
        });
        // Continue with other operations, but report overall failure later
      }
    }

    // Process updates
    for (const eventType of toUpdate) {
      const existing = existingMap.get(eventType.id);
      if (!existing) continue;

      // Pass the full EventType object to the internal update function
      const result = await updateEventTypeInternal(eventType);
      if (result.error) {
        hasError = true;
        console.error('[SAVE_EVENT_TYPES_UPDATE_ERROR]', {
          error: result.error,
          eventTypeId: eventType.id,
          timestamp: new Date().toISOString()
        });
        // Continue with other operations
      }
    }

    // Process deletes (only for non-default event types)
    for (const eventType of toDelete) {
      // Skip default event types - they should not be deleted
      if (eventType.isDefault) continue;

      const result = await deleteEventTypeInternal(eventType.ulid);
      if (result.error) {
        hasError = true;
        console.error('[SAVE_EVENT_TYPES_DELETE_ERROR]', {
          error: result.error,
          eventTypeId: eventType.ulid,
          timestamp: new Date().toISOString()
        });
        // Continue with other operations
      }
    }

    // Revalidate the path to ensure UI shows latest data
    revalidatePath('/dashboard/coach/availability');

    if (hasError) {
        return {
            data: { success: false },
            error: { code: 'INTERNAL_ERROR', message: 'One or more event type operations failed. Check logs for details.' }
        };
    }

    return {
      data: { success: true },
      error: null
    };
  } catch (error) {
    console.error('[SAVE_EVENT_TYPES_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    });
    return {
      data: { success: false },
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    };
  }
}

/**
 * Create default event types for a coach
 * 
 * @returns ApiResponse with success status
 */
export async function createCoachDefaultEventTypes(): Promise<ApiResponse<{ success: boolean }>> {
  try {
    // Get authenticated user
    const { userId } = auth()
    if (!userId) {
      return {
        data: { success: false },
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      }
    }

    // Initialize Supabase client
    const supabase = createAuthClient()

    // Get the user's ULID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()

    if (userError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR]', {
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
    
    // Call the internal function that handles all the logic
    const result = await createDefaultEventTypes(userUlid);
    
    // Revalidate the path to ensure UI shows latest data
    revalidatePath('/dashboard/coach/availability');
    
    return result;
  } catch (error) {
    console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    });
    return {
      data: { success: false },
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    };
  }
}

/**
 * Sync event types between database and Cal.com
 * 
 * @returns ApiResponse with success status
 */
export async function syncCoachEventTypes(): Promise<ApiResponse<{ success: boolean }>> {
  try {
    // Get authenticated user
    const { userId } = auth()
    if (!userId) {
      return {
        data: { success: false },
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      }
    }

    // Initialize Supabase client
    const supabase = createAuthClient()

    // Get the user's ULID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()

    if (userError) {
      console.error('[SYNC_EVENT_TYPES_ERROR]', {
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

    // Get calendar integration
    const { data: calendarIntegration, error: calendarError } = await supabase
      .from('CalendarIntegration')
      .select('ulid, calUsername')
      .eq('userUlid', userUlid)
      .maybeSingle()

    if (calendarError || !calendarIntegration) {
      console.error('[SYNC_EVENT_TYPES_ERROR]', {
        error: calendarError,
        userUlid,
        timestamp: new Date().toISOString()
      })
      return {
        data: { success: false },
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch calendar integration' }
      }
    }

    // Perform the sync
    const syncResult = await syncCalEventTypesWithDb(
      userUlid,
      calendarIntegration.ulid,
      [] // Empty array to force fetch from Cal.com API
    );

    // Revalidate the path to ensure UI shows latest data
    revalidatePath('/dashboard/coach/availability');

    return {
      data: { success: syncResult.success },
      error: syncResult.success ? null : { 
        code: 'INTERNAL_ERROR' as ApiErrorCode, 
        message: syncResult.error || 'Failed to sync event types' 
      }
    };
  } catch (error) {
    console.error('[SYNC_EVENT_TYPES_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    });
    return {
      data: { success: false },
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    };
  }
} 