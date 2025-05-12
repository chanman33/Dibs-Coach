import { NextResponse } from 'next/server';
import { ApiResponse } from '@/utils/types/api';
import { CoachMetricsSchema, type CoachMetrics } from '@/utils/types/coach';
import { USER_CAPABILITIES } from '@/utils/roles/roles';
import { withApiAuth } from '@/utils/middleware/withApiAuth';
import { createAuthClient } from '@/utils/auth';

export const GET = withApiAuth<CoachMetrics>(async (req, { userUlid }) => {
  try {
    const supabase = await createAuthClient();

    // Get metrics from CoachSessionMetrics
    const { data: metrics, error: metricsError } = await supabase
      .from('CoachProfile')
      .select('*')
      .eq('userUlid', userUlid)
      .single();

    if (metricsError) {
      console.error('[COACH_METRICS_ERROR] Failed to fetch metrics:', { userUlid, error: metricsError });
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch coach metrics'
        }
      }, { status: 500 });
    }

    // Get count of upcoming sessions
    const { count: upcomingSessions, error: sessionsError } = await supabase
      .from('Session')
      .select('*', { count: 'exact', head: true })
      .eq('coachUlid', userUlid)
      .gt('startTime', new Date().toISOString())
      .eq('status', 'SCHEDULED');

    if (sessionsError) {
      console.error('[COACH_METRICS_ERROR] Failed to fetch upcoming sessions:', { userUlid, error: sessionsError });
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch upcoming sessions'
        }
      }, { status: 500 });
    }

    const metricsData = {
      ...metrics,
      upcomingSessions: upcomingSessions || 0
    };

    // Validate metrics data
    const validatedMetrics = CoachMetricsSchema.parse(metricsData);

    return NextResponse.json<ApiResponse<CoachMetrics>>({ 
      data: validatedMetrics,
      error: null
    });
  } catch (error) {
    console.error('[COACH_METRICS_ERROR] Unexpected error:', { userUlid, error });
    if (error instanceof Error) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      }, { status: 400 });
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 });
  }
}, { requiredCapabilities: [USER_CAPABILITIES.COACH] }); 