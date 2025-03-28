import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createAuthClient } from '@/utils/auth';
import { refreshCalAccessToken, isCalTokenExpired } from '@/utils/auth/cal-token-service';

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

    // For DELETE requests, we might not get JSON back
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { status: response.ok ? 'success' : 'error' };
    }

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

      // Same handling for retry response
      let retryData;
      const retryContentType = retryResponse.headers.get('content-type');
      if (retryContentType && retryContentType.includes('application/json')) {
        retryData = await retryResponse.json();
      } else {
        retryData = { status: retryResponse.ok ? 'success' : 'error' };
      }

      return {
        ok: retryResponse.ok,
        status: retryResponse.status,
        data: retryData
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = params.id;
    
    console.log('[CAL_AVAILABILITY_DELETE]', {
      scheduleId,
      timestamp: new Date().toISOString(),
      step: 'Starting schedule deletion'
    });

    const { userId } = auth();
    if (!userId) {
      console.error('[CAL_AVAILABILITY_DELETE]', {
        error: 'Unauthorized request',
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CAL_AVAILABILITY_DELETE]', {
      userId,
      scheduleId,
      timestamp: new Date().toISOString(),
      step: 'Authenticated request, looking up user'
    });

    const supabase = createAuthClient();
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single();

    if (userError || !user?.ulid) {
      console.error('[CAL_AVAILABILITY_DELETE]', {
        context: 'USER_LOOKUP',
        error: userError || 'User not found',
        userId,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[CAL_AVAILABILITY_DELETE]', {
      userUlid: user.ulid,
      scheduleId,
      timestamp: new Date().toISOString(),
      step: 'Found user, fetching Cal.com integration'
    });

    const { data: integration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('*')
      .eq('userUlid', user.ulid)
      .eq('provider', 'CAL')
      .single();

    if (integrationError || !integration) {
      console.error('[CAL_AVAILABILITY_DELETE]', {
        context: 'INTEGRATION_LOOKUP',
        error: integrationError || 'Integration not found',
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: 'Cal.com integration not found' }, { status: 404 });
    }

    // Check if this is the default schedule
    if (integration.defaultScheduleId === Number(scheduleId)) {
      console.error('[CAL_AVAILABILITY_DELETE]', {
        context: 'DEFAULT_SCHEDULE',
        error: 'Cannot delete default schedule',
        scheduleId,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'Cannot delete the default schedule' },
        { status: 400 }
      );
    }

    // Find and delete the corresponding CoachingAvailabilitySchedule
    // Use the explicit calScheduleId field instead of looking in rules
    const { data: coachingSchedule, error: findScheduleError } = await supabase
      .from('CoachingAvailabilitySchedule')
      .select('ulid')
      .eq('userUlid', user.ulid)
      .eq('calScheduleId', parseInt(scheduleId))
      .maybeSingle();

    if (findScheduleError) {
      console.error('[CAL_AVAILABILITY_DELETE]', {
        context: 'FIND_COACHING_SCHEDULE_ERROR',
        error: findScheduleError,
        scheduleId,
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      });
      // We don't want to fail the entire operation if just the local DB sync fails
    } else if (coachingSchedule) {
      // Delete the coaching schedule
      const { error: deleteScheduleError } = await supabase
        .from('CoachingAvailabilitySchedule')
        .delete()
        .eq('ulid', coachingSchedule.ulid);

      if (deleteScheduleError) {
        console.error('[CAL_AVAILABILITY_DELETE]', {
          context: 'DELETE_COACHING_SCHEDULE_ERROR',
          error: deleteScheduleError,
          coachingScheduleUlid: coachingSchedule.ulid,
          scheduleId,
          timestamp: new Date().toISOString()
        });
        // We don't want to fail the entire operation if just the local DB sync fails
      } else {
        console.log('[CAL_AVAILABILITY_DELETE]', {
          step: 'Deleted coaching schedule from local DB',
          coachingScheduleUlid: coachingSchedule.ulid,
          scheduleId,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // Try the legacy lookup method as a fallback
      const { data: legacySchedule, error: legacyFindError } = await supabase
        .from('CoachingAvailabilitySchedule')
        .select('ulid')
        .eq('userUlid', user.ulid)
        .filter('rules->scheduleId', 'eq', parseInt(scheduleId))
        .maybeSingle();
        
      if (!legacyFindError && legacySchedule) {
        // Delete the legacy schedule
        const { error: deleteLegacyError } = await supabase
          .from('CoachingAvailabilitySchedule')
          .delete()
          .eq('ulid', legacySchedule.ulid);
          
        if (deleteLegacyError) {
          console.error('[CAL_AVAILABILITY_DELETE]', {
            context: 'DELETE_LEGACY_SCHEDULE_ERROR',
            error: deleteLegacyError,
            legacyScheduleUlid: legacySchedule.ulid,
            scheduleId,
            timestamp: new Date().toISOString()
          });
        } else {
          console.log('[CAL_AVAILABILITY_DELETE]', {
            step: 'Deleted legacy coaching schedule from local DB',
            legacyScheduleUlid: legacySchedule.ulid,
            scheduleId,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.log('[CAL_AVAILABILITY_DELETE]', {
          step: 'No matching coaching schedule found in local DB',
          scheduleId,
          userUlid: user.ulid,
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log('[CAL_AVAILABILITY_DELETE]', {
      integrationId: integration.ulid,
      scheduleId,
      timestamp: new Date().toISOString(),
      step: 'Found integration, deleting schedule from Cal.com'
    });

    // Call Cal.com API to delete the schedule
    const { ok, status, data: responseData } = await makeCalRequest(
      `https://api.cal.com/v2/schedules/${scheduleId}`,
      { method: 'DELETE' },
      integration,
      user.ulid
    );

    if (!ok) {
      console.error('[CAL_AVAILABILITY_DELETE]', {
        context: 'CAL_API_ERROR',
        status,
        error: responseData,
        scheduleId,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'Failed to delete schedule from Cal.com', details: responseData },
        { status }
      );
    }

    console.log('[CAL_AVAILABILITY_DELETE]', {
      status,
      scheduleId,
      timestamp: new Date().toISOString(),
      step: 'Successfully deleted schedule'
    });

    return NextResponse.json({
      status: 'success',
      message: 'Schedule deleted successfully'
    });

  } catch (error) {
    console.error('[CAL_AVAILABILITY_DELETE]', {
      context: 'UNEXPECTED_ERROR',
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 