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
  mapDbScheduleToCalPayload
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
      step: 'Found integration, fetching schedules from Cal.com'
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

    console.log('[CAL_AVAILABILITY_GET]', {
      status,
      schedulesCount: schedules.length,
      schedules,
      timestamp: new Date().toISOString(),
      step: 'Successfully fetched schedules'
    })

    return NextResponse.json({ 
      status: 'success',
      data: schedules
    })

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

    console.log('[CAL_AVAILABILITY_POST]', {
      integrationId: integration.ulid,
      timestamp: new Date().toISOString(),
      step: 'Found integration, creating schedule payload'
    })

    // Default schedule payload for Cal.com
    const schedulePayload = {
      name: "Default Schedule",
      timeZone: integration.timeZone || "America/New_York",
      availability: [
        {
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          startTime: "09:00",
          endTime: "17:00"
        }
      ],
      isDefault: true
    }

    console.log('[CAL_AVAILABILITY_POST]', {
      payload: schedulePayload,
      timestamp: new Date().toISOString(),
      step: 'Creating schedule in Cal.com'
    })

    const { ok, status, data: responseData } = await makeCalRequest(
      'https://api.cal.com/v2/schedules',
      {
        method: 'POST',
        body: JSON.stringify(schedulePayload)
      },
      integration,
      user.ulid
    )

    if (!ok) {
      console.error('[CAL_AVAILABILITY_POST]', {
        context: 'CAL_API_ERROR',
        status,
        error: responseData,
        payload: schedulePayload,
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        error: 'Failed to create schedule in Cal.com',
        details: responseData
      }, { status })
    }

    // Log the full response for debugging
    console.log('[CAL_AVAILABILITY_POST]', {
      status,
      response: responseData,
      timestamp: new Date().toISOString(),
      step: 'Raw response from Cal.com'
    })

    // Extract schedule from the response data structure
    const calSchedule: CalSchedule = responseData?.data;

    console.log('[CAL_AVAILABILITY_POST]', {
      status,
      scheduleId: calSchedule?.id,
      schedule: calSchedule,
      timestamp: new Date().toISOString(),
      step: 'Successfully created schedule'
    })

    if (calSchedule?.id) {
      // Update the integration with the default schedule ID
      const { error: updateError } = await supabase
        .from('CalendarIntegration')
        .update({ defaultScheduleId: calSchedule.id })
        .eq('ulid', integration.ulid)

      if (updateError) {
        console.error('[CAL_AVAILABILITY_POST]', {
          context: 'DB_UPDATE_ERROR',
          error: updateError,
          integrationId: integration.ulid,
          scheduleId: calSchedule.id,
          timestamp: new Date().toISOString()
        })
      } else {
        console.log('[CAL_AVAILABILITY_POST]', {
          step: 'Updated integration with default schedule ID',
          integrationId: integration.ulid,
          scheduleId: calSchedule.id,
          timestamp: new Date().toISOString()
        })
      }
      
      // Create a corresponding CoachingAvailabilitySchedule using our mapper
      const scheduleUlid = generateUlid();
      const newSchedule = mapCalScheduleToDbSchedule(calSchedule, user.ulid, scheduleUlid);
      
      // Format the schedule for database insertion
      const scheduleForDb = {
        ulid: newSchedule.ulid,
        userUlid: newSchedule.userUlid,
        name: newSchedule.name,
        timeZone: newSchedule.timeZone,
        calScheduleId: newSchedule.calScheduleId,
        availability: newSchedule.availability,
        overrides: newSchedule.overrides,
        syncSource: newSchedule.syncSource,
        lastSyncedAt: newSchedule.lastSyncedAt,
        isDefault: newSchedule.isDefault,
        active: newSchedule.active,
        allowCustomDuration: newSchedule.allowCustomDuration,
        defaultDuration: newSchedule.defaultDuration,
        maximumDuration: newSchedule.maximumDuration,
        minimumDuration: newSchedule.minimumDuration,
        bufferAfter: newSchedule.bufferAfter,
        bufferBefore: newSchedule.bufferBefore,
        totalSessions: newSchedule.totalSessions,
        zoomEnabled: newSchedule.zoomEnabled,
        calendlyEnabled: newSchedule.calendlyEnabled,
        updatedAt: newSchedule.updatedAt
      };
      
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
        
        // We don't want to fail the entire request if just the local DB sync fails
        // The Cal.com schedule is created successfully
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