'use server';

import { auth } from '@clerk/nextjs/server';
import { createAuthClient } from '@/utils/auth';
import { ApiResponse } from '@/utils/types/api';
import { makeCalApiRequest } from '@/lib/cal/cal-api';
import { generateUlid } from '@/utils/ulid';
import { 
  EventType, 
  DbCalEventType,
  eventTypeToCalFormat,
  eventTypeToDbFields,
  generateSlug
} from '@/utils/types/cal-event-types';
import { Database } from '@/types/supabase';
import { getAuthenticatedCalUser } from '@/utils/auth';

// type DbCalEventType = Database['public']['Tables']['CalEventType']['Row'];

/**
 * Create a new event type
 * 
 * @param eventType Event type to create
 * @returns API response with success status
 */
export async function createEventType(
  eventType: Omit<EventType, 'id'>
): Promise<ApiResponse<{ id: string }>> {
  try {
    // Use the new authentication helper to get userUlid and calendar integration
    const authResult = await getAuthenticatedCalUser({ calManagedUserId: true });
    if (authResult.error || !authResult.data) {
      return {
        data: null,
        error: authResult.error || { code: 'INTERNAL_ERROR', message: 'Authentication failed' }
      };
    }

    // Extract data from authentication result
    const { userUlid, integrationUlid, calManagedUserId } = authResult.data;

    // Initialize Supabase client
    const supabase = createAuthClient();

    // Generate new ULID for the event type
    const newUlid = generateUlid();

    // Get coach's hourly rate for pricing if needed
    let hourlyRate = 0;
    if (!eventType.free) {
      const { data: coachProfile } = await supabase
        .from('CoachProfile')
        .select('hourlyRate')
        .eq('userUlid', userUlid)
        .maybeSingle();
      
      hourlyRate = coachProfile?.hourlyRate as number || 0;
    }

    // Create a complete EventType to be able to use our helper functions
    const completeEventType: EventType = {
      id: newUlid,
      name: eventType.name,
      description: eventType.description || '',
      duration: eventType.duration,
      free: eventType.free,
      enabled: eventType.enabled !== undefined ? eventType.enabled : true,
      isDefault: eventType.isDefault || false,
      schedulingType: eventType.schedulingType || 'MANAGED',
      maxParticipants: eventType.maxParticipants,
      discountPercentage: eventType.discountPercentage,
      beforeEventBuffer: eventType.beforeEventBuffer,
      afterEventBuffer: eventType.afterEventBuffer,
      minimumBookingNotice: eventType.minimumBookingNotice,
      slotInterval: eventType.slotInterval,
      locations: eventType.locations
    };

    // Prepare the data for Cal.com API
    const calEventTypeData = eventTypeToCalFormat(completeEventType, hourlyRate);

    // Create the event type in Cal.com
    console.log('[CREATE_EVENT_TYPE_INFO] Creating in Cal.com', {
      name: eventType.name,
      userUlid,
      timestamp: new Date().toISOString()
    });

    try {
      // Using our centralized token management through makeCalApiRequest
      const calResponse = await makeCalApiRequest(
        'event-types',
        'POST',
        calEventTypeData,
        userUlid
      );

      console.log('[CREATE_EVENT_TYPE_DEBUG] Cal.com API response:', {
        response: calResponse,
        hasId: calResponse?.id !== undefined,
        id: calResponse?.id,
        timestamp: new Date().toISOString()
      });

      if (!calResponse || !calResponse.id) {
        console.error('[CREATE_EVENT_TYPE_ERROR] Invalid Cal.com response', {
          response: calResponse,
          userUlid,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: { code: 'CREATE_ERROR', message: 'Failed to create event type in Cal.com' }
        };
      }

      // Convert ID to number if it's not already (API might return as string)
      const calEventTypeId = typeof calResponse.id === 'string' ? parseInt(calResponse.id, 10) : calResponse.id;

      // Prepare database fields
      const dbFields = {
        ...eventTypeToDbFields(completeEventType, integrationUlid),
        calEventTypeId: calEventTypeId, // Use the processed ID
        ulid: newUlid,
        slug: calResponse.slug || generateSlug(eventType.name),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store in database
      const { error: insertError } = await supabase
        .from('CalEventType')
        .insert(dbFields);

      if (insertError) {
        console.error('[CREATE_EVENT_TYPE_ERROR] Database insert failed', {
          error: insertError,
          calEventTypeId: calResponse.id,
          userUlid,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: { code: 'DATABASE_ERROR', message: 'Failed to store event type in database' }
        };
      }

      console.log('[CREATE_EVENT_TYPE_SUCCESS]', {
        eventTypeId: newUlid,
        calEventTypeId: calResponse.id,
        userUlid,
        timestamp: new Date().toISOString()
      });

      return {
        data: { id: newUlid },
        error: null
      };
    } catch (error) {
      console.error('[CREATE_EVENT_TYPE_ERROR] Cal.com API error', {
        error,
        userUlid,
        eventTypeName: eventType.name,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: { 
          code: 'CREATE_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to create event type in Cal.com'
        }
      };
    }
  } catch (error) {
    console.error('[CREATE_EVENT_TYPE_ERROR] Unexpected error', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return {
      data: null,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    };
  }
}

/**
 * Update an existing event type
 * 
 * @param eventType Event type to update
 * @returns API response with success status
 */
export async function updateEventType(
  eventType: EventType
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    // Use the new authentication helper to get userUlid and calendar integration
    const authResult = await getAuthenticatedCalUser({ calManagedUserId: true });
    if (authResult.error || !authResult.data) {
      return {
        data: null,
        error: authResult.error || { code: 'INTERNAL_ERROR', message: 'Authentication failed' }
      };
    }

    // Extract data from authentication result
    const { userUlid } = authResult.data;

    // Initialize Supabase client
    const supabase = createAuthClient();

    // Get the event type details
    const { data: existingEventType, error: eventTypeError } = await supabase
      .from('CalEventType')
      .select('*, CalendarIntegration!inner(calManagedUserId, userUlid)')
      .eq('ulid', eventType.id)
      .single();

    if (eventTypeError) {
      console.error('[UPDATE_EVENT_TYPE_ERROR] Event type lookup', { 
        error: eventTypeError, 
        eventTypeId: eventType.id,
        userUlid,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch event type details' }
      };
    }

    if (!existingEventType) {
      console.error('[UPDATE_EVENT_TYPE_ERROR] Event type not found', { 
        eventTypeId: eventType.id,
        userUlid,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: { code: 'NOT_FOUND', message: 'Event type not found' }
      };
    }

    // Check if user owns this event type
    if (existingEventType.CalendarIntegration.userUlid !== userUlid) {
      console.error('[UPDATE_EVENT_TYPE_ERROR] Unauthorized access', { 
        eventTypeId: eventType.id,
        userUlid,
        ownerUlid: existingEventType.CalendarIntegration.userUlid,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to update this event type' }
      };
    }

    const calManagedUserId = existingEventType.CalendarIntegration.calManagedUserId;
    if (!calManagedUserId) {
      console.error('[UPDATE_EVENT_TYPE_ERROR] Missing Cal managed user ID', { 
        eventTypeId: eventType.id,
        userUlid,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: { code: 'INVALID_STATE', message: 'Calendar integration is missing managed user ID' }
      };
    }

    // Get coach's hourly rate for pricing if needed
    let hourlyRate = 0;
    if (!eventType.free) {
      const { data: coachProfile } = await supabase
        .from('CoachProfile')
        .select('hourlyRate')
        .eq('userUlid', userUlid)
        .maybeSingle();
      
      hourlyRate = coachProfile?.hourlyRate as number || 0;
    }

    // Update the event type in Cal.com
    try {
      console.log('[UPDATE_EVENT_TYPE_INFO] Updating in Cal.com', { 
        eventTypeId: eventType.id,
        calEventTypeId: existingEventType.calEventTypeId,
        userUlid,
        timestamp: new Date().toISOString()
      });

      // Prepare Cal.com payload
      const calEventTypeData = eventTypeToCalFormat(eventType, hourlyRate);

      // Use makeCalApiRequest with automatic token validation
      await makeCalApiRequest(
        `event-types/${existingEventType.calEventTypeId}`,
        'PUT',
        calEventTypeData,
        userUlid
      );

      // Update in database
      const dbFields = {
        ...eventTypeToDbFields(eventType, existingEventType.calendarIntegrationUlid),
        updatedAt: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('CalEventType')
        .update(dbFields)
        .eq('ulid', eventType.id);

      if (updateError) {
        console.error('[UPDATE_EVENT_TYPE_ERROR] Database update failed', { 
          error: updateError,
          eventTypeId: eventType.id,
          userUlid,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: { code: 'DATABASE_ERROR', message: 'Failed to update event type in database' }
        };
      }

      console.log('[UPDATE_EVENT_TYPE_SUCCESS]', { 
        eventTypeId: eventType.id,
        userUlid,
        timestamp: new Date().toISOString()
      });

      return {
        data: { success: true },
        error: null
      };
    } catch (error) {
      console.error('[UPDATE_EVENT_TYPE_ERROR] Cal.com API error', { 
        error,
        eventTypeId: eventType.id,
        userUlid,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: { 
          code: 'UPDATE_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to update event type in Cal.com'
        }
      };
    }
  } catch (error) {
    console.error('[UPDATE_EVENT_TYPE_ERROR] Unexpected error', { 
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return {
      data: null,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    };
  }
}

/**
 * Delete an event type
 * 
 * @param eventTypeId ID of the event type to delete
 * @returns API response with success status
 */
export async function deleteEventType(
  eventTypeId: string
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    // Use the new authentication helper to get userUlid and calendar integration
    const authResult = await getAuthenticatedCalUser();
    if (authResult.error || !authResult.data) {
      return {
        data: null,
        error: authResult.error || { code: 'INTERNAL_ERROR', message: 'Authentication failed' }
      };
    }

    // Extract data from authentication result
    const { userUlid } = authResult.data;

    // Initialize Supabase client
    const supabase = createAuthClient();

    // Get the event type details
    const { data: existingEventType, error: eventTypeError } = await supabase
      .from('CalEventType')
      .select('*, CalendarIntegration!inner(calManagedUserId, userUlid)')
      .eq('ulid', eventTypeId)
      .single();

    if (eventTypeError) {
      console.error('[DELETE_EVENT_TYPE_ERROR] Event type lookup', { 
        error: eventTypeError, 
        eventTypeId,
        userUlid,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch event type details' }
      };
    }

    if (!existingEventType) {
      console.error('[DELETE_EVENT_TYPE_ERROR] Event type not found', { 
        eventTypeId,
        userUlid,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: { code: 'NOT_FOUND', message: 'Event type not found' }
      };
    }

    // Check if user owns this event type
    if (existingEventType.CalendarIntegration.userUlid !== userUlid) {
      console.error('[DELETE_EVENT_TYPE_ERROR] Unauthorized access', { 
        eventTypeId,
        userUlid,
        ownerUlid: existingEventType.CalendarIntegration.userUlid,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to delete this event type' }
      };
    }

    // Check if the event type is a default type (which should not be deleted)
    if (existingEventType.isDefault) {
      console.error('[DELETE_EVENT_TYPE_ERROR] Cannot delete default event type', { 
        eventTypeId,
        userUlid,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: { code: 'FORBIDDEN', message: 'Default event types cannot be deleted' }
      };
    }

    // Delete from Cal.com
    try {
      if (existingEventType.calEventTypeId) {
        console.log('[DELETE_EVENT_TYPE_INFO] Deleting from Cal.com', { 
          eventTypeId,
          calEventTypeId: existingEventType.calEventTypeId,
          userUlid,
          timestamp: new Date().toISOString()
        });

        // Use makeCalApiRequest with automatic token validation
        await makeCalApiRequest(
          `event-types/${existingEventType.calEventTypeId}`,
          'DELETE',
          undefined,
          userUlid
        );
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('CalEventType')
        .delete()
        .eq('ulid', eventTypeId);

      if (deleteError) {
        console.error('[DELETE_EVENT_TYPE_ERROR] Database delete failed', { 
          error: deleteError,
          eventTypeId,
          userUlid,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: { code: 'DATABASE_ERROR', message: 'Failed to delete event type from database' }
        };
      }

      console.log('[DELETE_EVENT_TYPE_SUCCESS]', { 
        eventTypeId,
        userUlid,
        timestamp: new Date().toISOString()
      });

      return {
        data: { success: true },
        error: null
      };
    } catch (error) {
      console.error('[DELETE_EVENT_TYPE_ERROR] Cal.com API error', { 
        error,
        eventTypeId,
        userUlid,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: { 
          code: 'UPDATE_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to delete event type from Cal.com'
        }
      };
    }
  } catch (error) {
    console.error('[DELETE_EVENT_TYPE_ERROR] Unexpected error', { 
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return {
      data: null,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    };
  }
} 