/**
 * Cal.com Event Types API - Create Default Event Types
 * 
 * This API route creates the default event types for a coach.
 * By default, it creates two event types:
 * 1. 1:1 Q&A Coaching Call (30 minutes, paid)
 * 2. Get to Know You (15 minutes, free)
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { createAuthClient } from '@/utils/supabase/server'
import { generateUlid } from '@/utils/ulid'
import { isCalTokenExpired, refreshCalAccessToken } from '@/utils/auth/cal-token-service'
import { 
  DefaultCalEventType, 
  CalEventTypeCreatePayload, 
  CalEventTypeLocation
} from '@/utils/types/cal-event-types'
import { getCalAuthHeaders } from '@/utils/cal/cal-api-utils'

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
    metadata: {},
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
    price: 0,
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
        console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR]', {
          error: userError,
          userId,
          timestamp: new Date().toISOString()
        })
        return NextResponse.json(
          { error: 'Failed to find user in database' },
          { status: 500 }
        )
      }

      targetUserUlid = userData.ulid
    }

    console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Retrieved user ULID', {
      userUlid: targetUserUlid,
      timestamp: new Date().toISOString()
    });

    // Get calendar integration for the user
    const { data: calendarIntegration, error: calendarError } = await supabase
      .from('CalendarIntegration')
      .select(`
        ulid,
        calManagedUserId,
        calAccessToken,
        calAccessTokenExpiresAt,
        calRefreshToken,
        calUsername
      `)
      .eq('userUlid', targetUserUlid)
      .maybeSingle()

    if (calendarError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR]', {
        error: calendarError,
        userUlid: targetUserUlid,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        { error: 'Failed to fetch calendar integration' },
        { status: 500 }
      )
    }

    if (!calendarIntegration) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] No Cal.com integration found', {
        userUlid: targetUserUlid,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'No Cal.com integration found for this user' },
        { status: 400 }
      )
    }

    console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Calendar integration found', {
      userUlid: targetUserUlid,
      hasManagedUser: !!calendarIntegration.calManagedUserId,
      managedUserId: calendarIntegration.calManagedUserId,
      calUsername: calendarIntegration.calUsername,
      hasAccessToken: !!calendarIntegration.calAccessToken,
      accessTokenLength: calendarIntegration.calAccessToken?.length || 0,
      accessTokenPrefix: calendarIntegration.calAccessToken ? calendarIntegration.calAccessToken.substring(0, 5) + "..." : null,
      hasRefreshToken: !!calendarIntegration.calRefreshToken,
      timestamp: new Date().toISOString()
    });

    // Ensure we have a managed user ID, otherwise we can't create event types
    if (!calendarIntegration.calManagedUserId) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] No managed user ID found', {
        userUlid: targetUserUlid,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'No Cal.com managed user found for this user. Please reconnect Cal.com in settings.' },
        { status: 400 }
      )
    }

    // Check if token is expired and refresh if needed
    const isExpired = await isCalTokenExpired(calendarIntegration.calAccessTokenExpiresAt)
    
    console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Token expiration check', {
      userUlid: targetUserUlid,
      isExpired,
      expiresAt: calendarIntegration.calAccessTokenExpiresAt,
      timestamp: new Date().toISOString()
    });
    
    let accessToken = calendarIntegration.calAccessToken

    if (isExpired) {
      console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Cal.com token expired, attempting refresh', {
        userUlid: targetUserUlid,
        timestamp: new Date().toISOString()
      })
      
      // Request token refresh
      const refreshResult = await refreshCalAccessToken(targetUserUlid)
      
      if (!refreshResult.success || !refreshResult.tokens) {
        console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Token refresh failed', {
          error: refreshResult.error,
          userUlid: targetUserUlid,
          timestamp: new Date().toISOString()
        })
        
        return NextResponse.json(
          { error: 'Your Cal.com connection needs to be refreshed. Please reconnect in settings.' },
          { status: 401 }
        )
      }
      
      console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Token refresh request succeeded', {
        userUlid: targetUserUlid,
        returnedTokenLength: refreshResult.tokens.access_token.length,
        returnedTokenStart: refreshResult.tokens.access_token.substring(0, 5) + '...',
        timestamp: new Date().toISOString()
      })
      
      // IMPORTANT: Instead of using the token from the refresh result,
      // query the database to get the token that was actually saved
      const { data: updatedIntegration, error: updateError } = await supabase
        .from('CalendarIntegration')
        .select('calAccessToken, calManagedUserId, calAccessTokenExpiresAt')
        .eq('userUlid', targetUserUlid)
        .single();
        
      if (updateError || !updatedIntegration) {
        console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Failed to get updated token from DB', {
          error: updateError,
          userUlid: targetUserUlid,
          timestamp: new Date().toISOString()
        });
        
        return NextResponse.json(
          { error: 'Failed to retrieve updated Cal.com token from database' },
          { status: 500 }
        )
      }
      
      // Use the token from the database instead of the one returned from refresh
      accessToken = updatedIntegration.calAccessToken;
      
      console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Using token from database after refresh', {
        userUlid: targetUserUlid,
        dbTokenLength: accessToken.length,
        dbTokenStart: accessToken.substring(0, 5) + '...',
        expiresAt: updatedIntegration.calAccessTokenExpiresAt,
        timestamp: new Date().toISOString()
      });
    }

    // Test the token by making a simple call to Cal.com API
    try {
      console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Testing Cal.com access token', {
        userUlid: targetUserUlid,
        managedUserId: calendarIntegration.calManagedUserId,
        tokenPrefix: accessToken ? accessToken.substring(0, 5) + "..." : null,
        tokenLength: accessToken?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      // Test call using the standard endpoint with the managed user token
      const testResponse = await fetch('https://api.cal.com/v2/event-types', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'cal-api-version': '2024-06-14'
        }
      });

      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Test request failed', {
          status: testResponse.status,
          error: errorText,
          endpoint: 'https://api.cal.com/v2/event-types',
          userUlid: targetUserUlid,
          timestamp: new Date().toISOString()
        });
        
        // If the token test fails with 401, try a forced token refresh
        if (testResponse.status === 401 || testResponse.status === 403) {
          console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Forcing token refresh after test failure', {
            userUlid: targetUserUlid,
            timestamp: new Date().toISOString()
          });
          
          // Use an absolute URL for the refresh token endpoint
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dibs.coach';
          const forceRefreshResponse = await fetch(`${baseUrl}/api/cal/refresh-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              userUlid: targetUserUlid,
              force: true 
            })
          });
          
          if (!forceRefreshResponse.ok) {
            console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Force refresh failed', {
              status: forceRefreshResponse.status,
              userUlid: targetUserUlid,
              timestamp: new Date().toISOString()
            });
          } else {
            const refreshData = await forceRefreshResponse.json();
            console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Force refresh result', {
              success: refreshData.success,
              userUlid: targetUserUlid,
              timestamp: new Date().toISOString()
            });
            
            // IMPORTANT: Don't use the token from the API response
            // Instead, query the database directly to get the most recently saved token
            const { data: latestIntegration, error: latestError } = await supabase
              .from('CalendarIntegration')
              .select('calAccessToken, calAccessTokenExpiresAt')
              .eq('userUlid', targetUserUlid)
              .single();
              
            if (!latestError && latestIntegration && latestIntegration.calAccessToken) {
              // Use the token from the database
              accessToken = latestIntegration.calAccessToken;
              console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Using latest token from DB after force refresh', {
                userUlid: targetUserUlid,
                tokenLength: accessToken.length,
                tokenStart: accessToken.substring(0, 5) + '...',
                expiresAt: latestIntegration.calAccessTokenExpiresAt,
                timestamp: new Date().toISOString()
              });
            } else {
              console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Failed to get latest token after force refresh', {
                error: latestError,
                userUlid: targetUserUlid,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      } else {
        const testData = await testResponse.json();
        console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Test request succeeded', {
          userUlid: targetUserUlid,
          eventTypesCount: testData?.data?.length || 0,
          timestamp: new Date().toISOString()
        });
      }
    } catch (testError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Error testing token', {
        error: testError,
        userUlid: targetUserUlid,
        timestamp: new Date().toISOString()
      });
    }

    // Get coach's hourly rate for paid events
    const { data: coachProfile, error: profileError } = await supabase
      .from('CoachProfile')
      .select('hourlyRate')
      .eq('userUlid', targetUserUlid)
      .maybeSingle()

    if (profileError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR]', {
        error: profileError,
        userUlid: targetUserUlid,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        { error: 'Failed to fetch coach profile for pricing' },
        { status: 500 }
      )
    }

    const hourlyRate = coachProfile?.hourlyRate as number || 0
    const hasValidHourlyRate = hourlyRate !== null && hourlyRate !== undefined && hourlyRate > 0

    // Define default event types with exact required structure
    const defaultEventTypes: DefaultCalEventType[] = [
      {
        name: '1:1 Q&A Coaching Call',
        title: '1:1 Q&A Coaching Call',
        slug: 'coaching-qa-30',
        description: 'A focused 30-minute 1-on-1 coaching session to ask questions and get personalized guidance.',
        duration: 30,
        lengthInMinutes: 30,
        isFree: false,
        isActive: true,
        isDefault: true,
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
        name: 'Get to Know You',
        title: 'Get to Know You',
        slug: 'get-to-know-you-15',
        description: '15-minute goal setting and introduction session',
        duration: 15,
        lengthInMinutes: 15,
        isFree: true,
        isActive: true,
        isDefault: true,
        scheduling: 'MANAGED',
        position: 1,
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
    ]

    // Check if these event types already exist
    const { data: existingEventTypes, error: eventTypesError } = await supabase
      .from('CalEventType')
      .select('name, isDefault')
      .eq('calendarIntegrationUlid', calendarIntegration.ulid)
      .eq('isDefault', true)

    if (eventTypesError) {
      console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR]', {
        error: eventTypesError,
        userUlid: targetUserUlid,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        { error: 'Failed to check existing event types' },
        { status: 500 }
      )
    }

    const existingEventTypeNames = existingEventTypes.map(et => et.name)
    const createdEventTypes = []

    for (const eventType of defaultEventTypes) {
      // Skip if this default type already exists
      if (existingEventTypeNames.includes(eventType.name)) {
        console.log(`[CREATE_DEFAULT_EVENT_TYPES_INFO] Event type "${eventType.name}" already exists, skipping creation`)
        continue
      }

      // Skip creating paid default event if rate is invalid
      if (eventType.isFree === false && !hasValidHourlyRate) {
        console.warn('[CREATE_DEFAULT_EVENT_TYPES_SKIP] Skipping paid default event due to missing/invalid hourly rate.', {
          userUlid: targetUserUlid,
          eventName: eventType.name,
          hourlyRate
        })
        continue
      }

      // Validate token before making request
      if (!accessToken || accessToken.trim() === '') {
        console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR] Invalid access token', {
          userUlid: targetUserUlid,
          hasToken: !!accessToken,
          tokenLength: accessToken ? accessToken.length : 0,
          timestamp: new Date().toISOString()
        })
        continue // Skip this event type
      }

      // Log the request being made (without sensitive data)
      console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Making Cal.com API request', {
        userUlid: targetUserUlid,
        eventName: eventType.name,
        hasToken: !!accessToken,
        timestamp: new Date().toISOString()
      })

      // Create in Cal.com
      let calEventType = null
      if (calendarIntegration.calManagedUserId) {
        try {
          // Construct the payload using the helper function
          const eventTypePayload = constructCalEventTypePayload(eventType);

          // Log the full payload for debugging
          console.log('[CREATE_DEFAULT_EVENT_TYPES_INFO] Sending payload to Cal.com', {
            userUlid: targetUserUlid,
            eventName: eventType.name,
            managedUserId: calendarIntegration.calManagedUserId,
            hasToken: !!accessToken,
            tokenLength: accessToken?.length || 0,
            tokenPrefix: accessToken ? accessToken.substring(0, 5) + "..." : null,
            timestamp: new Date().toISOString(),
            payloadSummary: {
              title: eventTypePayload.title,
              slug: eventTypePayload.slug,
              lengthInMinutes: eventTypePayload.lengthInMinutes
            }
          });

          // Make request to Cal.com API
          const response = await fetch('https://api.cal.com/v2/event-types', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'cal-api-version': '2024-06-14'
            },
            body: JSON.stringify(eventTypePayload)
          });

          // More detailed error logging but with a simpler approach to headers
          if (!response.ok) {
            const errorText = await response.text();
            const errorStatus = response.status;
            console.error('[CREATE_DEFAULT_EVENT_TYPES_CAL_ERROR] Cal.com API error', {
              status: errorStatus,
              error: errorText,
              eventName: eventType.name,
              userUlid: targetUserUlid,
              responseType: response.type,
              responseUrl: response.url,
              timestamp: new Date().toISOString()
            });
            
            // More specific error message based on status code
            let errorMessage = 'Unknown error occurred';
            if (errorStatus === 401) {
              errorMessage = 'Unauthorized: Invalid or expired access token';
            } else if (errorStatus === 403) {
              errorMessage = 'Forbidden: Insufficient permissions to create event types';
            } else if (errorStatus === 400) {
              errorMessage = `Bad request: ${errorText}`;
            } else {
              errorMessage = `Cal.com API error (${errorStatus}): ${errorText}`;
            }
            
            console.error(`[CREATE_DEFAULT_EVENT_TYPES_CAL_ERROR] ${errorMessage}`);
            continue; // Skip DB insert if Cal.com creation failed
          }

          // Parse successful response
          calEventType = await response.json();
          console.log('[CREATE_DEFAULT_EVENT_TYPES_CAL_SUCCESS]', {
            userUlid: targetUserUlid,
            eventName: eventType.name,
            calEventTypeId: calEventType?.data?.id,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('[CREATE_DEFAULT_EVENT_TYPES_CAL_ERROR]', {
            error,
            eventName: eventType.name,
            userUlid: targetUserUlid,
            timestamp: new Date().toISOString()
          });
          continue; // Skip DB insert if Cal.com creation failed
        }
      }

      // Create in database ONLY if Cal.com succeeded (or wasn't applicable)
      if (!calendarIntegration.calManagedUserId || calEventType) {
        const eventTypeUlid = generateUlid()
        const { data: dbEventType, error: insertError } = await supabase
          .from('CalEventType')
          .insert({
            ulid: eventTypeUlid,
            calendarIntegrationUlid: calendarIntegration.ulid,
            calEventTypeId: calEventType?.id || null,
            name: eventType.name,
            description: eventType.description,
            duration: eventType.duration,
            isFree: eventType.isFree,
            isActive: eventType.isActive,
            isDefault: eventType.isDefault,
            slug: calEventType?.slug || eventType.slug,
            position: eventType.position,
            scheduling: eventType.scheduling as 'MANAGED' | 'OFFICE_HOURS' | 'GROUP_SESSION',
            maxParticipants: eventType.seats?.seatsPerTimeSlot || null,
            discountPercentage: null,
            organizationUlid: null,
            locations: eventType.locations as any,
            bookerLayouts: {
              defaultLayout: "month",
              enabledLayouts: ["month", "week", "column"]
            },
            customName: eventType.customName,
            color: eventType.color as any,
            minimumBookingNotice: eventType.minimumBookingNotice,
            disableGuests: eventType.disableGuests, 
            useDestinationCalendarEmail: eventType.useDestinationCalendarEmail,
            hideCalendarEventDetails: eventType.hideCalendarEventDetails,
            slotInterval: eventType.slotInterval,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as any)
          .select()
          .single()

        if (insertError) {
          console.error('[CREATE_DEFAULT_EVENT_TYPES_DB_ERROR]', {
            error: insertError,
            eventName: eventType.name,
            userUlid: targetUserUlid,
            timestamp: new Date().toISOString()
          })
          continue
        }

        createdEventTypes.push(dbEventType)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        createdEventTypes,
        totalCreated: createdEventTypes.length
      }
    })
  } catch (error) {
    console.error('[CREATE_DEFAULT_EVENT_TYPES_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { error: 'Failed to create default event types' },
      { status: 500 }
    )
  }
}

// Helper function to calculate event price based on hourly rate and duration
function calculateEventPrice(hourlyRate: number, durationMinutes: number): number {
  const hourlyRateInCents = Math.round(hourlyRate * 100)
  const durationHours = durationMinutes / 60
  const priceInCents = Math.round(hourlyRateInCents * durationHours)
  return priceInCents
}

// Helper function to generate a slug from a name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
} 