'use server'

import { auth } from '@clerk/nextjs'
import { createAuthClient } from '@/utils/auth'
import { revalidatePath } from 'next/cache'
// Import the robust makeCalApiRequest
import { makeCalApiRequest } from '@/lib/cal/cal-api' 
// Remove ensureValidCalToken import from actions, makeCalApiRequest handles it
// import { ensureValidCalToken } from './cal-tokens' 
import { 
  // CalEventTypeInput, // Still assuming this exists
  CalEventTypeResponse, 
  eventTypeToDbFields, // Use this instead
  dbToEventType
} from '@/utils/types/cal-event-types'
import { Database } from '@/types/supabase'
import { Decimal } from '@prisma/client/runtime/library'
import { fetchCoachHourlyRate } from '@/utils/actions/coach-rate-actions'
// Import the standard API response types
import { ApiResponse, ApiError } from '@/utils/types/api' 


type DbCalEventType = Database['public']['Tables']['CalEventType']['Row'];

/**
 * Fetches all event types for the current user from both the database and Cal.com,
 * synchronizes them, and returns the combined list.
 */
export async function fetchAndSyncEventTypes(): Promise<CalEventTypeResponse[]> {
  const { userId } = auth()
  if (!userId) {
    console.error('[CAL_EVENT_TYPE_ERROR] User not authenticated')
    return []
  }

  const supabase = createAuthClient()

  try {
    // Get user ULID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()

    if (userError || !userData) {
      console.error('[CAL_EVENT_TYPE_ERROR] User not found', { userId, error: userError })
      return []
    }
    const userUlid = userData.ulid

    // --- Token validation is handled by makeCalApiRequest --- 
    // const { data: integration, error: integrationError } = ...
    // const tokenResult = await ensureValidCalToken(userUlid)
    // if (!tokenResult.success || !tokenResult.accessToken) { ... return [] }
    // const validAccessToken = tokenResult.accessToken;
    // --- End of removal ---

    // Fetch event types from Cal.com API using the userUlid for auth
    const calApiResponse = await makeCalApiRequest<{
      event_types: CalEventTypeResponse[]; // Adjust based on actual Cal.com response structure
    }>(
      '/event-types', // Endpoint
      'GET',          // Method
      undefined,      // Body
      userUlid        // Pass userUlid for automatic token handling
    )
    
    // Assuming the actual data is nested, e.g., in response.event_types
    const calEventTypes = calApiResponse?.event_types || [];

    // Fetch existing event types from our database
    const { data: dbEventTypes, error: dbError } = await supabase
      .from('CalEventType')
      .select('*')
      .eq('userUlid', userUlid)

    if (dbError) {
      console.error('[CAL_EVENT_TYPE_ERROR] Failed to fetch DB event types', { userUlid, error: dbError })
      // Decide how to handle DB error - maybe return just Cal.com data?
      // For now, return Cal.com data, but log the error
    }

    const syncedEventTypes = await syncEventTypesWithDb(
      calEventTypes || [], 
      dbEventTypes || [], 
      userUlid
    )

    return syncedEventTypes

  } catch (error) {
    console.error('[CAL_EVENT_TYPE_ERROR] Unexpected error in fetchAndSyncEventTypes', { error })
    return []
  }
}

/**
 * Synchronizes Cal.com event types with the local database.
 */
async function syncEventTypesWithDb(
  calEventTypes: CalEventTypeResponse[], 
  dbEventTypes: DbCalEventType[], 
  userUlid: string
): Promise<CalEventTypeResponse[]> {
  const supabase = createAuthClient()
  const calEventTypeMap = new Map(calEventTypes.map(et => [et.id, et]))
  const dbEventTypeMap = new Map(dbEventTypes.map(et => [et.calEventTypeId, et]))

  const operations = []
  const finalEventTypes: CalEventTypeResponse[] = []

  // 1. Update existing or insert new event types from Cal.com
  for (const calEventType of calEventTypes) {
    const existingDbEntry = dbEventTypeMap.get(calEventType.id)
    const dbPayload = eventTypeToDbFields(calEventType as any, userUlid)

    if (existingDbEntry) {
      // Update existing entry
      operations.push(
        supabase
          .from('CalEventType')
          .update(dbPayload)
          .eq('ulid', existingDbEntry.ulid)
      )
      // Use potentially updated DB data or Cal data for the final list?
      // Let's use Cal data as the source of truth for now
      finalEventTypes.push(calEventType)
    } else {
      // Insert new entry
      operations.push(
        supabase
          .from('CalEventType')
          .insert(dbPayload)
      )
      finalEventTypes.push(calEventType)
    }
  }

  // 2. Delete event types from DB that no longer exist in Cal.com
  for (const dbEventType of dbEventTypes) {
    if (dbEventType.calEventTypeId && !calEventTypeMap.has(dbEventType.calEventTypeId)) {
      operations.push(
        supabase
          .from('CalEventType')
          .delete()
          .eq('ulid', dbEventType.ulid)
      )
    }
    // Ensure DB entries not deleted are also considered if not already added
    else if (dbEventType.calEventTypeId && !finalEventTypes.some(fet => fet.id === dbEventType.calEventTypeId)) {
      // Convert DB entry back to response type if needed
      // This case might happen if Cal API failed but DB had data
      console.warn('[SYNC_DB_WARNING] DB event type found but not in Cal response, skipping inclusion in final list for now.', { dbEventTypeId: dbEventType.calEventTypeId });
    }
  }

  // Execute all DB operations
  const results = await Promise.allSettled(operations)
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`[CAL_EVENT_TYPE_SYNC_ERROR] DB operation failed`, {
        error: result.reason
        // Potentially add more context about the operation
      })
    }
  })

  return finalEventTypes
}


