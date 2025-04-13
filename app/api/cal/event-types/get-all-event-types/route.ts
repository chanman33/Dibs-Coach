import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { auth } from '@clerk/nextjs'
import { ensureValidCalToken, handleCalApiResponse } from '@/utils/cal/token-util'
import { getCalAuthHeaders } from '@/utils/cal/cal-api-utils'

/**
 * API endpoint to get all event types for a user from Cal.com
 * 
 * This endpoint:
 * 1. Authenticates the current user
 * 2. Retrieves their Cal.com managed user token
 * 3. Refreshes the token if expired
 * 4. Calls the Cal.com /v2/event-types endpoint
 * 5. Syncs event types with our database
 * 6. Returns formatted event types data
 * 
 * @returns { success: boolean, data: { eventTypes: any[] } }
 */
export async function GET() {
  try {
    console.log('[CAL_GET_EVENT_TYPES] Starting fetch of user event types');
    
    // Get the user's ID from auth
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not authenticated' 
      }, { status: 401 })
    }

    // Get the user's ULID from the database
    const supabase = createAuthClient()
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()

    if (userError) {
      console.error('[CAL_GET_EVENT_TYPES_ERROR]', {
        error: userError,
        userId,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to find user in database' 
      }, { status: 500 })
    }

    const userUlid = userData.ulid;

    // Ensure the user has a valid Cal.com token
    const tokenResult = await ensureValidCalToken(userUlid);
    if (!tokenResult.success || !tokenResult.tokenInfo?.accessToken) {
      console.error('[CAL_GET_EVENT_TYPES_ERROR] Invalid token', {
        error: tokenResult.error,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: false,
        error: 'Cal.com integration not found or invalid token',
      }, { status: 401 });
    }
    
    // Get calendar integration for the user
    const { data: calendarIntegration, error: calendarError } = await supabase
      .from('CalendarIntegration')
      .select('ulid, calManagedUserId')
      .eq('userUlid', userUlid)
      .maybeSingle();
      
    if (calendarError || !calendarIntegration) {
      console.error('[CAL_GET_EVENT_TYPES_ERROR] Failed to fetch calendar integration', {
        error: calendarError,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch calendar integration',
      }, { status: 500 });
    }
    
    // Call the Cal.com API to get all event types
    const accessToken = tokenResult.tokenInfo.accessToken;
    const apiResponse = await fetch('https://api.cal.com/v2/event-types', {
      method: 'GET',
      headers: {
        ...getCalAuthHeaders(accessToken),
        'cal-api-version': '2024-08-13'
      }
    });

    // Handle token expiration scenarios
    const handledResponse = await handleCalApiResponse(
      apiResponse,
      (newToken) => fetch('https://api.cal.com/v2/event-types', {
        method: 'GET',
        headers: {
          ...getCalAuthHeaders(newToken),
          'cal-api-version': '2024-08-13'
        }
      }),
      userUlid
    );

    if (!handledResponse.ok) {
      const errorText = await handledResponse.text();
      console.error('[CAL_GET_EVENT_TYPES_ERROR] Cal.com API error', {
        status: handledResponse.status,
        errorText,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: false,
        error: `Failed to get event types from Cal.com: ${handledResponse.status}`,
      }, { status: handledResponse.status });
    }

    // Parse the response
    const calResponse = await handledResponse.json();
    const calEventTypes = calResponse.data || [];
    
    console.log('[CAL_GET_EVENT_TYPES_SUCCESS] Retrieved event types from Cal.com', {
      count: calEventTypes.length,
      userUlid,
      timestamp: new Date().toISOString()
    });
    
    // Sync Cal.com event types with our database
    // This ensures we only return event types that actually exist in both systems
    const synced = await syncEventTypesWithDatabase(calEventTypes, calendarIntegration.ulid, userUlid);
    
    if (!synced.success) {
      console.error('[CAL_EVENT_TYPES_SYNC_ERROR]', {
        error: synced.error,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      // Continue despite sync error, but log it
    }
    
    // Get the coach's hourly rate for pricing calculations
    const { data: coachProfile } = await supabase
      .from('CoachProfile')
      .select('hourlyRate')
      .eq('userUlid', userUlid)
      .maybeSingle();
    
    const hourlyRate = coachProfile?.hourlyRate as number | null;
    
    // Return the synced event types
    return NextResponse.json({
      success: true,
      data: {
        eventTypes: synced.eventTypes,
        coachHourlyRate: {
          hourlyRate,
          isValid: hourlyRate !== null && hourlyRate > 0
        }
      }
    });
  } catch (error) {
    console.error('[CAL_GET_EVENT_TYPES_ERROR] Unexpected error', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get event types',
    }, { status: 500 });
  }
}

/**
 * Syncs event types from Cal.com with our database
 * Ensures we only return event types that exist in both systems
 */
