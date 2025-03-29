'use server'

import { auth } from '@clerk/nextjs/server'
import { createClient as createAuthClient } from '@/utils/supabase/client'
import { ApiResponse } from '@/utils/types/api'
import { env } from '@/lib/env'
import { nanoid } from 'nanoid'
import { generateUlid } from '@/utils/ulid'
import { type EventType } from '@/components/coaching/EventTypeCard'

// Define API error codes
type ApiErrorCode = 'UNAUTHORIZED' | 'DATABASE_ERROR' | 'INTERNAL_ERROR' | 'VALIDATION_ERROR' | 'NOT_FOUND';

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

    // Get the user's ULID and calendar integration from the database
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
        data: { eventTypes: [] },
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch calendar integration' }
      }
    }

    if (!calendarIntegration) {
      // Not an error, just no calendar integration found
      return {
        data: { eventTypes: [] },
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
        data: { eventTypes: [] },
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch event types' }
      }
    }

    // Map database event types to the UI format using the helper function
    const mappedEventTypes: EventType[] = eventTypes.map(mapDbEventTypeToUi);

    return {
      data: { eventTypes: mappedEventTypes },
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

    // Get the user's ULID and calendar integration from the database
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

    // Get calendar integration for the user
    const { data: calendarIntegration, error: calendarError } = await supabase
      .from('CalendarIntegration')
      .select('ulid, calManagedUserId')
      .eq('userUlid', userData.ulid)
      .maybeSingle()

    if (calendarError || !calendarIntegration) {
      console.error('[SAVE_EVENT_TYPES_ERROR]', {
        error: calendarError || 'No integration found',
        userUlid: userData.ulid,
        timestamp: new Date().toISOString()
      })
      return {
        data: { success: false },
        error: { 
          code: 'CREATE_ERROR', 
          message: 'Calendar integration needed before saving event types' 
        }
      }
    }

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

    // Map of existing event type IDs
    const existingEventTypeMap = new Map(
      existingEventTypes.map(et => [et.ulid, et])
    )

    // Process each event type from the UI
    for (const eventType of params.eventTypes) {
      if (existingEventTypeMap.has(eventType.id)) {
        // Update existing event type
        const { data: updateData, error: updateError } = await supabase
          .from('CalEventType')
          .update({
            name: eventType.name,
            description: eventType.description,
            duration: eventType.duration,
            isDefault: eventType.isDefault,
            isFree: eventType.free,
            isActive: eventType.enabled,
            scheduling: eventType.schedulingType,
            maxParticipants: eventType.maxParticipants || null,
            discountPercentage: eventType.discountPercentage || null,
            organizationUlid: eventType.organizationId || null,
            updatedAt: new Date().toISOString()
          })
          .eq('ulid', eventType.id)
          .select()
          .single()

        if (updateError) {
          console.error('[SAVE_EVENT_TYPES_UPDATE_ERROR]', {
            error: updateError,
            eventTypeId: eventType.id,
            timestamp: new Date().toISOString()
          })
        }

        // Sync with Cal.com if needed
        if (calendarIntegration.calManagedUserId && updateData?.calEventTypeId) {
          const syncSuccess = await syncEventTypeWithCal(
            calendarIntegration.calManagedUserId,
            updateData.calEventTypeId,
            {
              name: eventType.name,
              description: eventType.description,
              duration: eventType.duration,
              isFree: eventType.free,
              isActive: eventType.enabled,
              schedulingType: eventType.schedulingType,
              maxParticipants: eventType.maxParticipants,
              discountPercentage: eventType.discountPercentage
            }
          )
          
          if (!syncSuccess) {
            console.error('[SAVE_EVENT_TYPES_SYNC_ERROR]', {
              eventTypeId: eventType.id,
              timestamp: new Date().toISOString()
            })
          }
        }
        
        // Remove from map to track which ones need to be deleted
        existingEventTypeMap.delete(eventType.id)
      } else {
        // Create new event type
        const newUlid = nanoid(26)
        
        // First create in Cal.com API
        const calEventType = await createCalEventType(
          calendarIntegration.calManagedUserId,
          {
            name: eventType.name,
            description: eventType.description || '',
            duration: eventType.duration,
            isFree: eventType.free,
            isActive: eventType.enabled,
            schedulingType: eventType.schedulingType,
            maxParticipants: eventType.maxParticipants,
            discountPercentage: eventType.discountPercentage
          }
        )
        
        // Then save to database
        const { data: insertData, error: insertError } = await supabase
          .from('CalEventType')
          .insert({
            ulid: newUlid,
            calendarIntegrationUlid: calendarIntegration.ulid,
            calEventTypeId: calEventType?.id || null,
            name: eventType.name,
            description: eventType.description,
            duration: eventType.duration,
            isFree: eventType.free,
            isActive: eventType.enabled,
            isDefault: eventType.isDefault,
            slug: calEventType?.slug || generateSlug(eventType.name),
            position: params.eventTypes.indexOf(eventType),
            scheduling: eventType.schedulingType,
            maxParticipants: eventType.maxParticipants || null,
            discountPercentage: eventType.discountPercentage || null,
            organizationUlid: eventType.organizationId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })

        if (insertError) {
          console.error('[SAVE_EVENT_TYPES_INSERT_ERROR]', {
            error: insertError,
            newUlid,
            timestamp: new Date().toISOString()
          })
        }

        // Sync with Cal.com if connected
        if (calendarIntegration.calManagedUserId) {
          const syncSuccess = await syncEventTypeWithCal(
            calendarIntegration.calManagedUserId,
            calEventType?.id || null,
            {
              name: eventType.name,
              description: eventType.description || '',
              duration: eventType.duration,
              isFree: eventType.free,
              isActive: eventType.enabled,
              schedulingType: eventType.schedulingType,
              maxParticipants: eventType.maxParticipants,
              discountPercentage: eventType.discountPercentage
            }
          )
          
          if (!syncSuccess) {
            console.error('[SAVE_EVENT_TYPES_SYNC_ERROR]', {
              eventTypeId: newUlid,
              timestamp: new Date().toISOString()
            })
          }
        }
      }
    }

    // Delete event types that are no longer in the UI
    const entriesToDelete = Array.from(existingEventTypeMap.entries());
    for (let i = 0; i < entriesToDelete.length; i++) {
      const [ulid, eventType] = entriesToDelete[i];
      
      // Delete from Cal.com if there's a Cal event type ID
      if (eventType.calEventTypeId) {
        await deleteCalEventType(
          calendarIntegration.calManagedUserId,
          eventType.calEventTypeId
        )
      }
      
      // Delete from database
      const { error: deleteError } = await supabase
        .from('CalEventType')
        .delete()
        .eq('ulid', ulid)

      if (deleteError) {
        console.error('[SAVE_EVENT_TYPES_DELETE_ERROR]', {
          error: deleteError,
          ulid,
          timestamp: new Date().toISOString()
        })
      }
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
 */
async function createCalEventType(
  calUserId: number,
  eventType: {
    name: string
    description: string
    duration: number
    isFree: boolean
    isActive: boolean
    schedulingType: string
    maxParticipants?: number
    discountPercentage?: number
  }
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
      // Cal.com v2 API uses lengthInMinutes instead of length
      price: eventType.isFree ? 0 : undefined, // Only set price if it's a free event
      currency: 'USD',
      metadata,
      schedulingType: eventType.schedulingType === 'MANAGED' ? null : eventType.schedulingType.toLowerCase(),
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
    
    // Send the request to Cal.com API with OAuth client credentials
    const response = await fetch(calApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.CAL_CLIENT_SECRET}`,
        'cal-api-version': '2024-01-01'
      },
      body: JSON.stringify(calData)
    });
    
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
    
    if (!response.ok) {
      console.error('[CREATE_CAL_EVENT_TYPE_ERROR]', {
        status: response.status,
        error: responseData,
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
 */
async function syncEventTypeWithCal(
  calUserId: number,
  calEventTypeId: number | null,
  eventType: {
    name: string
    description: string
    duration: number
    isFree: boolean
    isActive: boolean
    schedulingType: string
    maxParticipants?: number
    discountPercentage?: number
  }
): Promise<boolean> {
  try {
    // If no Cal event type ID, we need to create instead of update
    if (!calEventTypeId) {
      const createdEventType = await createCalEventType(calUserId, eventType)
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
      price: eventType.isFree ? 0 : null,
      schedulingType: eventType.schedulingType === 'MANAGED' ? null : eventType.schedulingType.toLowerCase(),
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

    // Send the request to Cal.com API
    const response = await fetch(calApiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.CAL_CLIENT_SECRET}`,
        'cal-api-version': '2024-01-01'
      },
      body: JSON.stringify(calData)
    });

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
 */