/**
 * Fetches a single event type by its Cal.com ID.
 */
export async function fetchEventTypeById(eventTypeId: number): Promise<CalEventTypeResponse | null> {
  const { userId } = auth()
  if (!userId) {
     console.error('[CAL_EVENT_TYPE_ERROR] User not authenticated for fetchEventTypeById')
     return null
  }

  const supabase = createAuthClient()
  const { data: userData, error: userFetchError } = await supabase.from('User').select('ulid').eq('userId', userId).single()
  if (userFetchError || !userData) {
     console.error('[CAL_EVENT_TYPE_ERROR] User not found for fetchEventTypeById', { userId, error: userFetchError })
     return null
  }
  const userUlid = userData.ulid;

  // --- Token validation handled by makeCalApiRequest --- 
  // const { data: integration, error: integrationFetchError } = ...
  // const tokenResult = await ensureValidCalToken(userUlid)
  // if (!tokenResult.success || !tokenResult.accessToken) { ... return null }
  // --- End of removal ---

  try {
    // Use the makeCalApiRequest that handles tokens via userUlid
    const response = await makeCalApiRequest<{
      event_type: CalEventTypeResponse; // Adjust based on actual Cal.com response structure
    }>(
      `/event-types/${eventTypeId}`,
      'GET',
      undefined,
      userUlid // Pass userUlid for auth
    )
    // Adjust based on actual Cal.com response structure for single fetch
    return response?.event_type || null 
  } catch (error) {
    console.error(`[CAL_EVENT_TYPE_ERROR] Failed to fetch event type ${eventTypeId}`, { error })
    return null
  }
}

/**
 * Creates a new event type in Cal.com and saves it to the database.
 */
export async function createEventType(eventTypeData: any /* Use specific type CalEventTypeInput if available */): Promise<ApiResponse<CalEventTypeResponse>> {
  const { userId } = auth()
  if (!userId) return { data: null, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }

  const supabase = createAuthClient()
  const { data: userData } = await supabase.from('User').select('ulid').eq('userId', userId).single()
  if (!userData) return { data: null, error: { code: 'USER_NOT_FOUND', message: 'User not found' } }
  const userUlid = userData.ulid;
  
  // --- Token validation handled by makeCalApiRequest --- 
  // const { data: integration } = ...
  // const tokenResult = await ensureValidCalToken(userUlid)
  // if (!tokenResult.success || !tokenResult.accessToken) { ... return { success: false, error: ... }}
  // --- End of removal ---
  
  // Fetch hourly rate if not provided (assuming this logic is correct)
  if (eventTypeData.price === undefined || eventTypeData.price === null) {
      // Correct: Call fetchCoachHourlyRate without arguments
      // Explicitly pass undefined to potentially satisfy linter
      const rateResponse = await fetchCoachHourlyRate(undefined); 
      // Check for error correctly based on ApiResponse structure
      if (rateResponse.error) { 
          return { 
            data: null, 
            // Use the error message from the ApiError object
            error: { 
              code: rateResponse.error.code || 'INTERNAL_ERROR', 
              message: rateResponse.error.message || 'Failed to fetch coach hourly rate' 
            }
          }; 
      }
      // Check if data exists and rate is valid
      if (rateResponse.data === null || !rateResponse.data.isValid) {
          return {
            data: null,
            error: { code: 'VALIDATION_ERROR', message: 'Coach hourly rate is not set or invalid.' }
          }
      }
      eventTypeData.price = rateResponse.data.hourlyRate; 
      eventTypeData.currency = 'usd';
  }

  try {
    const response = await makeCalApiRequest<{
       event_type: CalEventTypeResponse; // Adjust based on Cal.com structure
    }>(
      '/event-types',
      'POST',
      eventTypeData, // Body
      userUlid       // Pass userUlid for auth
    )

    const newEventType = response.event_type

    // Save to DB (assuming mapEventTypeToDb exists and works)
    const dbPayload = eventTypeToDbFields(newEventType as any, userData.ulid)
    const { error: dbError } = await supabase.from('CalEventType').insert(dbPayload)

    if (dbError) {
      console.error('[CAL_EVENT_TYPE_ERROR] Failed to save created event type to DB', { error: dbError })
      // Log error but consider Cal.com creation successful
    }

    revalidatePath('/dashboard/coach/availability')
    // Adjust return type for success
    return { data: newEventType, error: null }

  } catch (error: any) {
    console.error('[CAL_EVENT_TYPE_ERROR] Failed to create event type', { error })
    // Adjust return type for error
    return { 
        data: null, 
        error: { 
            code: 'CREATE_ERROR', // Use a relevant error code 
            message: error.message || 'Failed to create event type' 
        }
    }
  }
}

