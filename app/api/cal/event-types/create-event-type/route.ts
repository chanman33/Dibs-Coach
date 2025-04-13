/**
 * Cal.com Event Types API - Create Event Type
 * 
 * This API route creates an event type for a managed user (coach) using Cal.com's API v2.
 * The event type will be stored in both Cal.com and our local database.
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { createAuthClient } from '@/utils/supabase/server'
import { generateUlid } from '@/utils/ulid'
import { isCalTokenExpired, refreshCalAccessToken } from '@/utils/auth/cal-token-service'

export async function POST(request: Request) {
  try {
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
    
    // Extract required fields from request body
    const {
      name,
      description,
      duration,
      isFree,
      isActive = true,
      schedulingType = 'MANAGED',
      maxParticipants,
      discountPercentage,
      userUlid // Optional: If admin is creating for a specific user
    } = requestBody

    // Validation
    if (!name || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: name and duration are required' },
        { status: 400 }
      )
    }

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
        console.error('[CREATE_EVENT_TYPE_ERROR]', {
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

    // Get calendar integration for the user
    const { data: calendarIntegration, error: calendarError } = await supabase
      .from('CalendarIntegration')
      .select(`
        ulid,
        calManagedUserId,
        calAccessToken,
        calAccessTokenExpiresAt,
        calRefreshToken
      `)
      .eq('userUlid', targetUserUlid)
      .maybeSingle()

    if (calendarError) {
      console.error('[CREATE_EVENT_TYPE_ERROR]', {
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
      return NextResponse.json(
        { error: 'No Cal.com integration found for this user' },
        { status: 400 }
      )
    }

    // Get coach's hourly rate if needed for paid events
    let hourlyRate = 0
    if (!isFree) {
      const { data: coachProfile, error: profileError } = await supabase
        .from('CoachProfile')
        .select('hourlyRate')
        .eq('userUlid', targetUserUlid)
        .maybeSingle()

      if (profileError) {
        console.error('[CREATE_EVENT_TYPE_ERROR]', {
          error: profileError,
          userUlid: targetUserUlid,
          timestamp: new Date().toISOString()
        })
        return NextResponse.json(
          { error: 'Failed to fetch coach profile for pricing' },
          { status: 500 }
        )
      }

      hourlyRate = coachProfile?.hourlyRate as number || 0
      
      if (!hourlyRate || hourlyRate <= 0) {
        return NextResponse.json(
          { error: 'Coach must set an hourly rate before creating paid event types' },
          { status: 400 }
        )
      }
    }

    // Check if token is expired and refresh if needed
    const isExpired = await isCalTokenExpired(calendarIntegration.calAccessTokenExpiresAt)
    let accessToken = calendarIntegration.calAccessToken

    if (isExpired) {
      console.log('[CREATE_EVENT_TYPE_INFO] Cal.com token expired, attempting refresh', {
        userUlid: targetUserUlid,
        timestamp: new Date().toISOString()
      })
      
      const refreshResult = await refreshCalAccessToken(targetUserUlid)
      
      if (!refreshResult.success || !refreshResult.tokens) {
        console.error('[CREATE_EVENT_TYPE_ERROR] Token refresh failed', {
          error: refreshResult.error,
          userUlid: targetUserUlid,
          timestamp: new Date().toISOString()
        })
        
        return NextResponse.json(
          { error: 'Your Cal.com connection needs to be refreshed. Please reconnect in settings.' },
          { status: 401 }
        )
      }
      
      accessToken = refreshResult.tokens.access_token
    }

    // Calculate price for paid events
    const price = isFree ? 0 : calculateEventPrice(hourlyRate, duration)

    // Create event type in Cal.com
    let calEventType = null
    if (calendarIntegration.calManagedUserId) {
      try {
        // Build metadata based on scheduling type
        let metadata: Record<string, any> = {}
        
        if (schedulingType === 'OFFICE_HOURS' && discountPercentage) {
          metadata = {
            ...metadata,
            discountPercentage: discountPercentage || 0,
            isOfficeHours: true
          }
        } else if (schedulingType === 'GROUP_SESSION') {
          metadata = {
            ...metadata,
            isGroupSession: true
          }
        }

        // Format data according to Cal.com v2 API docs
        const eventTypePayload = {
          title: name,
          slug: generateSlug(name),
          description: description || '',
          lengthInMinutes: duration,
          hidden: !isActive,
          price,
          metadata, // Add metadata field
          // Required booker layout configuration
          bookerLayouts: {
            defaultLayout: "month",
            enabledLayouts: ["month", "week", "column"]
          },
          // Required locations
          locations: [
            {
              type: "integrations:daily",
              displayName: "Video Call"
            }
          ],
          // Minimum booking notice in minutes
          minimumBookingNotice: 0,
          // Time buffers between meetings
          beforeEventBuffer: 0,
          afterEventBuffer: 0,
          // Scheduling type
          schedulingType: schedulingType === 'MANAGED' ? null : schedulingType.toLowerCase(),
          // Seats configuration if needed
          seats: maxParticipants ? {
            seatsPerTimeSlot: maxParticipants,
            showAttendeeInfo: true,
            showAvailabilityCount: true
          } : undefined
        }

        // Make request to Cal.com API
        const response = await fetch('https://api.cal.com/v2/event-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'cal-api-version': '2024-06-14'
          },
          body: JSON.stringify(eventTypePayload)
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('[CREATE_EVENT_TYPE_CAL_ERROR]', {
            status: response.status,
            error: errorText,
            userUlid: targetUserUlid,
            timestamp: new Date().toISOString()
          })

          return NextResponse.json(
            { error: `Failed to create Cal.com event type: ${errorText}` },
            { status: response.status }
          )
        }

        calEventType = await response.json()
      } catch (error) {
        console.error('[CREATE_EVENT_TYPE_CAL_ERROR]', {
          error,
          userUlid: targetUserUlid,
          timestamp: new Date().toISOString()
        })
        
        return NextResponse.json(
          { error: 'Failed to create Cal.com event type' },
          { status: 500 }
        )
      }
    }

    // Create event type in our database
    const eventTypeUlid = generateUlid()
    
    const { data: dbEventType, error: insertError } = await supabase
      .from('CalEventType')
      .insert({
        ulid: eventTypeUlid,
        calendarIntegrationUlid: calendarIntegration.ulid,
        calEventTypeId: calEventType?.id || null,
        name,
        description: description || '',
        lengthInMinutes: duration,
        isFree,
        isActive,
        isDefault: false, // Custom event types are not default ones
        slug: calEventType?.slug || generateSlug(name),
        position: 0, // Will need to be updated based on existing events
        scheduling: schedulingType as 'MANAGED' | 'OFFICE_HOURS' | 'GROUP_SESSION',
        maxParticipants: maxParticipants || null,
        discountPercentage: discountPercentage || null,
        organizationUlid: null,
        locations: [{ type: 'integrations:daily', displayName: 'Video Call' }],
        bookerLayouts: { defaultLayout: 'month', enabledLayouts: ['month', 'week', 'column'] },
        beforeEventBuffer: 0,
        afterEventBuffer: 0,
        minimumBookingNotice: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('[CREATE_EVENT_TYPE_DB_ERROR]', {
        error: insertError,
        userUlid: targetUserUlid,
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.json(
        { error: 'Failed to save event type to database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        eventType: dbEventType,
        calEventType
      }
    })
  } catch (error) {
    console.error('[CREATE_EVENT_TYPE_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { error: 'Failed to create event type' },
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
