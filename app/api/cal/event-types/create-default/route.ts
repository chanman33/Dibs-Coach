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
import { getCalAuthHeaders } from '@/utils/cal/cal-api-utils'
import { Database } from '@/types/supabase' // Import Database type

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
    locations: eventType.locations,
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
    team: null,
    bookerLayouts: {
      enabledLayouts: ["month", "week", "column"],
      defaultLayout: "month"
    }
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
    const makeFetchRequest = (token: string) => fetch(`https://api.cal.com/v2/event-types?username=${encodeURIComponent(calendarIntegration.calUsername)}`, {
        method: 'GET',
        headers: { ...getCalAuthHeaders(token), 'cal-api-version': '2024-08-13' }
    });
    const fetchResponse = await handleCalApiResponse(await makeFetchRequest(currentAccessToken), makeFetchRequest, targetUserUlid);
    
    // Update token if refresh occurred during fetch
    const latestFetchTokenResult = await ensureValidCalToken(targetUserUlid);
    if (latestFetchTokenResult.success && latestFetchTokenResult.tokenInfo?.accessToken) {
        currentAccessToken = latestFetchTokenResult.tokenInfo.accessToken;
    }

    if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Failed to fetch from Cal.com', { status: fetchResponse.status, errorText, targetUserUlid });
        return NextResponse.json({ error: `Failed to fetch event types from Cal.com: ${fetchResponse.status}` }, { status: fetchResponse.status });
    }
    const calApiResponse = await fetchResponse.json();
    const calEventTypesFromApi = calApiResponse.data || [];
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

    // Proceed with the rest of the function to create default event types in Cal.com if needed
    // Define the standard default event types we want to ensure exist
    const standardDefaultEventTypes: DefaultCalEventType[] = [
      {
        name: '1:1 Q&A Coaching Call',
        title: '1:1 Q&A Coaching Call',
        slug: 'coaching-qa-30',
        description: 'A focused 30-minute 1-on-1 coaching session to ask questions and get personalized guidance.',
        lengthInMinutes: 30,
        isFree: false, // This is a paid session
        isActive: true, // Always active
        isDefault: true,
        isRequired: true, // Cannot be disabled by the user
        scheduling: 'MANAGED',
        position: 0,
        disableGuests: true,
        slotInterval: 30,
        minimumBookingNotice: 60,
        useDestinationCalendarEmail: true,
        hideCalendarEventDetails: false,
        customName: "Dibs: Q&A between {Organiser} and {Scheduler}",
        confirmationPolicy: {
          disabled: true
        },
        color: {
          lightThemeHex: "#3B82F6",
          darkThemeHex: "#60A5FA"
        },
        seats: {
          seatsPerTimeSlot: 1,
          showAttendeeInfo: false,
          showAvailabilityCount: false
        },
        locations: [
          {
            type: "link",
            link: "https://dibs.coach/call/session-abc123",
            public: true
          }
        ]
      },
      {
        name: '1:1 Deep Dive Coaching Call',
        title: '1:1 Deep Dive Coaching Call',
        slug: 'coaching-deep-dive-60',
        description: 'A comprehensive 60-minute 1-on-1 coaching session for deeper exploration and problem-solving.',
        lengthInMinutes: 60,
        isFree: false, // This is a paid session
        isActive: true, // Always active
        isDefault: true,
        isRequired: true, // Cannot be disabled by the user
        scheduling: 'MANAGED',
        position: 1,
        disableGuests: true,
        slotInterval: 60,
        minimumBookingNotice: 60,
        useDestinationCalendarEmail: true,
        hideCalendarEventDetails: false,
        customName: "Dibs: Deep Dive between {Organiser} and {Scheduler}",
        confirmationPolicy: {
          disabled: true
        },
        color: {
          lightThemeHex: "#8B5CF6",
          darkThemeHex: "#A78BFA"
        },
        seats: {
          seatsPerTimeSlot: 1,
          showAttendeeInfo: false,
          showAvailabilityCount: false
        },
        locations: [
          {
            type: "link",
            link: "https://dibs.coach/call/deep-dive-abc123",
            public: true
          }
        ]
      },
      {
        name: 'Get to Know You',
        title: 'Get to Know You',
        slug: 'get-to-know-you-15',
        description: '15-minute goal setting and introduction session',
        lengthInMinutes: 15,
        isFree: true, // This is the only free session
        isActive: true, // Initially active but can be toggled
        isDefault: true,
        isRequired: false, // Can be disabled by the user
        scheduling: 'MANAGED',
        position: 2,
        disableGuests: true,
        slotInterval: 15,
        minimumBookingNotice: 60,
        useDestinationCalendarEmail: true,
        hideCalendarEventDetails: false,
        customName: "Dibs: Introduction between {Organiser} and {Scheduler}",
        confirmationPolicy: {
          disabled: true
        },
        color: {
          lightThemeHex: "#10B981",
          darkThemeHex: "#34D399"
        },
        seats: {
          seatsPerTimeSlot: 1,
          showAttendeeInfo: false,
          showAvailabilityCount: false
        },
        locations: [
          {
            type: "link",
            link: "https://dibs.coach/call/intro-abc123",
            public: true
          }
        ]
      }
    ];

    const createdEventTypes = []
    let creationAttempted = false;

    // 5. Loop through standard defaults and create if missing locally
    // Get local event type names from previous step, if not set, create an empty array to avoid errors
    const localDefaultEventTypeNames = localEventTypesAfterSync ? 
      localEventTypesAfterSync.map((et: { name: string }) => et.name) : [];
      
    for (const eventType of standardDefaultEventTypes) {
      if (!localDefaultEventTypeNames.includes(eventType.name)) {
        creationAttempted = true;
        console.log(`[CREATE_DEFAULT_EVENT_TYPES_INFO] Default type "${eventType.name}" missing locally, attempting creation...`);

        // For non-required event types, skip paid ones if rate is invalid
        // For required event types, always create them (will use price=0 if no hourly rate)
        if (!eventType.isRequired && eventType.isFree === false && !hasValidHourlyRateAfterSync) {
          console.warn('[CREATE_DEFAULT_EVENT_TYPES_SKIP] Skipping non-required paid default due to invalid hourly rate.', { targetUserUlid, eventName: eventType.name, hourlyRate: hourlyRateAfterSync });
          continue
        }

        let calEventType = null;
        try {
            // Define the function to make the Cal.com CREATE request
            const makeCreateRequest = async (token: string) => {
                const eventTypePayload = constructCalEventTypePayload(eventType);
                
                // Set price appropriately:
                // - Free event types: always price=0
                // - Paid event types with valid hourly rate: calculate based on rate
                // - Required paid event types with no valid rate: price=0 (we'll update later when rate is set)
                if (eventType.isFree) {
                    eventTypePayload.price = 0;
                } else if (hasValidHourlyRateAfterSync) {
                    eventTypePayload.price = calculateEventPrice(hourlyRateAfterSync, eventType.lengthInMinutes);
                } else if (eventType.isRequired) {
                    // For required event types with no rate, create with price=0 and update later
                    eventTypePayload.price = 0;
                    console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Creating required event type with temporary price=0', { 
                      eventName: eventType.name, 
                      hourlyRate: hourlyRateAfterSync 
                    });
                }
                
                console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Sending CREATE payload to Cal.com', { targetUserUlid, eventName: eventType.name, payloadSummary: { title: eventTypePayload.title, slug: eventTypePayload.slug, length: eventTypePayload.lengthInMinutes, price: eventTypePayload.price } });
                
                return fetch('https://api.cal.com/v2/event-types', {
                    method: 'POST',
                    headers: { ...getCalAuthHeaders(token), 'cal-api-version': '2024-06-14' },
                    body: JSON.stringify(eventTypePayload)
                });
            };

            // Make the initial create request
            const initialResponse = await makeCreateRequest(currentAccessToken);
            const finalResponse = await handleCalApiResponse(initialResponse, makeCreateRequest, targetUserUlid);
            
             // Update token if refresh occurred during create attempt
            const latestCreateTokenResult = await ensureValidCalToken(targetUserUlid);
            if (latestCreateTokenResult.success && latestCreateTokenResult.tokenInfo?.accessToken) {
                currentAccessToken = latestCreateTokenResult.tokenInfo.accessToken;
            }

            if (!finalResponse.ok) {
                const errorText = await finalResponse.text();
                 console.error('[CREATE_DEFAULT_EVENT_TYPES_CAL_ERROR] Cal.com CREATE error', { status: finalResponse.status, error: errorText, eventName: eventType.name, targetUserUlid });
                continue; // Skip DB insert if Cal.com creation failed
            }

            calEventType = await finalResponse.json();
            console.log('[CREATE_DEFAULT_EVENT_TYPES_CAL_SUCCESS]', { targetUserUlid, eventName: eventType.name, calEventTypeId: calEventType?.data?.id }); // Adjust parsing based on actual Cal.com response

        } catch (error) {
            console.error('[CREATE_DEFAULT_EVENT_TYPES_CAL_ERROR] Catch block during create', { error, eventName: eventType.name, targetUserUlid });
            continue; // Skip DB insert on caught error
        }

        // Create in database ONLY if Cal.com succeeded
        // Adjust based on actual response structure from Cal.com v2
        const createdCalId = calEventType?.data?.id;
        if (createdCalId) {
          const eventTypeUlid = generateUlid()
          
          // If this is a required event type, always set isActive to true
          // We never allow required event types to be inactive
          const isRequired = eventType.isRequired === true;
          const isActive = isRequired ? true : eventType.isActive;
          
          // Prepare metadata with isRequired flag if needed
          const metadata = {
            ...(calEventType?.data?.metadata || {}),
            isRequired: isRequired,
          };
          
          const { data: dbEventType, error: insertError } = await supabase
            .from('CalEventType')
            .insert({
              ulid: eventTypeUlid,
              calendarIntegrationUlid: calendarIntegration.ulid,
              calEventTypeId: createdCalId,
              name: eventType.name,
              description: eventType.description,
              lengthInMinutes: eventType.lengthInMinutes,
              isFree: eventType.isFree,
              isActive: isActive, // Uses determined active status
              isDefault: eventType.isDefault,
              slug: calEventType?.data?.slug || eventType.slug,
              position: eventType.position,
              scheduling: eventType.scheduling as 'MANAGED' | 'OFFICE_HOURS' | 'GROUP_SESSION',
              maxParticipants: eventType.seats?.seatsPerTimeSlot || null,
              price: calEventType?.data?.price || (eventType.isFree ? 0 : calculateEventPrice(hourlyRateAfterSync, eventType.lengthInMinutes)),
              currency: calEventType?.data?.currency || 'USD',
              discountPercentage: null,
              organizationUlid: null,
              locations: eventType.locations as any,
              bookerLayouts: { defaultLayout: "month", enabledLayouts: ["month", "week", "column"] },
              customName: eventType.customName,
              color: eventType.color as any,
              minimumBookingNotice: eventType.minimumBookingNotice,
              disableGuests: eventType.disableGuests,
              useDestinationCalendarEmail: eventType.useDestinationCalendarEmail,
              hideCalendarEventDetails: eventType.hideCalendarEventDetails,
              slotInterval: eventType.slotInterval,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              // Ensure all other fields from schema have values
              hidden: !isActive, // Hidden is the opposite of active
              bookingLimits: null,
              requiresConfirmation: false,
              metadata: metadata, // Use the updated metadata with isRequired flag
              afterEventBuffer: eventType.afterEventBuffer || 0,
              beforeEventBuffer: eventType.beforeEventBuffer || 0,
              successRedirectUrl: null,
            } as DbCalEventType)
            .select()
            .single()

          if (insertError) {
            console.error('[CREATE_DEFAULT_EVENT_TYPES_DB_ERROR] Insert failed', { error: insertError, eventName: eventType.name, targetUserUlid });
            // Consider rollback? Deleting from Cal.com?
          } else {
            createdEventTypes.push(dbEventType)
            console.log('[CREATE_DEFAULT_EVENT_TYPES_DB_SUCCESS]', { dbEventTypeUlid: dbEventType.ulid, calEventTypeId: dbEventType.calEventTypeId });
          }
        } else {
             console.warn('[CREATE_DEFAULT_EVENT_TYPES_SKIP_DB] Skipping DB insert because Cal.com creation did not return a valid event type ID.', { eventName: eventType.name, targetUserUlid, calResponse: calEventType });
        }
      } else {
        console.log(`[CREATE_DEFAULT_EVENT_TYPES_INFO] Default type "${eventType.name}" already exists locally. Skipping creation.`);
      }
    } // End loop through standardDefaultEventTypes

    console.log('[CREATE_DEFAULT_EVENT_TYPES] Finished processing default event types', { totalCreated: createdEventTypes.length });
    return NextResponse.json({ 
      success: true, 
      data: { 
        message: creationAttempted ? `Created ${createdEventTypes.length} missing default event types.` : 'Default event types already exist.',
        createdEventTypes: createdEventTypes, // Only includes newly created ones
        totalCreated: createdEventTypes.length 
      }
    })

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