/**
 * Updates an existing event type in Cal.com and the database.
 */
export async function updateEventType(
  eventTypeId: number,
  eventTypeData: any /* Partial<CalEventTypeInput> */
): Promise<ApiResponse<CalEventTypeResponse>> {
  const { userId } = auth()
  if (!userId) return { data: null, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }

  const supabase = createAuthClient()
  const { data: userData } = await supabase.from('User').select('ulid').eq('userId', userId).single()
  if (!userData) return { data: null, error: { code: 'USER_NOT_FOUND', message: 'User not found' } }
  const userUlid = userData.ulid;

  // --- Token validation handled by makeCalApiRequest --- 
  // const { data: integration } = ...
  // const tokenResult = await ensureValidCalToken(userUlid)
  // if (!tokenResult.success || !tokenResult.accessToken) { ... return { success: false, error: ... }}
  // --- End of removal ---

  try {
    const response = await makeCalApiRequest<{
       event_type: CalEventTypeResponse; // Adjust based on Cal.com structure
    }>(
      `/event-types/${eventTypeId}`,
      'PATCH',
      eventTypeData, // Body
      userUlid       // Pass userUlid for auth
    )

    const updatedEventType = response.event_type

    // Update in DB (assuming mapEventTypeToDb exists and works)
    const dbPayload = eventTypeToDbFields(updatedEventType as any, userData.ulid)
    const { ulid, calEventTypeId, createdAt, ...updatePayload } = dbPayload; // Removed userUlid from destructuring
    
    const { error: dbError } = await supabase
      .from('CalEventType')
      .update(updatePayload)
      .eq('calEventTypeId', eventTypeId)
      .eq('userUlid', userData.ulid) // Keep userUlid in eq filter

    if (dbError) {
      console.error('[CAL_EVENT_TYPE_ERROR] Failed to update event type in DB', { eventTypeId, error: dbError })
      // Log error but consider Cal.com update successful
    }

    revalidatePath('/dashboard/coach/availability')
    // Adjust return type for success
    return { data: updatedEventType, error: null }

  } catch (error: any) {
    console.error(`[CAL_EVENT_TYPE_ERROR] Failed to update event type ${eventTypeId}`, { error })
    // Adjust return type for error
    return { 
        data: null, 
        error: { 
            code: 'UPDATE_ERROR', // Use a relevant error code 
            message: error.message || 'Failed to update event type' 
        }
    }
  }
}

/**
 * Deletes an event type from Cal.com and the database.
 */
export async function deleteEventType(eventTypeId: number): Promise<ApiResponse<null>> { // Data is null on success
  const { userId } = auth()
  if (!userId) return { data: null, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }

  const supabase = createAuthClient()
  const { data: userData } = await supabase.from('User').select('ulid').eq('userId', userId).single()
  if (!userData) return { data: null, error: { code: 'USER_NOT_FOUND', message: 'User not found' } }
  const userUlid = userData.ulid;

  // --- Token validation handled by makeCalApiRequest --- 
  // const { data: integration } = ...
  // const tokenResult = await ensureValidCalToken(userUlid)
  // if (!tokenResult.success || !tokenResult.accessToken) { ... return { success: false, error: ... }}
  // --- End of removal ---

  try {
    // Pass userUlid for auth, expect no body in response for DELETE
    await makeCalApiRequest<void>(
      `/event-types/${eventTypeId}`,
      'DELETE',
      undefined, // No body for DELETE
      userUlid   // Pass userUlid for auth
    )

    // Delete from DB
    const { error: dbError } = await supabase
      .from('CalEventType')
      .delete()
      .eq('calEventTypeId', eventTypeId)
      .eq('userUlid', userData.ulid)

    if (dbError) {
      console.error('[CAL_EVENT_TYPE_ERROR] Failed to delete event type from DB', { eventTypeId, error: dbError })
      // Log error but consider Cal.com deletion successful
    }

    revalidatePath('/dashboard/coach/availability')
    // Adjust return type for success (data is null)
    return { data: null, error: null }

  } catch (error: any) {
    console.error(`[CAL_EVENT_TYPE_ERROR] Failed to delete event type ${eventTypeId}`, { error })
    // Adjust return type for error
    return { 
        data: null, 
        error: { 
            code: 'DELETE_ERROR', // Use a relevant error code 
            message: error.message || 'Failed to delete event type' 
        }
    }
  }
}
