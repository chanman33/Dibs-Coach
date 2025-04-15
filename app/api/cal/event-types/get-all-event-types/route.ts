import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/supabase/server'
import { auth } from '@clerk/nextjs'
import { syncCalEventTypesWithDb } from '@/utils/actions/cal-event-type-sync'
import { Database } from '@/types/supabase'
import { EventType } from '@/utils/types/cal-event-types'
import { env } from '@/lib/env'
import { makeCalApiRequest } from '@/utils/cal/cal-api-utils'
import { dbToEventType } from '@/utils/types/cal-event-types'

// Type mapping for Cal API response structure (adjust based on actual API)
type CalApiEventType = {
  id: number;
  title: string;
  description?: string | null;
  length: number;
  hidden: boolean;
  position: number;
  price: number;
  currency: string;
  schedulingType?: string | null;
  minimumBookingNotice?: number | null;
  locations?: any[] | null;
  bookerLayouts?: any | null;
  beforeEventBuffer?: number | null;
  afterEventBuffer?: number | null;
  seatsPerTimeSlot?: number | null;
  metadata?: { [key: string]: any } | null;
  slug: string;
  // Add other relevant fields
};

type DbCalEventType = Database['public']['Tables']['CalEventType']['Row'];

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
    
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 })
    }

    const supabase = createAuthClient()
    const { data: userData, error: userError } = await supabase
      .from('User').select('ulid').eq('userId', userId).single()
    if (userError) {
      console.error('[CAL_GET_EVENT_TYPES_ERROR] User lookup failed', { error: userError, userId });
      return NextResponse.json({ success: false, error: 'Failed to find user in database' }, { status: 500 })
    }
    const userUlid = userData.ulid;

    // Get calendar integration ULID
    const { data: calendarIntegration, error: calendarError } = await supabase
      .from('CalendarIntegration').select('ulid, calUsername')
      .eq('userUlid', userUlid).maybeSingle();
    if (calendarError || !calendarIntegration) {
      console.error('[CAL_GET_EVENT_TYPES_ERROR] Failed to fetch calendar integration', { error: calendarError, userUlid });
      return NextResponse.json({ success: false, error: 'Failed to fetch calendar integration' }, { status: 500 });
    }
    const calendarIntegrationUlid = calendarIntegration.ulid;
    const calUsername = calendarIntegration.calUsername;
    
    if (!calUsername) {
      console.error('[CAL_GET_EVENT_TYPES_ERROR] Missing Cal.com username', { userUlid });
      return NextResponse.json({ success: false, error: 'Cal.com username not found' }, { status: 400 });
    }
    
    // Fetch from Cal.com API
    console.log('[CAL_GET_EVENT_TYPES_INFO] Fetching from Cal.com API', { calUsername });
    
    try {
      // Use the utility function that's working in other parts of the codebase
      // Use the exact endpoint format from docs: https://api.cal.com/v2/event-types
      const result = await makeCalApiRequest({
        endpoint: `event-types?username=${encodeURIComponent(calUsername)}`,
        method: 'GET'
      });
      
      console.log('[CAL_GET_EVENT_TYPES_SUCCESS] Response structure:', {
        hasData: !!result.data,
        dataType: result.data ? typeof result.data : null,
        isArray: result.data ? Array.isArray(result.data) : null,
        count: result.data && Array.isArray(result.data) ? result.data.length : 0
      });
      
      const calEventTypesFromApi: CalApiEventType[] = result.data || [];
      console.log('[CAL_GET_EVENT_TYPES_SUCCESS] Retrieved from Cal.com', { count: calEventTypesFromApi.length, userUlid });
      
      // Sync with Database using the imported utility
      console.log('[CAL_GET_EVENT_TYPES_INFO] Syncing with database...');
      const syncResult = await syncCalEventTypesWithDb(userUlid, calendarIntegrationUlid, calEventTypesFromApi);
      if (!syncResult.success) {
        console.error('[CAL_EVENT_TYPES_SYNC_ERROR]', { error: syncResult.error, userUlid });
        // Log the error but continue to return whatever is currently in the DB
      }
      console.log('[CAL_GET_EVENT_TYPES_INFO] Sync completed', { stats: syncResult.stats });
    
    } catch (apiError) {
      console.error('[CAL_GET_EVENT_TYPES_ERROR] Cal.com API error', { 
        error: apiError,
        username: calUsername,
        userUlid
      });
      // Continue with database query to return what we have
    }
    
    // Fetch the final state from the database AFTER sync
    const { data: finalDbEventTypes, error: finalFetchError } = await supabase
        .from('CalEventType')
        .select('*')
        .eq('calendarIntegrationUlid', calendarIntegrationUlid)
        .eq('isActive', true) // Only return active event types
        .order('position', { ascending: true });

    if (finalFetchError) {
         console.error('[CAL_GET_EVENT_TYPES_ERROR] Failed to fetch final DB state', { error: finalFetchError, userUlid });
         return NextResponse.json({ success: false, error: 'Failed to retrieve final event types from database' }, { status: 500 });
    }

    // Map the final DB state to the UI format
    const mappedEventTypes: EventType[] = (finalDbEventTypes || []).map(mapDbEventTypeToUi);

    // Get the coach's hourly rate for pricing display
    const { data: coachProfile } = await supabase
      .from('CoachProfile').select('hourlyRate')
      .eq('userUlid', userUlid).maybeSingle();
    const hourlyRate = coachProfile?.hourlyRate as number | null;
    
    console.log('[CAL_GET_EVENT_TYPES] Returning final event types', { count: mappedEventTypes.length, userUlid });
    return NextResponse.json({
      success: true,
      data: {
        eventTypes: mappedEventTypes,
        coachHourlyRate: {
          hourlyRate,
          isValid: hourlyRate !== null && hourlyRate > 0
        }
      }
    });

  } catch (error) {
    console.error('[CAL_GET_EVENT_TYPES_ERROR] Unexpected error', error);
    return NextResponse.json({ success: false, error: 'Failed to get event types' }, { status: 500 });
  }
}

// Helper function to map DB event type to UI EventType
const mapDbEventTypeToUi = (dbEt: DbCalEventType) => dbToEventType(dbEt);
