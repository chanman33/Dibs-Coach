'use server';

import { createAuthClient } from '@/utils/supabase/server';
import { generateUlid } from '@/utils/ulid';
import { makeCalApiRequest } from '@/lib/cal/cal-api';
import { revalidatePath } from 'next/cache';
import { 
    DbCalEventType,
    CalEventTypeFromApi,
    CalEventTypeResponse,
    SyncResult
} from '@/utils/types/cal-event-types';
import { ApiResponse, ApiErrorCode } from '@/utils/types/api';
import { auth } from '@clerk/nextjs';
import { getAuthenticatedCalUser } from '@/utils/auth';

/**
 * Options for syncing event types
 */
export interface SyncOptions {
    // Whether to revalidate UI paths after sync
    revalidatePaths?: string[];
    // Whether to delete missing event types (true) or just deactivate them (false)
    deleteMissing?: boolean;
    // Return data format - 'cal' for CalEventTypeResponse[] or 'result' for SyncResult
    returnFormat?: 'cal' | 'result';
}

/**
 * Fetches Cal.com event types for a user and returns them
 * This function handles authentication and retrieval only
 * 
 * @param userUlid User's ULID for authentication
 * @param calUsername Optional Cal.com username
 * @returns Cal.com event types or empty array on error
 */
async function fetchCalEventTypes(
    userUlid: string,
    calUsername?: string
): Promise<CalEventTypeFromApi[]> {
    try {
        // If we have a username, use it to fetch event types for the specific user
        const endpoint = calUsername 
            ? `event-types?username=${encodeURIComponent(calUsername)}`
            : 'event-types';

        // Fetch using makeCalApiRequest
        const apiResponse = await makeCalApiRequest<{ data: CalEventTypeFromApi[] }>(
            endpoint,
            'GET',
            undefined,
            userUlid // Pass userUlid for authentication
        );
        
        return apiResponse.data || [];
    } catch (error) {
        console.error('[FETCH_CAL_EVENT_TYPES_ERROR]', { error, userUlid });
        return [];
    }
}

/**
 * Syncs Cal.com event types with the local database for a given user.
 * Creates missing event types, updates existing ones, and deactivates
 * local types that no longer exist in Cal.com.
 * 
 * If `calEventTypesFromApiInput` is empty, it fetches them from Cal.com API.
 * 
 * @param userUlid User's ULID for fetching and authentication
 * @param calendarIntegrationUlid Calendar integration ULID for database operations
 * @param calEventTypesFromApiInput Optional pre-fetched event types from Cal.com
 * @param options Optional configuration for sync behavior
 * @returns SyncResult with success status and stats or Cal event types based on options
 */