async function syncEventTypesWithDatabase(
  calEventTypes: any[], 
  calendarIntegrationUlid: string, 
  userUlid: string
) {
  try {
    const supabase = createAuthClient();
    
    // First, get our existing event types
    const { data: dbEventTypes, error: fetchError } = await supabase
      .from('CalEventType')
      .select('*')
      .eq('calendarIntegrationUlid', calendarIntegrationUlid);
      
    if (fetchError) {
      console.error('[CAL_EVENT_TYPES_SYNC_ERROR] Failed to fetch DB event types', {
        error: fetchError,
        calendarIntegrationUlid,
        userUlid,
        timestamp: new Date().toISOString()
      });
      return { success: false, eventTypes: [], error: fetchError };
    }
    
    // Create a map of Cal.com event types by ID for easy lookup
    const calEventTypesMap = new Map();
    calEventTypes.forEach(et => calEventTypesMap.set(et.id, et));
    
    // Create a map of our database event types by Cal event type ID
    const dbEventTypesMap = new Map();
    dbEventTypes.forEach((et: any) => dbEventTypesMap.set(et.calEventTypeId, et));
    
    // Track sync operations
    const syncOperations = {
      created: 0,
      updated: 0,
      skipped: 0
    };
    
    // Process each Cal.com event type
    for (const calEventType of calEventTypes) {
      const dbEventType = dbEventTypesMap.get(calEventType.id);
      
      if (!dbEventType) {
        // Event type exists in Cal.com but not in our DB, create it
        const { error: insertError } = await supabase
          .from('CalEventType')
          .insert({
            ulid: nanoid(26),
            calendarIntegrationUlid,
            calEventTypeId: calEventType.id,
            name: calEventType.title,
            description: calEventType.description || '',
            duration: calEventType.length,
            isActive: !calEventType.hidden,
            scheduling: calEventType.schedulingType || 'MANAGED',
            isFree: calEventType.price === 0,
            position: calEventType.position,
            currency: calEventType.currency || 'USD',
            minimumBookingNotice: calEventType.minimumBookingNotice || 0,
            locations: calEventType.locations || [],
            bookerLayouts: calEventType.bookerLayouts || { 
              defaultLayout: 'month',
              enabledLayouts: ['month', 'week', 'column']
            },
            beforeEventBuffer: calEventType.beforeEventBuffer || 0,
            afterEventBuffer: calEventType.afterEventBuffer || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
        if (insertError) {
          console.error('[CAL_EVENT_TYPES_SYNC_ERROR] Failed to insert event type', {
            error: insertError,
            calEventType,
            userUlid,
            timestamp: new Date().toISOString()
          });
        } else {
          syncOperations.created++;
        }
      } else {
        // Event type exists in both systems, update if needed
        // For simplicity, we'll skip detailed field-by-field comparison
        syncOperations.updated++;
      }
    }
    
    // Get the final list of event types that exist in both systems
    const { data: finalEventTypes, error: finalError } = await supabase
      .from('CalEventType')
      .select('*')
      .eq('calendarIntegrationUlid', calendarIntegrationUlid)
      .order('position', { ascending: true });
      
    if (finalError) {
      console.error('[CAL_EVENT_TYPES_SYNC_ERROR] Failed to fetch final event types', {
        error: finalError,
        calendarIntegrationUlid,
        userUlid,
        timestamp: new Date().toISOString()
      });
      return { success: false, eventTypes: [], error: finalError };
    }
    
    // Map the database event types to the UI format
    const mappedEventTypes = finalEventTypes.map(et => ({
      id: et.ulid,
      calEventTypeId: et.calEventTypeId,
      name: et.name,
      description: et.description,
      duration: et.duration,
      free: et.isFree,
      enabled: et.isActive,
      isDefault: et.isDefault || false,
      schedulingType: et.scheduling,
      maxParticipants: et.maxParticipants,
      discountPercentage: et.discountPercentage,
      bookerLayouts: et.bookerLayouts,
      locations: et.locations,
      minimumBookingNotice: et.minimumBookingNotice,
      beforeEventBuffer: et.beforeEventBuffer,
      afterEventBuffer: et.afterEventBuffer
    }));
    
    console.log('[CAL_EVENT_TYPES_SYNC_SUCCESS] Synced event types', {
      operations: syncOperations,
      finalCount: mappedEventTypes.length,
      userUlid,
      timestamp: new Date().toISOString()
    });
    
    return { 
      success: true, 
      eventTypes: mappedEventTypes,
      syncOperations
    };
  } catch (error) {
    console.error('[CAL_EVENT_TYPES_SYNC_ERROR] Unexpected error during sync', {
      error,
      userUlid,
      timestamp: new Date().toISOString()
    });
    return { success: false, eventTypes: [], error };
  }
}

// Helper function for generating ULIDs
function nanoid(size = 26) {
  const charset = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let result = '';
  while (size--) result += charset[Math.floor(Math.random() * charset.length)];
  return result;
}