async function deleteCalEventType(
  calUserId: number,
  calEventTypeId: number
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
        'Authorization': `Bearer ${env.CAL_CLIENT_SECRET}`,
        'cal-api-version': '2024-01-01'
      }
    });

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
  organizationId: eventType.organizationUlid || null
});

/**
 * Create default event types for a new coach
 */
export async function createDefaultEventTypes(userUlid: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    // Get calendar integration for the user
    const supabase = createAuthClient()
    const { data: calendarIntegration, error: calendarError } = await supabase
      .from('CalendarIntegration')
      .select('ulid, calManagedUserId')
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

    // Define default event types
    const defaultEventTypes = [
      {
        name: 'Coaching Session',
        description: '1:1 Coaching Session - Scale Your Brokerage',
        duration: 60,
        isFree: false,
        isActive: true,
        isDefault: true,
        scheduling: 'MANAGED',
        position: 0
      },
      {
        name: 'Free Intro Call',
        description: '15 minute free get to know you and goal setting session',
        duration: 15,
        isFree: true,
        isActive: false,
        isDefault: false,
        scheduling: 'MANAGED',
        position: 1
      }
    ]

    // Create each event type
    for (let i = 0; i < defaultEventTypes.length; i++) {
      const eventType = defaultEventTypes[i];
      const newUlid = generateUlid()
      
      // Try to create in Cal.com API if we have a managed user
      let calEventTypeId = null
      if (calendarIntegration.calManagedUserId) {
        try {
          const calEventType = await createCalEventType(
            calendarIntegration.calManagedUserId,
            {
              name: eventType.name,
              description: eventType.description,
              duration: eventType.duration,
              isFree: eventType.isFree,
              isActive: eventType.isActive,
              schedulingType: eventType.scheduling
            }
          )
          
          if (calEventType) {
            calEventTypeId = calEventType.id
          }
        } catch (error) {
          console.error('[CREATE_DEFAULT_EVENT_TYPE_CAL_ERROR]', {
            error,
            eventType: eventType.name,
            userUlid,
            timestamp: new Date().toISOString()
          })
          // Continue with local creation even if Cal.com fails
        }
      }
      
      // Create in database regardless of Cal.com result
      const { data: insertData, error: insertError } = await supabase
        .from('CalEventType')
        .insert({
          ulid: newUlid,
          calendarIntegrationUlid: calendarIntegration.ulid,
          calEventTypeId: calEventTypeId,
          name: eventType.name,
          description: eventType.description,
          duration: eventType.duration,
          isFree: eventType.isFree,
          isActive: eventType.isActive,
          isDefault: eventType.isDefault,
          slug: generateSlug(eventType.name),
          position: eventType.position,
          scheduling: eventType.scheduling as 'MANAGED' | 'OFFICE_HOURS' | 'GROUP_SESSION',
          maxParticipants: null,
          discountPercentage: null,
          organizationUlid: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })

      if (insertError) {
        console.error('[CREATE_DEFAULT_EVENT_TYPE_INSERT_ERROR]', {
          error: insertError,
          eventType: eventType.name,
          newUlid,
          timestamp: new Date().toISOString()
        })
        // Continue to try creating other event types
      } else {
        console.log('[CREATE_DEFAULT_EVENT_TYPE_SUCCESS]', {
          eventType: eventType.name,
          newUlid,
          calEventTypeId,
          timestamp: new Date().toISOString()
        })
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
    // Get calendar integration for the user
    const supabase = createAuthClient()
    const { data: calendarIntegration, error: calendarError } = await supabase
      .from('CalendarIntegration')
      .select('ulid, calManagedUserId')
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

    // Define the free intro call event type
    const eventType = {
      name: 'Free Intro Call',
      description: '15 minute free get to know you and goal setting session',
      duration: 15,
      isFree: true,
      isActive: true,
      isDefault: false,
      scheduling: 'MANAGED',
      position: 1
    }

    const newUlid = generateUlid()
    
    // Try to create in Cal.com API if we have a managed user
    let calEventTypeId = null
    if (calendarIntegration.calManagedUserId) {
      try {
        const calEventType = await createCalEventType(
          calendarIntegration.calManagedUserId,
          {
            name: eventType.name,
            description: eventType.description,
            duration: eventType.duration,
            isFree: eventType.isFree,
            isActive: eventType.isActive,
            schedulingType: eventType.scheduling
          }
        )
        
        if (calEventType) {
          calEventTypeId = calEventType.id
        }
      } catch (error) {
        console.error('[CREATE_FREE_INTRO_EVENT_TYPE_CAL_ERROR]', {
          error,
          eventType: eventType.name,
          userUlid,
          timestamp: new Date().toISOString()
        })
        // Continue with local creation even if Cal.com fails
      }
    }
    
    // Check if this event type already exists
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
    
    // Create in database
    const { data: insertData, error: insertError } = await supabase
      .from('CalEventType')
      .insert({
        ulid: newUlid,
        calendarIntegrationUlid: calendarIntegration.ulid,
        calEventTypeId: calEventTypeId,
        name: eventType.name,
        description: eventType.description,
        duration: eventType.duration,
        isFree: eventType.isFree,
        isActive: eventType.isActive,
        isDefault: eventType.isDefault,
        slug: generateSlug(eventType.name),
        position: eventType.position,
        scheduling: eventType.scheduling as 'MANAGED' | 'OFFICE_HOURS' | 'GROUP_SESSION',
        maxParticipants: null,
        discountPercentage: null,
        organizationUlid: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

    if (insertError) {
      console.error('[CREATE_FREE_INTRO_EVENT_TYPE_INSERT_ERROR]', {
        error: insertError,
        eventType: eventType.name,
        newUlid,
        timestamp: new Date().toISOString()
      })
      return {
        data: { success: false },
        error: { 
          code: 'DATABASE_ERROR', 
          message: 'Failed to create free intro event type' 
        }
      }
    }
    
    console.log('[CREATE_FREE_INTRO_EVENT_TYPE_SUCCESS]', {
      eventType: eventType.name,
      newUlid,
      calEventTypeId,
      timestamp: new Date().toISOString()
    })

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