import { NextResponse } from 'next/server';
import { ApiResponse } from '@/utils/types/api';
import { withApiAuth } from '@/utils/middleware/withApiAuth';
import { createAuthClient } from '@/utils/auth';
import { z } from 'zod';

const MetricsResponseSchema = z.object({
  totalSessions: z.number(),
  completedSessions: z.number(),
  canceledSessions: z.number(),
  noShowSessions: z.number(),
  averageRating: z.number().nullable(),
  totalRevenue: z.number(),
  upcomingSessions: z.number()
});

type CoachMetrics = z.infer<typeof MetricsResponseSchema>;

export const GET = withApiAuth<CoachMetrics>(async (req, { userUlid }) => {
  try {
    const supabase = await createAuthClient();

    // Get coach's session metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('CoachSessionMetrics')
      .select('*')
      .eq('userUlid', userUlid)
      .single();

    if (metricsError) {
      console.error('[METRICS_GET_ERROR] Error fetching metrics:', metricsError);
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error fetching metrics'
        }
      }, { status: 500 });
    }

    // Get upcoming sessions count
    const { count: upcomingSessions, error: upcomingError } = await supabase
      .from('CoachSession')
      .select('*', { count: 'exact', head: true })
      .eq('coachUlid', userUlid)
      .eq('status', 'SCHEDULED')
      .gte('startTime', new Date().toISOString());

    if (upcomingError) {
      console.error('[METRICS_GET_ERROR] Error fetching upcoming sessions:', upcomingError);
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error fetching upcoming sessions'
        }
      }, { status: 500 });
    }

    const response: CoachMetrics = {
      ...metrics,
      upcomingSessions: upcomingSessions || 0
    };

    const validatedData = MetricsResponseSchema.parse(response);

    return NextResponse.json<ApiResponse<CoachMetrics>>({
      data: validatedData,
      error: null
    });

  } catch (error) {
    console.error('[METRICS_GET_ERROR]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid metrics data',
          details: error.errors
        }
      }, { status: 400 });
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal Server Error'
      }
    }, { status: 500 });
  }
}); 