export async function syncCalEventTypesWithDb(
    userUlid: string,
    calendarIntegrationUlid: string,
    calEventTypesFromApiInput: CalEventTypeFromApi[] = [],
    options: SyncOptions = {}
): Promise<SyncResult | CalEventTypeResponse[]> {
    const supabase = createAuthClient();
    let fetchedFromCalCount = calEventTypesFromApiInput.length;
    const stats = {
        fetchedFromCal: 0,
        fetchedFromDb: 0,
        createdInDb: 0,
        updatedInDb: 0,
        deactivatedInDb: 0,
        deletedInDb: 0,
        skipped: 0,
    };
    let currentCalEventTypes: CalEventTypeFromApi[] = calEventTypesFromApiInput;
    const finalEventTypes: CalEventTypeResponse[] = [];

    // Set default options
    const {
        revalidatePaths = [],
        deleteMissing = false,
        returnFormat = 'result'
    } = options;

    try {
        // Fetch from Cal.com API if input array is empty
        if (currentCalEventTypes.length === 0) {
            console.log('[SYNC_EVENT_TYPES] Input array empty, fetching from Cal.com API', { userUlid });
            try {
                // Need calUsername to fetch event types for a specific user
                const { data: integrationData, error: integrationError } = await supabase
                    .from('CalendarIntegration')
                    .select('calUsername')
                    .eq('ulid', calendarIntegrationUlid)
                    .single();

                if (integrationError || !integrationData?.calUsername) {
                    console.error('[SYNC_EVENT_TYPES_ERROR] Failed to get Cal username for API fetch', { error: integrationError, userUlid });
                    const errorResult = { success: false, error: 'Failed to get Cal username for synchronization' };
                    return returnFormat === 'cal' ? [] : errorResult;
                }
                
                // Fetch event types using the helper function
                currentCalEventTypes = await fetchCalEventTypes(userUlid, integrationData.calUsername);
                fetchedFromCalCount = currentCalEventTypes.length;
                console.log('[SYNC_EVENT_TYPES] Fetched from Cal.com API', { count: fetchedFromCalCount, userUlid });
            } catch (apiError) {
                console.error('[SYNC_EVENT_TYPES_API_ERROR] Fetching from Cal.com failed', { error: apiError, userUlid });
                const errorResult = { success: false, error: 'Failed to fetch event types from Cal.com' };
                return returnFormat === 'cal' ? [] : errorResult;
            }
        }
        
        stats.fetchedFromCal = fetchedFromCalCount;

        // 1. Get existing DB event types for this integration
        const { data: dbEventTypesData, error: fetchError } = await supabase
            .from('CalEventType')
            .select('*')
            .eq('calendarIntegrationUlid', calendarIntegrationUlid);

        if (fetchError) {
            console.error('[SYNC_EVENT_TYPES_DB_ERROR] Fetching DB types failed', { error: fetchError, userUlid });
            const errorResult = { success: false, error: 'Failed to fetch database event types' };
            return returnFormat === 'cal' ? [] : errorResult;
        }
        const dbEventTypes: DbCalEventType[] = dbEventTypesData || [];
        stats.fetchedFromDb = dbEventTypes.length;


        // 2. Create maps for efficient lookup
        const calApiMap = new Map<number, CalEventTypeFromApi>();
        currentCalEventTypes.forEach(et => calApiMap.set(et.id, et));

        const dbMap = new Map<number, DbCalEventType>();
        dbEventTypes.forEach(et => {
            if (et.calEventTypeId !== null) {
                dbMap.set(et.calEventTypeId, et);
            }
        });

        // 3. Process Creates and Updates (Sequentially)
        for (const calEventType of currentCalEventTypes) {
            // Debug the Cal event type ID
            console.log('[SYNC_EVENT_TYPES_DEBUG] Processing Cal event type:', {
                id: calEventType.id,
                type: typeof calEventType.id,
                title: calEventType.title
            });
            
            const existingDbEntry = dbMap.get(calEventType.id);
            
            // Ensure calEventTypeId is properly converted to a number
            const calEventTypeId = typeof calEventType.id === 'string' ? parseInt(calEventType.id, 10) : calEventType.id;
            
            const dbPayload: Omit<DbCalEventType, 'ulid' | 'createdAt' | 'updatedAt'> = {
                calendarIntegrationUlid,
                calEventTypeId: calEventTypeId, // Use the processed ID
                name: calEventType.title,
                description: calEventType.description || '',
                lengthInMinutes: calEventType.lengthInMinutes || calEventType.length || 30,
                isActive: !calEventType.hidden, // Active if not hidden
                scheduling: (calEventType.schedulingType?.toUpperCase() || 'MANAGED') as DbCalEventType['scheduling'],
                isFree: calEventType.price === 0,
                position: calEventType.position,
                price: calEventType.price,
                currency: calEventType.currency || 'USD',
                minimumBookingNotice: calEventType.minimumBookingNotice || 0,
                locations: calEventType.locations || [],
                bookerLayouts: null, // Set to null as we don't need this field
                beforeEventBuffer: calEventType.beforeEventBuffer || 0,
                afterEventBuffer: calEventType.afterEventBuffer || 0,
                maxParticipants: calEventType.seatsPerTimeSlot ?? null, // Ensure null if undefined
                discountPercentage: calEventType.metadata?.discountPercentage as number | null, // Attempt mapping
                isDefault: existingDbEntry ? existingDbEntry.isDefault : false, // Preserve existing isDefault
                slug: calEventType.slug,
                metadata: calEventType.metadata ?? null, // Ensure null if undefined
                // Add other fields from DbCalEventType that need mapping
                hidden: calEventType.hidden, // Map hidden directly
                organizationUlid: existingDbEntry ? existingDbEntry.organizationUlid : null, // Preserve existing org ID
                slotInterval: null, // Map these if available in calEventType
                successRedirectUrl: null,
                disableGuests: null,
                customName: null,
                useDestinationCalendarEmail: null,
                hideCalendarEventDetails: null,
                color: null,
                requiresConfirmation: false, // Assuming false based on schema
                bookingLimits: null, // Assuming null
            };

            if (existingDbEntry) {
                // Update: Check if relevant fields changed before updating
                // TODO: Add a more robust deep comparison for locations/layouts/metadata if needed
                const needsUpdate = (
                    existingDbEntry.name !== dbPayload.name ||
                    existingDbEntry.description !== dbPayload.description ||
                    existingDbEntry.lengthInMinutes !== dbPayload.lengthInMinutes ||
                    existingDbEntry.isActive !== dbPayload.isActive ||
                    existingDbEntry.scheduling !== dbPayload.scheduling ||
                    existingDbEntry.position !== dbPayload.position ||
                    existingDbEntry.price !== dbPayload.price ||
                    existingDbEntry.minimumBookingNotice !== dbPayload.minimumBookingNotice ||
                    existingDbEntry.maxParticipants !== dbPayload.maxParticipants ||
                    existingDbEntry.discountPercentage !== dbPayload.discountPercentage ||
                    existingDbEntry.slug !== dbPayload.slug ||
                    JSON.stringify(existingDbEntry.locations) !== JSON.stringify(dbPayload.locations) || // Simple JSON compare
                    JSON.stringify(existingDbEntry.metadata) !== JSON.stringify(dbPayload.metadata) // Simple JSON compare
                );

                if (needsUpdate) {
                    console.log('[SYNC_EVENT_TYPES] Updating DB record for Cal ID:', calEventType.id);
                    const { error: updateError } = await supabase
                        .from('CalEventType')
                        .update({ ...dbPayload, updatedAt: new Date().toISOString() })
                        .eq('ulid', existingDbEntry.ulid);

                    if (updateError) {
                         console.error('[SYNC_EVENT_TYPES_DB_ERROR] Update failed', { error: updateError, calId: calEventType.id });
                         // Log error but continue processing other records
                    } else {
                         stats.updatedInDb++;
                    }
                } else {
                    stats.skipped++;
                }
                
                // Add to final event types list for return value
                finalEventTypes.push(calEventType as unknown as CalEventTypeResponse);
            } else {
                // Create
                console.log('[SYNC_EVENT_TYPES] Creating DB record for Cal ID:', calEventType.id);
                const insertPayload: DbCalEventType = {
                    ...dbPayload,
                    ulid: generateUlid(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                     // Ensure all required fields for insert are present, with defaults
                    organizationUlid: null,
                    slotInterval: 30, // Sensible default? Or get from API?
                    successRedirectUrl: null,
                    disableGuests: true, // Sensible default?
                    customName: null,
                    useDestinationCalendarEmail: true, // Sensible default?
                    hideCalendarEventDetails: false, // Sensible default?
                    color: null,
                    requiresConfirmation: false,
                    bookingLimits: null,
                };
                 const { error: insertError } = await supabase
                    .from('CalEventType')
                    .insert(insertPayload);

                if (insertError) {
                     console.error('[SYNC_EVENT_TYPES_DB_ERROR] Insert failed', { error: insertError, calId: calEventType.id });
                     // Log error but continue processing other records
                } else {
                    stats.createdInDb++;
                }
                
                // Add to final event types list for return value
                finalEventTypes.push(calEventType as unknown as CalEventTypeResponse);
            }
        }

        // 4. Process Deactivations or Deletions (Sequentially)
        for (const dbEventType of dbEventTypes) {
            // Check if the event type from DB (which has a Cal ID) is NOT present in the latest fetch from Cal API
            if (dbEventType.calEventTypeId !== null && !calApiMap.has(dbEventType.calEventTypeId)) {
                if (deleteMissing) {
                    // Delete if configured to do so and not a default event type
                    if (!dbEventType.isDefault) {
                        console.log('[SYNC_EVENT_TYPES] Deleting DB record missing from Cal API, Cal ID:', dbEventType.calEventTypeId);
                        const { error: deleteError } = await supabase
                            .from('CalEventType')
                            .delete()
                            .eq('ulid', dbEventType.ulid);

                        if (deleteError) {
                            console.error('[SYNC_EVENT_TYPES_DB_ERROR] Deletion failed', { error: deleteError, ulid: dbEventType.ulid });
                            // Log error but continue processing other records
                        } else {
                            stats.deletedInDb++;
                        }
                    }
                } else {
                    // Deactivate if it's currently active
                    if (dbEventType.isActive) {
                        console.log('[SYNC_EVENT_TYPES] Deactivating DB record missing from Cal API, Cal ID:', dbEventType.calEventTypeId);
                        const { error: deactivateError } = await supabase
                            .from('CalEventType')
                            .update({ isActive: false, updatedAt: new Date().toISOString() })
                            .eq('ulid', dbEventType.ulid);

                        if (deactivateError) {
                            console.error('[SYNC_EVENT_TYPES_DB_ERROR] Deactivation failed', { error: deactivateError, ulid: dbEventType.ulid });
                            // Log error but continue processing other records
                        } else {
                            stats.deactivatedInDb++;
                        }
                    }
                }
            }
        }

        // Revalidate any specified paths
        if (revalidatePaths.length > 0) {
            revalidatePaths.forEach(path => {
                revalidatePath(path);
            });
        }

        console.log('[SYNC_EVENT_TYPES] Sync complete.', { stats, userUlid });
        
        // Return appropriate format based on options
        return returnFormat === 'cal' 
            ? finalEventTypes 
            : { success: true, stats };

    } catch (error) {
        console.error('[SYNC_EVENT_TYPES_ERROR] Unexpected error during sync', { error, userUlid });
        const errorResult = { success: false, error: 'An unexpected error occurred during synchronization', stats };
        return returnFormat === 'cal' ? [] : errorResult;
    }
}

/**
 * Syncs event types for a coach user.
 * Wraps the core sync functionality with user authentication and error handling.
 * 
 * @returns ApiResponse with success status
 */
export async function syncUserEventTypes(
    path?: string
): Promise<ApiResponse<{ success: boolean }>> {
    try {
        // Use the authentication helper to get userUlid and calendar integration
        const authResult = await getAuthenticatedCalUser({ calUsername: true });
        if (authResult.error || !authResult.data) {
            return {
                data: { success: false },
                error: authResult.error || { code: 'INTERNAL_ERROR', message: 'Authentication failed' }
            };
        }

        // Extract data from authentication result
        const { userUlid, integrationUlid } = authResult.data;

        // Set up revalidation paths if provided
        const revalidatePaths = path ? [path] : [];

        // Perform the sync
        const syncResult = await syncCalEventTypesWithDb(
            userUlid,
            integrationUlid,
            [], // Empty array to force fetch from Cal.com API
            { revalidatePaths }
        ) as SyncResult;

        return {
            data: { success: syncResult.success },
            error: syncResult.success ? null : { 
                code: 'INTERNAL_ERROR' as ApiErrorCode, 
                message: syncResult.error || 'Failed to sync event types' 
            }
        };
    } catch (error) {
        console.error('[SYNC_USER_EVENT_TYPES_ERROR]', {
            error,
            timestamp: new Date().toISOString()
        });
        return {
            data: { success: false },
            error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
        };
    }
}
