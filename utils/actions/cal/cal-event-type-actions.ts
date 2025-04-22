'use server'

import { auth } from '@clerk/nextjs'
import { createAuthClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { makeCalApiRequest } from '@/lib/cal/cal-api' 
import { 
  CalEventTypeResponse, 
  EventType,
  FetchEventTypesResponse,
  SaveEventTypeParams,
  eventTypeToDbFields
} from '@/utils/types/cal-event-types'
import { ApiResponse, ApiErrorCode } from '@/utils/types/api'
import { createEventType as createEventTypeInternal, updateEventType as updateEventTypeInternal, deleteEventType as deleteEventTypeInternal } from '@/utils/actions/cal/cal-event-type-crud'
import { createDefaultEventTypes } from '@/utils/actions/cal/cal-default-event-type'
import { syncUserEventTypes } from '@/utils/actions/cal/cal-event-type-sync'
import { getAuthenticatedCalUser } from '@/utils/auth'

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
    // Use the authentication helper to get userUlid and calendar integration
    const authResult = await getAuthenticatedCalUser();
    if (authResult.error || !authResult.data) {
      return {
        data: { eventTypes: [] },
        error: authResult.error || { code: 'INTERNAL_ERROR', message: 'Authentication failed' }
      };
    }

    // Extract data from authentication result
    const { userUlid, integrationUlid } = authResult.data;

    // Initialize Supabase client
    const supabase = createAuthClient();

    // Fetch coach hourly rate
    const { data: coachProfile, error: coachProfileError } = await supabase
      .from('CoachProfile')
      .select('hourlyRate')
      .eq('userUlid', userUlid)
      .maybeSingle();
      
    // Create hourly rate response object for client use
    const hourlyRate = coachProfile?.hourlyRate as number | null;
    const hourlyRateData = {
      hourlyRate,
      isValid: hourlyRate !== null && hourlyRate > 0
    };

    if (coachProfileError) {
      console.error('[FETCH_COACH_HOURLY_RATE_ERROR]', {
        error: coachProfileError,
        userUlid,
        timestamp: new Date().toISOString()
      });
      // Continue with event types fetch even if hourly rate fails
    }

    // If we don't have an integration ULID from authentication helper
    if (!integrationUlid) {
      // Not an error, just no calendar integration found
      return {
        data: { eventTypes: [], coachHourlyRate: hourlyRateData },
        error: null
      };
    }

    // Fetch event types from database
    const { data: dbEventTypes, error: eventTypesError } = await supabase
      .from('CalEventType')
      .select('*')
      .eq('calendarIntegrationUlid', integrationUlid)
      .eq('hidden', false)
      .order('position', { ascending: true });

    if (eventTypesError) {
      console.error('[FETCH_EVENT_TYPES_ERROR]', {
        error: eventTypesError,
        calendarIntegrationUlid: integrationUlid,
        timestamp: new Date().toISOString()
      });
      return {
        data: { eventTypes: [], coachHourlyRate: hourlyRateData },
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch event types' }
      };
    }
    
    // Log retrieved event types for debugging
    console.log('[FETCH_EVENT_TYPES_DEBUG]', {
      count: dbEventTypes?.length || 0,
      eventTypes: dbEventTypes?.map(et => ({
        id: et.ulid,
        name: et.name,
        isActive: et.isActive,
        hidden: et.hidden
      })),
      timestamp: new Date().toISOString()
    });

    // Map database event types to UI format
    const mappedEventTypes: EventType[] = (dbEventTypes || []).map(et => {
      // Safely extract metadata properties
      const metadata = et.metadata ? (typeof et.metadata === 'object' ? et.metadata : {}) : {};
      const isRequired = 'isRequired' in metadata ? !!metadata.isRequired : false;
      
      // Special case for "Get to Know You" 15-minute free session
      const isGetToKnowYouCall = et.name === "Get to Know You" && et.lengthInMinutes === 15 && et.isFree;

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
        // Allow "Get to Know You" call to be disabled, even though it's a default
        canDisable: isGetToKnowYouCall ? true : !isRequired
      };
    });

    return {
      data: { 
        eventTypes: mappedEventTypes,
        coachHourlyRate: hourlyRateData
      },
      error: null
    };
  } catch (error) {
    console.error('[FETCH_EVENT_TYPES_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    });
    return {
      data: { eventTypes: [] },
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    };
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
    // Use the authentication helper to get userUlid
    const authResult = await getAuthenticatedCalUser();
    if (authResult.error || !authResult.data) {
      return {
        data: { success: false },
        error: authResult.error || { code: 'INTERNAL_ERROR', message: 'Authentication failed' }
      };
    }

    const { userUlid, integrationUlid } = authResult.data;

    // Check if we have non-free event types
    const hasNonFreeEvent = params.eventTypes.some(et => !et.free);

    // Initialize Supabase client
    const supabase = createAuthClient();

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
    const { data: existingEventTypes, error: existingError } = await supabase
      .from('CalEventType')
      .select('ulid, calEventTypeId, isDefault, name')
      .eq('calendarIntegrationUlid', integrationUlid);

    if (existingError) {
      console.error('[SAVE_EVENT_TYPES_ERROR]', {
        error: existingError,
        calendarIntegrationUlid: integrationUlid,
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
    // Use the authentication helper to get userUlid
    const authResult = await getAuthenticatedCalUser();
    if (authResult.error || !authResult.data) {
      return {
        data: { success: false },
        error: authResult.error || { code: 'INTERNAL_ERROR', message: 'Authentication failed' }
      };
    }

    const { userUlid } = authResult.data;
    
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
  // Use the consolidated syncUserEventTypes function from cal-event-type-sync.ts
  try {
    // Call the consolidated sync function with the path for revalidation
    const result = await syncUserEventTypes('/dashboard/coach/availability');
    
    return result;
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

/**
 * Toggle an event type's active status (only in database, not in Cal.com)
 * 
 * This is a local-only operation that doesn't sync with Cal.com
 * 
 * @param eventTypeId Database ID of the event type
 * @param enabled Whether the event type should be enabled or disabled
 * @returns ApiResponse with success status
 */
export async function toggleEventTypeActive(
  eventTypeId: string,
  enabled: boolean
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    // Use the authentication helper to get userUlid
    const authResult = await getAuthenticatedCalUser();
    if (authResult.error || !authResult.data) {
      return {
        data: { success: false },
        error: authResult.error || { code: 'INTERNAL_ERROR', message: 'Authentication failed' }
      };
    }

    const { userUlid } = authResult.data;

    // Initialize Supabase client
    const supabase = createAuthClient();

    // Get the event type to check ownership
    const { data: eventType, error: eventTypeError } = await supabase
      .from('CalEventType')
      .select('*, CalendarIntegration!inner(userUlid)')
      .eq('ulid', eventTypeId)
      .single();

    if (eventTypeError) {
      console.error('[TOGGLE_EVENT_TYPE_ERROR]', {
        error: eventTypeError,
        eventTypeId,
        timestamp: new Date().toISOString()
      });
      return {
        data: { success: false },
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch event type' }
      };
    }

    // Check ownership
    if (eventType.CalendarIntegration.userUlid !== userUlid) {
      console.error('[TOGGLE_EVENT_TYPE_ERROR] Unauthorized', {
        eventTypeId,
        userUlid,
        ownerUlid: eventType.CalendarIntegration.userUlid,
        timestamp: new Date().toISOString()
      });
      return {
        data: { success: false },
        error: { code: 'FORBIDDEN', message: 'You do not have permission to update this event type' }
      };
    }

    // Update only the isActive field in the database (not syncing with Cal.com)
    const { error: updateError } = await supabase
      .from('CalEventType')
      .update({
        isActive: enabled,
        updatedAt: new Date().toISOString()
      })
      .eq('ulid', eventTypeId);

    if (updateError) {
      console.error('[TOGGLE_EVENT_TYPE_ERROR]', {
        error: updateError,
        eventTypeId,
        timestamp: new Date().toISOString()
      });
      return {
        data: { success: false },
        error: { code: 'DATABASE_ERROR', message: 'Failed to update event type' }
      };
    }

    // Revalidate the path to ensure UI shows latest data
    revalidatePath('/dashboard/coach/availability');

    return {
      data: { success: true },
      error: null
    };
  } catch (error) {
    console.error('[TOGGLE_EVENT_TYPE_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    });
    return {
      data: { success: false },
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    };
  }
}
