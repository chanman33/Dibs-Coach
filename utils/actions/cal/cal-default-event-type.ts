'use server';

import { createAuthClient } from '@/utils/auth';
import { CalTokenService } from '@/lib/cal/cal-service';
import { generateUlid } from '@/utils/ulid';
import { makeCalApiRequest } from '@/lib/cal/cal-api';
import { ApiResponse } from '@/utils/types/api';
import { 
  DbCalEventType, 
  calculateEventPrice,
  eventTypeToCalFormat,
  generateSlug
} from '@/utils/types/cal-event-types';
import { syncCalEventTypesWithDb } from '@/utils/actions/cal/cal-event-type-sync';

/**
 * Create default event types for a coach user
 * 
 * This server action:
 * 1. Checks if default event types already exist
 * 2. Gets a valid Cal.com token
 * 3. Syncs with Cal.com first to see if default event types already exist
 * 4. Creates default event types if none exist
 * 
 * @param userUlid The user's ULID
 * @returns ApiResponse with creation status and created event types
 */
export async function createDefaultEventTypes(
  userUlid: string
): Promise<ApiResponse<{
  success: boolean;
  totalCreated?: number;
  createdEventTypes?: any[];
}>> {
  try {
    console.log('[CREATE_DEFAULT_EVENT_TYPES] Starting creation of default event types', { userUlid });

    if (!userUlid) {
      return {
        data: { success: false },
        error: { code: 'INVALID_INPUT', message: 'User ULID is required' }
      };
    }

    // Initialize Supabase client
    const supabase = createAuthClient();

    // Check if calendar integration exists for the user
    const { data: calendarIntegration, error: calendarError } = await supabase
      .from('CalendarIntegration')
      .select('ulid, calManagedUserId, calUsername')
      .eq('userUlid', userUlid)
      .maybeSingle();

    if (calendarError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Calendar Integration lookup', { 
        error: calendarError, 
        userUlid 
      });
      return {
        data: { success: false },
        error: { 
          code: 'DATABASE_ERROR', 
          message: 'Failed to fetch calendar integration' 
        }
      };
    }

    if (!calendarIntegration) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] No Cal.com integration found', { userUlid });
      return {
        data: { success: false },
        error: { 
          code: 'NOT_FOUND', 
          message: 'No Cal.com integration found for this user' 
        }
      };
    }

    // Ensure we have a managed user ID, otherwise we can't create event types
    if (!calendarIntegration.calManagedUserId) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] No managed user ID found', { userUlid });
      return {
        data: { success: false },
        error: { 
          code: 'INVALID_STATE', 
          message: 'No Cal.com managed user found for this user. Please reconnect Cal.com in settings.' 
        }
      };
    }
    
    // Ensure we have a username
    if (!calendarIntegration.calUsername) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] No Cal.com username found', { userUlid });
      return {
        data: { success: false },
        error: { 
          code: 'INVALID_STATE', 
          message: 'No Cal.com username found for this user. Please reconnect Cal.com in settings.' 
        }
      };
    }

    // IDEMPOTENCY CHECK: First check if default event types already exist in the local database
    const { data: existingDefaultEventTypes, error: defaultCheckError } = await supabase
      .from('CalEventType')
      .select('*')
      .eq('calendarIntegrationUlid', calendarIntegration.ulid)
      .eq('isDefault', true)
      .eq('isActive', true);

    if (defaultCheckError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Failed to check for existing default event types', { 
        error: defaultCheckError, 
        userUlid,
        calendarIntegrationUlid: calendarIntegration.ulid 
      });
      // Continue execution - this is non-fatal
    } else if (existingDefaultEventTypes && existingDefaultEventTypes.length > 0) {
      console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Default event types already exist, skipping creation', { 
        count: existingDefaultEventTypes.length,
        existingNames: existingDefaultEventTypes.map((et: DbCalEventType) => et.name),
        userUlid 
      });
      
      // Return success - action is idempotent
      return {
        data: { 
          success: true, 
          totalCreated: 0,
          createdEventTypes: existingDefaultEventTypes
        },
        error: null
      };
    }

    // Get coach's hourly rate for paid events
    const { data: coachProfile, error: profileError } = await supabase
      .from('CoachProfile')
      .select('hourlyRate')
      .eq('userUlid', userUlid)
      .maybeSingle();

    if (profileError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Coach Profile lookup', { 
        error: profileError, 
        userUlid 
      });
      return {
        data: { success: false },
        error: { 
          code: 'DATABASE_ERROR', 
          message: 'Failed to fetch coach profile for pricing' 
        }
      };
    }

    const hourlyRate = coachProfile?.hourlyRate as number || 0;
    const hasValidHourlyRate = hourlyRate !== null && hourlyRate !== undefined && hourlyRate > 0;
    console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Hourly Rate check', { hourlyRate, hasValidHourlyRate });

    // Try to sync event types from Cal.com first (might already exist there)
    try {
      console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Syncing with Cal.com', { username: calendarIntegration.calUsername });
      
      // Use our new makeCalApiRequest function that handles token validation internally
      const calEventTypesResult = await makeCalApiRequest(
        `event-types?username=${encodeURIComponent(calendarIntegration.calUsername)}`,
        'GET',
        undefined,
        userUlid
      );
      
      // Sync with our database
      if (calEventTypesResult && calEventTypesResult.data) {
        const calEventTypesFromApi = calEventTypesResult.data;
        await syncCalEventTypesWithDb(userUlid, calendarIntegration.ulid, calEventTypesFromApi);
        
        // Recheck for default event types after sync (they might have been pulled from Cal.com)
        const { data: defaultsAfterSync } = await supabase
          .from('CalEventType')
          .select('*')
          .eq('calendarIntegrationUlid', calendarIntegration.ulid)
          .eq('isDefault', true)
          .eq('isActive', true);
        
        if (defaultsAfterSync && defaultsAfterSync.length > 0) {
          console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Default event types found after sync', {
            count: defaultsAfterSync.length,
            names: defaultsAfterSync.map((et: DbCalEventType) => et.name)
          });
          
          return {
            data: {
              success: true,
              totalCreated: 0, // We didn't create any, they already existed
              createdEventTypes: defaultsAfterSync
            },
            error: null
          };
        }
      }
    } catch (syncError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Sync with Cal.com failed', {
        error: syncError,
        userUlid
      });
      // Continue with creation - this is non-fatal
    }

    // Create default event types
    const defaultEventTypes = [
      {
        name: 'Coaching Session',
        description: 'A focused 30-minute coaching session to answer your specific questions and provide tailored advice.',
        duration: 30,
        isFree: false,
        isActive: true,
        scheduling: 'MANAGED' as const,
        position: 0,
        maxParticipants: 1,
        discountPercentage: null,
        locations: [{ type: 'link', link: 'https://dibs.coach/call/session', public: true }],
        beforeEventBuffer: 5,
        afterEventBuffer: 5,
        minimumBookingNotice: 60,
        metadata: { isRequired: true }
      },
      {
        name: 'Deep Dive Coaching Call',
        description: 'An in-depth 60-minute coaching session to dive deeper into your challenges and create actionable strategies.',
        duration: 60,
        isFree: false,
        isActive: true,
        scheduling: 'MANAGED' as const,
        position: 1,
        maxParticipants: 1,
        discountPercentage: null,
        locations: [{ type: 'link', link: 'https://dibs.coach/call/session', public: true }],
        beforeEventBuffer: 5,
        afterEventBuffer: 5,
        minimumBookingNotice: 240,
        metadata: { isRequired: true }
      },
      {
        name: 'Get to Know You',
        description: 'A free 15-minute introductory call to discuss your goals and how I can help you achieve them.',
        duration: 15,
        isFree: true,
        isActive: true,
        scheduling: 'MANAGED' as const,
        position: 2,
        maxParticipants: 1,
        discountPercentage: null,
        locations: [{ type: 'link', link: 'https://dibs.coach/call/session', public: true }],
        beforeEventBuffer: 5,
        afterEventBuffer: 5,
        minimumBookingNotice: 60,
        metadata: { isRequired: false }
      }
    ];

    // Create event types
    const createdEventTypes = [];
    let totalCreatedCount = 0;
    let allCreationFailed = true;
    
    const calUserId = calendarIntegration.calManagedUserId;

    // Create each event type
    for (const eventType of defaultEventTypes) {
      // Skip paid event types if no valid hourly rate
      if (!eventType.isFree && !hasValidHourlyRate) {
        console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Skipping paid event type due to missing hourly rate', {
          eventType: eventType.name,
          userUlid,
          timestamp: new Date().toISOString()
        });
        continue;
      }
      
      // Calculate price for paid event types
      const price = eventType.isFree ? 0 : calculateEventPrice(hourlyRate, eventType.duration);
      
      try {
        // Construct the EventType object required by the helper
        const tempEventType = {
          id: 'temp-' + generateUlid(), // Temporary ID for helper
          name: eventType.name,
          description: eventType.description,
          duration: eventType.duration,
          free: eventType.isFree,
          enabled: eventType.isActive,
          isDefault: true, // Mark as default
          schedulingType: eventType.scheduling,
          maxParticipants: eventType.maxParticipants,
          // Ensure discountPercentage is number | undefined
          discountPercentage: eventType.discountPercentage === null ? undefined : eventType.discountPercentage,
          beforeEventBuffer: eventType.beforeEventBuffer,
          afterEventBuffer: eventType.afterEventBuffer,
          minimumBookingNotice: eventType.minimumBookingNotice,
          locations: eventType.locations,
          metadata: eventType.metadata, // Pass metadata along
          // Ensure required fields for EventType are present
          // These won't be sent to Cal.com by the helper if not part of Cal format
          slotInterval: 30, // Default
          organizationId: undefined
        };

        // Prepare payload using the helper function
        const calPayload = eventTypeToCalFormat(tempEventType, price);

        // Create in Cal.com using makeCalApiRequest
        // makeCalApiRequest handles token validation internally via userUlid
        const calEventTypeResult = await makeCalApiRequest(
          `event-types`,
          'POST',
          calPayload, // Use the payload from the helper function
          userUlid
        );
        
        if (!calEventTypeResult) {
          console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Failed to create Cal.com event type', {
            eventType: eventType.name,
            userUlid,
            timestamp: new Date().toISOString()
          });
          continue;
        }
        
        const calEventType = calEventTypeResult;
        
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
            scheduling: eventType.scheduling,
            position: eventType.position,
            price,
            currency: 'USD',
            slug: calEventType.slug,
            locations: eventType.locations,
            bookerLayouts: null,
            beforeEventBuffer: eventType.beforeEventBuffer,
            afterEventBuffer: eventType.afterEventBuffer,
            minimumBookingNotice: eventType.minimumBookingNotice,
            maxParticipants: eventType.maxParticipants,
            discountPercentage: eventType.discountPercentage,
            metadata: eventType.metadata,
            // Required fields
            organizationUlid: null,
            hidden: !eventType.isActive,
            requiresConfirmation: false,
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
          .single();
        
        if (insertError) {
          console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Failed to create DB event type', {
            eventType: eventType.name,
            error: insertError,
            userUlid,
            timestamp: new Date().toISOString()
          });
          continue;
        }
        
        createdEventTypes.push(dbEventType);
        totalCreatedCount++;
        allCreationFailed = false;
      } catch (error) {
        console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Error creating event type', {
          eventType: eventType.name,
          error,
          userUlid,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // If all creation attempts failed, return an error
    if (allCreationFailed && defaultEventTypes.length > 0) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] All event type creation attempts failed', {
        userUlid,
        timestamp: new Date().toISOString()
      });
      return {
        data: { success: false },
        error: { 
          code: 'CREATE_ERROR', 
          message: 'Failed to create default event types. Check Cal.com API response for details.' 
        }
      };
    }
    
    return {
      data: { 
        success: true, 
        totalCreated: totalCreatedCount,
        createdEventTypes
      },
      error: null
    };
  } catch (error) {
    console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR]', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return {
      data: { success: false },
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    };
  }
} 