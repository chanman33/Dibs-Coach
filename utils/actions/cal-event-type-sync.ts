'use server';

import { createAuthClient } from '@/utils/supabase/server';
import { generateUlid } from '@/utils/ulid';
import { Database } from '@/types/supabase';

type CalEventTypeFromApi = {
    id: number;
    title: string;
    description?: string | null;
    length: number; // Duration in minutes (older API format)
    lengthInMinutes?: number; // Duration in minutes (new v2 API format)
    hidden: boolean; // Inactive if true
    position: number;
    price: number;
    currency: string;
    schedulingType?: string | null;
    minimumBookingNotice?: number | null;
    locations?: any[] | null;
    beforeEventBuffer?: number | null;
    afterEventBuffer?: number | null;
    seatsPerTimeSlot?: number | null; // Used for maxParticipants
    metadata?: { [key: string]: any } | null;
    slug: string;
    // Add any other relevant fields from Cal.com v2 API response
};

type DbCalEventType = Database['public']['Tables']['CalEventType']['Row'];

type SyncResult = {
    success: boolean;
    error?: string;
    stats?: {
        fetchedFromCal: number;
        fetchedFromDb: number;
        createdInDb: number;
        updatedInDb: number;
        deactivatedInDb: number; // Deactivated instead of deleted
        skipped: number;
    };
};

/**
 * Syncs Cal.com event types with the local database for a given user.
 * Creates missing event types, updates existing ones, and deactivates
 * local types that no longer exist in Cal.com.
 */
export async function syncCalEventTypesWithDb(
    userUlid: string,
    calendarIntegrationUlid: string,
    calEventTypesFromApi: CalEventTypeFromApi[]
): Promise<SyncResult> {
    const supabase = createAuthClient();
    const stats = {
        fetchedFromCal: calEventTypesFromApi.length,
        fetchedFromDb: 0,
        createdInDb: 0,
        updatedInDb: 0,
        deactivatedInDb: 0,
        skipped: 0,
    };

    try {
        // 1. Get existing DB event types for this integration
        const { data: dbEventTypesData, error: fetchError } = await supabase
            .from('CalEventType')
            .select('*')
            .eq('calendarIntegrationUlid', calendarIntegrationUlid);

        if (fetchError) {
            console.error('[SYNC_EVENT_TYPES_DB_ERROR] Fetching DB types failed', { error: fetchError, userUlid });
            return { success: false, error: 'Failed to fetch database event types' };
        }
        const dbEventTypes: DbCalEventType[] = dbEventTypesData || [];
        stats.fetchedFromDb = dbEventTypes.length;


        // 2. Create maps for efficient lookup
        const calApiMap = new Map<number, CalEventTypeFromApi>();
        calEventTypesFromApi.forEach(et => calApiMap.set(et.id, et));

        const dbMap = new Map<number, DbCalEventType>();
        dbEventTypes.forEach(et => {
            if (et.calEventTypeId !== null) {
                dbMap.set(et.calEventTypeId, et);
            }
        });

        // 3. Process Creates and Updates (Sequentially)
        for (const calEventType of calEventTypesFromApi) {
            const existingDbRecord = dbMap.get(calEventType.id);
            const dbPayload: Omit<DbCalEventType, 'ulid' | 'createdAt' | 'updatedAt'> = {
                calendarIntegrationUlid,
                calEventTypeId: calEventType.id,
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
                isDefault: existingDbRecord ? existingDbRecord.isDefault : false, // Preserve existing isDefault
                slug: calEventType.slug,
                metadata: calEventType.metadata ?? null, // Ensure null if undefined
                // Add other fields from DbCalEventType that need mapping
                hidden: calEventType.hidden, // Map hidden directly
                organizationUlid: existingDbRecord ? existingDbRecord.organizationUlid : null, // Preserve existing org ID
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

            if (existingDbRecord) {
                // Update: Check if relevant fields changed before updating
                // TODO: Add a more robust deep comparison for locations/layouts/metadata if needed
                const needsUpdate = (
                    existingDbRecord.name !== dbPayload.name ||
                    existingDbRecord.description !== dbPayload.description ||
                    existingDbRecord.lengthInMinutes !== dbPayload.lengthInMinutes ||
                    existingDbRecord.isActive !== dbPayload.isActive ||
                    existingDbRecord.scheduling !== dbPayload.scheduling ||
                    existingDbRecord.position !== dbPayload.position ||
                    existingDbRecord.price !== dbPayload.price ||
                    existingDbRecord.minimumBookingNotice !== dbPayload.minimumBookingNotice ||
                    existingDbRecord.maxParticipants !== dbPayload.maxParticipants ||
                    existingDbRecord.discountPercentage !== dbPayload.discountPercentage ||
                    existingDbRecord.slug !== dbPayload.slug ||
                    JSON.stringify(existingDbRecord.locations) !== JSON.stringify(dbPayload.locations) || // Simple JSON compare
                    JSON.stringify(existingDbRecord.metadata) !== JSON.stringify(dbPayload.metadata) // Simple JSON compare
                );

                if (needsUpdate) {
                    console.log('[SYNC_EVENT_TYPES] Updating DB record for Cal ID:', calEventType.id);
                    const { error: updateError } = await supabase
                        .from('CalEventType')
                        .update({ ...dbPayload, updatedAt: new Date().toISOString() })
                        .eq('ulid', existingDbRecord.ulid);

                    if (updateError) {
                         console.error('[SYNC_EVENT_TYPES_DB_ERROR] Update failed', { error: updateError, calId: calEventType.id });
                         // Log error but continue processing other records
                    } else {
                         stats.updatedInDb++;
                    }
                } else {
                    stats.skipped++;
                }
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
            }
        }

        // 4. Process Deactivations (Sequentially)
        for (const dbEventType of dbEventTypes) {
            // Check if the event type from DB (which has a Cal ID) is NOT present in the latest fetch from Cal API
            if (dbEventType.calEventTypeId !== null && !calApiMap.has(dbEventType.calEventTypeId)) {
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

        console.log('[SYNC_EVENT_TYPES] Sync complete.', { stats, userUlid });
        return { success: true, stats };

    } catch (error) {
        console.error('[SYNC_EVENT_TYPES_ERROR] Unexpected error during sync', { error, userUlid });
        return { success: false, error: 'An unexpected error occurred during synchronization', stats };
    }
}
