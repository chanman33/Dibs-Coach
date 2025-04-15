/**
 * Cal.com Event Types API - Create Default Event Types
 * 
 * This API route creates the default event types for a coach if they don't exist.
 * It first syncs event types from Cal.com with the local database.
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { createAuthClient } from '@/utils/supabase/server'
import { generateUlid } from '@/utils/ulid'
import { ensureValidCalToken, handleCalApiResponse } from '@/utils/cal/token-util'
import { syncCalEventTypesWithDb } from '@/utils/actions/cal-event-type-sync' // Import the new sync function
import { 
  DefaultCalEventType, 
  CalEventTypeCreatePayload, 
  CalEventTypeLocation
} from '@/utils/types/cal-event-types'
import { getCalAuthHeaders, makeCalApiRequest } from '@/utils/cal/cal-api-utils' // Add makeCalApiRequest import
import { Database } from '@/types/supabase' // Import Database type
import { createDefaultEventTypesWithUniqueSlug } from '@/utils/actions/cal-event-type-actions'

// Define the specific table type
type DbCalEventType = Database['public']['Tables']['CalEventType']['Row'];

// Add this helper function before the POST handler to construct event type payload
function constructCalEventTypePayload(eventType: DefaultCalEventType) {
  // Log the construction process
  console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Constructing payload for', {
    eventName: eventType.name,
    slug: eventType.slug,
    timestamp: new Date().toISOString()
  });

  return {
    title: eventType.title,
    slug: eventType.slug,
    description: eventType.description,
    lengthInMinutes: eventType.lengthInMinutes,
    hidden: false,
    metadata: {
      isRequired: eventType.isRequired || false, // Store the isRequired flag in metadata for UI
    },
    locations: eventType.locations || [{
      type: "link",
      link: "https://dibs.coach/call/session", 
      public: true
    }],
    customInputs: [],
    children: [],
    hosts: [],
    schedule: null,
    workflows: [],
    successRedirectUrl: null,
    brandColor: eventType.color.lightThemeHex,
    periodType: "UNLIMITED",
    periodDays: null,
    periodStartDate: null,
    periodEndDate: null,
    periodCountCalendarDays: null,
    requiresConfirmation: false,
    requiresBookerEmailVerification: false,
    price: eventType.isFree ? 0 : null, // Will be set appropriately for paid events in the creation flow
    currency: "USD",
    slotInterval: eventType.slotInterval,
    minimumBookingNotice: eventType.minimumBookingNotice,
    beforeEventBuffer: eventType.beforeEventBuffer || 0,
    afterEventBuffer: eventType.afterEventBuffer || 0,
    seatsPerTimeSlot: eventType.seats?.seatsPerTimeSlot || null,
    seatsShowAttendees: eventType.seats?.showAttendeeInfo || false,
    seatsShowAvailabilityCount: eventType.seats?.showAvailabilityCount || false,
    disableGuests: eventType.disableGuests,
    hideCalendarNotes: eventType.hideCalendarEventDetails,
    schedulingType: null,
    durationLimits: null,
    bookingLimits: null,
    requiresBookerAddress: false,
    eventName: eventType.customName,
    team: null
  };
}

export async function POST(request: Request) {
  try {
    console.log('[CREATE_DEFAULT_EVENT_TYPES] Starting creation of default event types');
    
    // Get authenticated user
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const requestBody = await request.json()
    
    // Extract optional fields from request body
    const {
      userUlid // Optional: If admin is creating for a specific user
    } = requestBody

    // Initialize Supabase client
    const supabase = createAuthClient()

    // Get the user's ULID (either the specified one or the authenticated user's)
    let targetUserUlid = userUlid

    if (!targetUserUlid) {
      // Get the authenticated user's ULID
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('ulid')
        .eq('userId', userId)
        .single()

      if (userError) {
        console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] User lookup', { error: userError, userId });
        return NextResponse.json(
          { error: 'Failed to find user in database' },
          { status: 500 }
        )
      }

      targetUserUlid = userData.ulid
    }

    console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Target User ULID', { targetUserUlid });

    // Get calendar integration for the user
    const { data: calendarIntegration, error: calendarError } = await supabase
      .from('CalendarIntegration')
      .select('ulid, calManagedUserId, calUsername')
      .eq('userUlid', targetUserUlid)
      .maybeSingle()

    if (calendarError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Calendar Integration lookup', { error: calendarError, targetUserUlid });
      return NextResponse.json(
        { error: 'Failed to fetch calendar integration' },
        { status: 500 }
      )
    }

    if (!calendarIntegration) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] No Cal.com integration found', { targetUserUlid });
      return NextResponse.json(
        { error: 'No Cal.com integration found for this user' },
        { status: 400 }
      )
    }

    console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Calendar Integration found', { calManagedUserId: calendarIntegration.calManagedUserId });

    // Ensure we have a managed user ID, otherwise we can't create event types
    if (!calendarIntegration.calManagedUserId) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] No managed user ID found', { targetUserUlid });
      return NextResponse.json(
        { error: 'No Cal.com managed user found for this user. Please reconnect Cal.com in settings.' },
        { status: 400 }
      )
    }
    
    // Ensure we have a username
    if (!calendarIntegration.calUsername) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] No Cal.com username found', { targetUserUlid });
      return NextResponse.json(
        { error: 'No Cal.com username found for this user. Please reconnect Cal.com in settings.' },
        { status: 400 }
      )
    }

    // IDEMPOTENCY CHECK: First check if default event types already exist in the local database
    // If they do, return success without doing anything else
    const { data: existingDefaultEventTypes, error: defaultCheckError } = await supabase
      .from('CalEventType')
      .select('*')
      .eq('calendarIntegrationUlid', calendarIntegration.ulid)
      .eq('isDefault', true)
      .eq('isActive', true);

    if (defaultCheckError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Failed to check for existing default event types', { 
        error: defaultCheckError, 
        targetUserUlid,
        calendarIntegrationUlid: calendarIntegration.ulid 
      });
      // Continue execution - this is non-fatal
    } else if (existingDefaultEventTypes && existingDefaultEventTypes.length > 0) {
      console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Default event types already exist, skipping creation', { 
        count: existingDefaultEventTypes.length,
        existingNames: existingDefaultEventTypes.map((et: DbCalEventType) => et.name),
        targetUserUlid 
      });
      
      // Return success - route is idempotent
      return NextResponse.json({ 
        success: true, 
        message: 'Default event types already exist', 
        existingCount: existingDefaultEventTypes.length,
        existingTypes: existingDefaultEventTypes.map((et: DbCalEventType) => et.name)
      });
    }

    // Ensure a valid token exists, refreshing if necessary
    const tokenResult = await ensureValidCalToken(targetUserUlid);
    if (!tokenResult.success || !tokenResult.tokenInfo?.accessToken) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Invalid token', { error: tokenResult.error, targetUserUlid });
      return NextResponse.json(
        { error: tokenResult.error || 'Failed to obtain valid Cal.com token. Please reconnect in settings.' },
        { status: 401 }
      )
    }
    let currentAccessToken = tokenResult.tokenInfo.accessToken;
    console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Valid token obtained', { tokenPrefix: currentAccessToken.substring(0, 5) + "...", targetUserUlid });

    // Get coach's hourly rate for paid events
    const { data: coachProfile, error: profileError } = await supabase
      .from('CoachProfile')
      .select('hourlyRate')
      .eq('userUlid', targetUserUlid)
      .maybeSingle()

    if (profileError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Coach Profile lookup', { error: profileError, targetUserUlid });
      return NextResponse.json(
        { error: 'Failed to fetch coach profile for pricing' },
        { status: 500 }
      )
    }

    const hourlyRate = coachProfile?.hourlyRate as number || 0
    const hasValidHourlyRate = hourlyRate !== null && hourlyRate !== undefined && hourlyRate > 0
    console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Hourly Rate check', { hourlyRate, hasValidHourlyRate });

    // 1. Fetch existing event types from Cal.com
    console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Fetching existing types from Cal.com', { calUsername: calendarIntegration.calUsername });
    
    // Initialize this outside the try block so it can be accessed in the rest of the function
    let calEventTypesFromApi: any[] = [];
    
    try {
      // Use the same makeCalApiRequest utility that works in get-all-event-types
      const result = await makeCalApiRequest({
        endpoint: `event-types?username=${encodeURIComponent(calendarIntegration.calUsername)}`,
        method: 'GET'
      });
      
      // The makeCalApiRequest function returns the full response object
      // We need to extract the data array from it properly
      if (result && result.data && Array.isArray(result.data)) {
        calEventTypesFromApi = result.data;
      } else if (result && Array.isArray(result)) {
        calEventTypesFromApi = result;
      } else {
        console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] No event types found in Cal.com or unexpected response format', { 
          resultType: typeof result,
          hasData: !!result?.data,
          isDataArray: result?.data ? Array.isArray(result.data) : false
        });
        // Initialize as empty array if response format is unexpected
        calEventTypesFromApi = [];
      }
      
      console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Fetched from Cal.com', { count: calEventTypesFromApi.length });
    
      // 2. Sync with Database
      console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Syncing with database...');
      const syncResult = await syncCalEventTypesWithDb(targetUserUlid, calendarIntegration.ulid, calEventTypesFromApi);
      if (!syncResult.success) {
        console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Sync failed', { error: syncResult.error, targetUserUlid });
        // Continue with default creation attempt instead of failing
        console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Continuing with default event type creation despite sync failure');
      } else {
        console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Sync completed', { stats: syncResult.stats });
      }
    } catch (apiError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Cal.com API error', { 
        error: apiError,
        username: calendarIntegration.calUsername,
        userUlid: targetUserUlid
      });
      // Continue with default creation logic as fallback
    }

    // 3. Recheck for default event types after sync (they might have been pulled from Cal.com)
    const { data: localEventTypesAfterSync, error: postSyncFetchError } = await supabase
      .from('CalEventType')
      .select('name, isDefault')
      .eq('calendarIntegrationUlid', calendarIntegration.ulid)
      .eq('isDefault', true)
      .eq('isActive', true); // Only consider active defaults

    if (postSyncFetchError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Post-Sync DB Check', { error: postSyncFetchError, targetUserUlid });
      // Continue with default creation attempt
    } else if (localEventTypesAfterSync && localEventTypesAfterSync.length > 0) {
      // Defaults were found from Cal.com sync - we're done!
      const localDefaultEventTypeNames = localEventTypesAfterSync.map((et: { name: string }) => et.name);
      console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Default event types found after sync with Cal.com', { 
        count: localDefaultEventTypeNames.length, 
        names: localDefaultEventTypeNames 
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Default event types found from Cal.com sync', 
        existingCount: localDefaultEventTypeNames.length,
        existingTypes: localDefaultEventTypeNames
      });
    }

    // 4. Check if default event types already exist in Cal.com but not in our DB
    // This is a key idempotency check to avoid duplicate creation
    const defaultEventTypeNames = ['1:1 Q&A Coaching Call', '1:1 Deep Dive Coaching Call', 'Get to Know You'];
    const defaultEventTypesInCal = calEventTypesFromApi.filter((et: any) => 
      defaultEventTypeNames.includes(et.title)
    );
    
    if (defaultEventTypesInCal.length > 0) {
      console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Found default event types in Cal.com but not in our DB', { 
        count: defaultEventTypesInCal.length,
        names: defaultEventTypesInCal.map((et: any) => et.title)
      });
      
      // They exist in Cal.com but not locally - save them to our DB
      try {
        for (const calEventType of defaultEventTypesInCal) {
          // Determine if this is a required event type (30-min or 60-min session)
          // Q&A and Deep Dive session are required, Get to Know You is not
          const isRequiredEventType = 
            calEventType.title === '1:1 Q&A Coaching Call' || 
            calEventType.title === '1:1 Deep Dive Coaching Call';
          
          // For required event types, always set active to true
          const isActive = isRequiredEventType ? true : !calEventType.hidden;
          
          // Determine if this is a free event type (only Get to Know You is free)
          const isFree = calEventType.title === 'Get to Know You';
          
          // Prepare the metadata with isRequired flag
          const metadata = {
            ...(calEventType.metadata || {}),
            isRequired: isRequiredEventType,
          };
          
          const dbPayload = {
            ulid: generateUlid(),
            calendarIntegrationUlid: calendarIntegration.ulid,
            calEventTypeId: calEventType.id,
            name: calEventType.title,
            description: calEventType.description || '',
            lengthInMinutes: calEventType.lengthInMinutes || calEventType.length || 30,
            isActive: isActive, // Use our determined active status
            isDefault: true, // Mark as default event type
            isFree: isFree, // Only Get to Know You is free
            scheduling: (calEventType.schedulingType?.toUpperCase() || 'MANAGED') as DbCalEventType['scheduling'],
            position: calEventType.position,
            price: calEventType.price, // Keep the Cal.com price
            currency: calEventType.currency || 'USD',
            minimumBookingNotice: calEventType.minimumBookingNotice || 0,
            locations: calEventType.locations || [],
            bookerLayouts: calEventType.bookerLayouts || { defaultLayout: 'month', enabledLayouts: ['month', 'week', 'column'] },
            beforeEventBuffer: calEventType.beforeEventBuffer || 0,
            afterEventBuffer: calEventType.afterEventBuffer || 0,
            maxParticipants: calEventType.seatsPerTimeSlot ?? null,
            discountPercentage: calEventType.metadata?.discountPercentage as number | null,
            slug: calEventType.slug,
            // Fill in required fields with defaults
            metadata: metadata, // Use the updated metadata with isRequired flag
            organizationUlid: null,
            slotInterval: 30,
            hidden: !isActive, // Hidden is inverse of active
            successRedirectUrl: null,
            disableGuests: true,
            customName: null,
            useDestinationCalendarEmail: true,
            hideCalendarEventDetails: false,
            color: null,
            requiresConfirmation: false,
            bookingLimits: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          const { error: insertError } = await supabase
            .from('CalEventType')
            .insert(dbPayload);
            
          if (insertError) {
            console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Failed to insert Cal.com default event type to DB', {
              error: insertError,
              calEventTypeId: calEventType.id,
              name: calEventType.title
            });
            // Continue with other event types
          } else {
            console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Successfully inserted Cal.com default event type to DB', {
              calEventTypeId: calEventType.id,
              name: calEventType.title
            });
          }
        }
        
        return NextResponse.json({
          success: true,
          message: 'Default event types found in Cal.com and saved to database',
          savedCount: defaultEventTypesInCal.length,
          savedTypes: defaultEventTypesInCal.map((et: any) => et.title)
        });
      } catch (error) {
        console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Error saving Cal.com defaults to DB', { error });
        // Continue with creation flow as fallback
      }
    }

    // 4. Get coach's hourly rate (needed for creating potentially missing paid defaults)
    const { data: coachProfileAfterSync, error: profileAfterSyncError } = await supabase
      .from('CoachProfile').select('hourlyRate').eq('userUlid', targetUserUlid).maybeSingle()
    if (profileAfterSyncError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Coach Profile lookup after sync', { error: profileAfterSyncError, targetUserUlid });
      return NextResponse.json({ error: 'Failed to fetch coach profile for pricing after sync' }, { status: 500 })
    }
    const hourlyRateAfterSync = coachProfileAfterSync?.hourlyRate as number || 0
    const hasValidHourlyRateAfterSync = hourlyRateAfterSync > 0
    console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Hourly Rate check for creation after sync', { hourlyRate: hourlyRateAfterSync, hasValidHourlyRate: hasValidHourlyRateAfterSync });

    // Use the new function that creates event types with unique slugs to avoid conflicts
    console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Attempting to create default event types with unique slugs');
    const result = await createDefaultEventTypesWithUniqueSlug(targetUserUlid);
    
    if (result.error) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Error creating default event types with unique slugs', {
        error: result.error,
        targetUserUlid,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: false,
        error: result.error.message || "Failed to create default event types"
      }, { status: 500 });
    }
    
    console.log('[CREATE_DEFAULT_EVENT_TYPES_SUCCESS] Successfully created default event types with unique slugs', {
      targetUserUlid,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      message: "Successfully created default event types with unique slugs"
    });

  } catch (error) {
    console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Top-level catch block', { error });
    return NextResponse.json({ error: 'Failed to create/sync default event types' }, { status: 500 })
  }
}

// Helper function to calculate event price based on hourly rate and duration
function calculateEventPrice(hourlyRate: number, durationMinutes: number): number {
  if (hourlyRate <= 0 || durationMinutes <= 0) return 0;
  const hourlyRateInCents = Math.round(hourlyRate * 100) // Work in cents
  const durationHours = durationMinutes / 60
  const priceInCents = Math.round(hourlyRateInCents * durationHours)
  // Return price in cents, as Cal.com expects
  return priceInCents 
}

// Helper function to generate a slug from a name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove invalid chars
    .replace(/--+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Trim hyphens
} 