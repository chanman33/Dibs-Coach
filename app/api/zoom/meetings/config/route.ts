import { NextResponse } from 'next/server';
import { createAuthClient } from '@/utils/auth';
import { withApiAuth } from '@/utils/middleware/withApiAuth';
import { ZoomService } from '@/lib/zoom/zoom-service';
import { 
  SessionMeetingConfigSchema, 
  type SessionMeetingConfig 
} from '@/utils/types/zoom';
import { ApiResponse } from '@/utils/types/api';
import { z } from 'zod';

// GET /api/zoom/meetings/config - Get meeting configuration
export const GET = withApiAuth<SessionMeetingConfig>(async (req: Request, { userUlid }) => {
  try {
    const supabase = await createAuthClient();

    const zoomService = new ZoomService();
    await zoomService.init();

    const config = await zoomService.getMeetingConfig(userUlid);
    
    if (!config) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'No meeting configuration found'
        }
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<SessionMeetingConfig>>({
      data: config,
      error: null
    });
  } catch (error) {
    console.error('[GET_ZOOM_CONFIG_ERROR]', error);
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch meeting configuration',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 });
  }
});

// POST /api/zoom/meetings/config - Update meeting configuration
export const POST = withApiAuth<{ success: true }>(async (req: Request, { userUlid }) => {
  try {
    const supabase = await createAuthClient();

    const body = await req.json();
    const validatedData = SessionMeetingConfigSchema.parse(body);

    const zoomService = new ZoomService();
    await zoomService.init();

    await zoomService.updateMeetingConfig(validatedData, userUlid);

    return NextResponse.json<ApiResponse<{ success: true }>>({
      data: { success: true },
      error: null
    });
  } catch (error) {
    console.error('[UPDATE_ZOOM_CONFIG_ERROR]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid configuration data',
          details: error.flatten()
        }
      }, { status: 400 });
    }
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update meeting configuration',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 });
  }
}); 