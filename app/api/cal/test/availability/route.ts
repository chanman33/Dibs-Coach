/**
 * Cal.com Regular User Schedules API
 * 
 * This API route interacts with Cal.com's /v2/schedules endpoints for regular user schedules.
 * It does NOT use organization endpoints (/v2/organizations/{orgId}/users/{userId}/schedules).
 * 
 * Endpoints implemented:
 * - GET: Fetches all schedules using Cal.com's GET /v2/schedules
 * - POST: Creates a default schedule using Cal.com's POST /v2/schedules
 * - DELETE: Deletes a schedule by ID using Cal.com's DELETE /v2/schedules/{id}
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { createAuthClient } from '@/utils/auth'
import { refreshCalAccessToken, isCalTokenExpired } from '@/utils/auth/cal-token-service'
import { generateUlid } from '@/utils/ulid'
import { 
  CalSchedule, 
  CoachingSchedule, 
  SCHEDULE_SYNC_SOURCE
} from '@/utils/types/schedule'
import { 
  mapCalScheduleToDbSchedule,
  mapDbScheduleToCalPayload,
  prepareScheduleForDb,
  updateScheduleSyncStatus 
} from '@/utils/mapping/schedule-mapper'

// Type for Cal.com API responses
interface CalApiResponse<T> {
  status: string;
  data: T;
  error?: any;
}

// Function to make authenticated Cal.com API calls with token refresh
async function makeCalRequest(url: string, options: RequestInit, integration: any, userUlid: string) {
  try {
    // Check if token is expired or will expire soon
    const isExpired = await isCalTokenExpired(integration.calAccessTokenExpiresAt);
    
    let accessToken = integration.calAccessToken;
    
    if (isExpired) {
      console.log('[CAL_API_REQUEST]', {
        step: 'Token expired or expiring soon, refreshing',
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      const result = await refreshCalAccessToken(userUlid);
      if (!result.success || !result.tokens?.access_token) {
        throw new Error(result.error || 'Failed to refresh token');
      }
      accessToken = result.tokens.access_token;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-01-01'
      }
    });

    const data = await response.json();

    if (!response.ok && (response.status === 498 || response.status === 401)) {
      // Token expired during request, try one more time with fresh token
      console.log('[CAL_API_REQUEST]', {
        step: 'Token expired during request, refreshing and retrying',
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      const result = await refreshCalAccessToken(userUlid);
      if (!result.success || !result.tokens?.access_token) {
        throw new Error(result.error || 'Failed to refresh token');
      }

      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${result.tokens.access_token}`,
          'Content-Type': 'application/json',
          'cal-api-version': '2024-01-01'
        }
      });

      return {
        ok: retryResponse.ok,
        status: retryResponse.status,
        data: await retryResponse.json()
      };
    }

    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    console.error('[CAL_API_REQUEST_ERROR]', {
      error,
      url,
      userUlid,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      console.error('[CAL_AVAILABILITY_GET]', {
        error: 'Unauthorized request',
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[CAL_AVAILABILITY_GET]', {
      userId,
      timestamp: new Date().toISOString(),
      step: 'Starting availability fetch'
    })

    const supabase = createAuthClient()
    
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()
    
    if (userError || !user?.ulid) {
      console.error('[CAL_AVAILABILITY_GET]', {
        context: 'USER_LOOKUP',
        error: userError || 'User not found',
        userId,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('[CAL_AVAILABILITY_GET]', {
      userUlid: user.ulid,
      timestamp: new Date().toISOString(),
      step: 'Found user, fetching Cal.com integration'
    })
    
    const { data: integration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('*')
      .eq('userUlid', user.ulid)
      .eq('provider', 'CAL')
      .single()
    
    if (integrationError || !integration) {
      console.error('[CAL_AVAILABILITY_GET]', {
        context: 'INTEGRATION_LOOKUP',
        error: integrationError || 'Integration not found',
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Cal.com integration not found' }, { status: 404 })
    }

    console.log('[CAL_AVAILABILITY_GET]', {
      integrationId: integration.ulid,
      timestamp: new Date().toISOString(),
      step: 'Found integration, fetching schedules from Cal.com regular user API'
    })

    const { ok, status, data: responseData } = await makeCalRequest(
      'https://api.cal.com/v2/schedules',
      { method: 'GET' },
      integration,
      user.ulid
    )

    if (!ok) {
      console.error('[CAL_AVAILABILITY_GET]', {
        context: 'CAL_API_ERROR',
        status,
        error: responseData,
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        error: 'Failed to fetch schedules from Cal.com',
        details: responseData
      }, { status })
    }

    // Log the full response for debugging
    console.log('[CAL_AVAILABILITY_GET]', {
      status,
      response: responseData,
      timestamp: new Date().toISOString(),
      step: 'Raw response from Cal.com'
    })

    // Extract schedules from the response data structure
    const schedules = responseData?.data || [];

    // Create a mapped database schedule if we don't already have one
    if (schedules.length > 0) {
      // First check if this schedule already exists in our DB
      const { data: existingSchedule, error: scheduleError } = await supabase
        .from('CoachingAvailabilitySchedule')
        .select('*')
        .eq('calScheduleId', schedules[0].id)
        .maybeSingle()

      if (!existingSchedule && !scheduleError) {
        // Create a new schedule in our DB
        const newSchedule = mapCalScheduleToDbSchedule(
          schedules[0], 
          user.ulid
        );
        
        // Prepare the schedule for database insertion
        const scheduleForDb = prepareScheduleForDb(newSchedule);
        
        // Insert into database
        const { error: insertError } = await supabase
          .from('CoachingAvailabilitySchedule')
          .insert(scheduleForDb)
        
        if (insertError) {
          console.error('[CAL_AVAILABILITY_GET]', {
            context: 'SCHEDULE_INSERT_ERROR',
            error: insertError,
            timestamp: new Date().toISOString()
          })
        } else {
          console.log('[CAL_AVAILABILITY_GET]', {
            step: 'Inserted new schedule from Cal.com into local DB',
            calScheduleId: schedules[0].id,
            timestamp: new Date().toISOString()
          })
        }
      }
    }

    console.log('[CAL_AVAILABILITY_GET]', {
      status,
      schedulesCount: schedules.length,
      timestamp: new Date().toISOString(),
      step: 'Successfully fetched schedules'
    })

    // Return success response with all schedules
    return NextResponse.json({
      status: 'success',
      data: schedules
    });

  } catch (error) {
    console.error('[CAL_AVAILABILITY_GET]', {
      context: 'UNEXPECTED_ERROR',
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      console.error('[CAL_AVAILABILITY_POST]', {
        error: 'Unauthorized request',
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[CAL_AVAILABILITY_POST]', {
      userId,
      timestamp: new Date().toISOString(),
      step: 'Starting schedule creation'
    })

    const supabase = createAuthClient()
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()

    if (userError || !user?.ulid) {
      console.error('[CAL_AVAILABILITY_POST]', {
        context: 'USER_LOOKUP',
        error: userError || 'User not found',
        userId,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('[CAL_AVAILABILITY_POST]', {
      userUlid: user.ulid,
      timestamp: new Date().toISOString(),
      step: 'Found user, fetching Cal.com integration'
    })

    const { data: integration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('*')
      .eq('userUlid', user.ulid)
      .eq('provider', 'CAL')
      .single()

    if (integrationError || !integration) {
      console.error('[CAL_AVAILABILITY_POST]', {
        context: 'INTEGRATION_LOOKUP',
        error: integrationError || 'Integration not found',
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Cal.com integration not found' }, { status: 404 })
    }

    // Default schedule data for Cal.com API
    const defaultScheduleData = {
      name: 'Default Schedule',
      timeZone: 'America/Denver',
      availability: [
        {
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          startTime: '09:00',
          endTime: '17:00'
        }
      ],
      isDefault: true,
      overrides: []
    };

    console.log('[CAL_AVAILABILITY_POST]', {
      integrationId: integration.ulid,
      payload: defaultScheduleData,
      timestamp: new Date().toISOString(),
      step: 'Creating schedule in Cal.com'
    })

    // Create a schedule in Cal.com
    const { ok, status, data: responseData } = await makeCalRequest(
      'https://api.cal.com/v2/schedules',
      { 
        method: 'POST',
        body: JSON.stringify(defaultScheduleData)
      },
      integration,
      user.ulid
    )

    if (!ok) {
      console.error('[CAL_AVAILABILITY_POST]', {
        context: 'CAL_API_ERROR',
        status,
        error: responseData,
        payload: defaultScheduleData,
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        error: 'Failed to create schedule in Cal.com',
        details: responseData
      }, { status })
    }

    // Extract schedule from the response
    const calSchedule = responseData?.data;

    console.log('[CAL_AVAILABILITY_POST]', {
      status,
      scheduleId: calSchedule?.id,
      schedule: calSchedule,
      timestamp: new Date().toISOString(),
      step: 'Successfully created schedule in Cal.com'
    })

    if (calSchedule?.id) {
      // Create a corresponding CoachingAvailabilitySchedule using our mapper
      const scheduleUlid = generateUlid();
      const newSchedule = mapCalScheduleToDbSchedule(calSchedule, user.ulid, { ulid: scheduleUlid });
      
      // Prepare the schedule for database insertion
      const scheduleForDb = prepareScheduleForDb(newSchedule);
      
      // Create the coaching availability schedule in our database
      const { data: coachingSchedule, error: coachingScheduleError } = await supabase
        .from('CoachingAvailabilitySchedule')
        .insert(scheduleForDb)
        .select()
        .single();
      
      if (coachingScheduleError) {
        console.error('[CAL_AVAILABILITY_POST]', {
          context: 'COACHING_SCHEDULE_CREATE_ERROR',
          error: coachingScheduleError,
          calScheduleId: calSchedule.id,
          userUlid: user.ulid,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('[CAL_AVAILABILITY_POST]', {
          step: 'Created coaching availability schedule in local DB',
          calScheduleId: calSchedule.id,
          coachingScheduleUlid: scheduleUlid,
          timestamp: new Date().toISOString()
        });
      }
    }

    return NextResponse.json({
      status: 'success',
      data: calSchedule
    })
  } catch (error) {
    console.error('[CAL_AVAILABILITY_POST]', {
      context: 'UNEXPECTED_ERROR',
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { scheduleId: string } }) {
  try {
    const { userId } = auth()
    const scheduleId = params.scheduleId  // Extract scheduleId from params
    
    if (!userId) {
      console.error('[CAL_AVAILABILITY_DELETE]', {
        error: 'Unauthorized request',
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[CAL_AVAILABILITY_DELETE]', {
      userId,
      scheduleId,
      timestamp: new Date().toISOString(),
      step: 'Starting schedule deletion'
    })

    const supabase = createAuthClient()
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()

    if (userError || !user?.ulid) {
      console.error('[CAL_AVAILABILITY_DELETE]', {
        context: 'USER_LOOKUP',
        error: userError || 'User not found',
        userId,
        scheduleId,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('[CAL_AVAILABILITY_DELETE]', {
      userUlid: user.ulid,
      scheduleId,
      timestamp: new Date().toISOString(),
      step: 'Found user, fetching Cal.com integration'
    })

    const { data: integration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('*')
      .eq('userUlid', user.ulid)
      .eq('provider', 'CAL')
      .single()

    if (integrationError || !integration) {
      console.error('[CAL_AVAILABILITY_DELETE]', {
        context: 'INTEGRATION_LOOKUP',
        error: integrationError || 'Integration not found',
        userUlid: user.ulid,
        scheduleId,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Cal.com integration not found' }, { status: 404 })
    }

    console.log('[CAL_AVAILABILITY_DELETE]', {
      integrationId: integration.ulid,
      scheduleId,
      timestamp: new Date().toISOString(),
      step: 'Found integration, deleting schedule from Cal.com'
    })

    // Using regular user schedules endpoint, not organization endpoint
    const { ok, status, data: responseData } = await makeCalRequest(
      `https://api.cal.com/v2/schedules/${scheduleId}`,
      { method: 'DELETE' },
      integration,
      user.ulid
    )

    if (!ok) {
      console.error('[CAL_AVAILABILITY_DELETE]', {
        context: 'CAL_API_ERROR',
        status,
        error: responseData,
        scheduleId,
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        error: 'Failed to delete schedule from Cal.com',
        details: responseData
      }, { status })
    }

    // Log the full response for debugging
    console.log('[CAL_AVAILABILITY_DELETE]', {
      status,
      response: responseData,
      timestamp: new Date().toISOString(),
      step: 'Raw response from Cal.com'
    })

    return NextResponse.json({
      status: 'success',
      data: responseData
    })

  } catch (error) {
    console.error('[CAL_AVAILABILITY_DELETE]', {
      context: 'UNEXPECTED_ERROR',
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 