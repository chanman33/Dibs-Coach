import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createZoomSession, getZoomSession, updateZoomSessionStatus, deleteZoomSession } from '@/lib/zoom/zoom-service';
import { ZoomSessionConfig, ZoomSession, ZOOM_SESSION_STATUS } from '@/utils/types/zoom';
import { withApiAuth } from '@/utils/middleware/withApiAuth';
import { ApiResponse } from '@/utils/types/api';
import { z } from 'zod';
import { ulidSchema } from '@/utils/types/auth';

export const dynamic = 'force-dynamic';

// Validation schemas
const CreateSessionSchema = z.object({
  sessionName: z.string().min(1, 'Session name is required'),
  duration: z.number().min(15).max(240),
  startTime: z.string().datetime().optional(),
  timezone: z.string().optional()
});

const UpdateSessionSchema = z.object({
  status: z.enum([
    ZOOM_SESSION_STATUS.SCHEDULED,
    ZOOM_SESSION_STATUS.STARTED,
    ZOOM_SESSION_STATUS.ENDED,
    ZOOM_SESSION_STATUS.CANCELLED
  ]),
  sessionId: z.string()
});

// Create a new Zoom session
export const POST = withApiAuth<ZoomSession>(async (req: Request, { userUlid }) => {
  try {
    const body = await req.json();
    const validatedData = CreateSessionSchema.parse(body);
    
    const session = await createZoomSession({
      ...validatedData,
      userName: '', // Will be set by the service
      sessionPasscode: Math.random().toString(36).slice(-8)
    });

    return NextResponse.json<ApiResponse<ZoomSession>>({
      data: session,
      error: null
    });
  } catch (error) {
    console.error('[CREATE_ZOOM_SESSION_ERROR]', error);
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create Zoom session',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 });
  }
});

// Get a Zoom session
export const GET = withApiAuth<ZoomSession>(async (req: Request, { userUlid }) => {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session ID is required'
        }
      }, { status: 400 });
    }

    const session = await getZoomSession(sessionId);
    
    if (!session) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found'
        }
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<ZoomSession>>({
      data: session,
      error: null
    });
  } catch (error) {
    console.error('[GET_ZOOM_SESSION_ERROR]', error);
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch Zoom session',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 });
  }
});

// Update a Zoom session status
export const PATCH = withApiAuth<ZoomSession>(async (req: Request, { userUlid }) => {
  try {
    const body = await req.json();
    const validatedData = UpdateSessionSchema.parse(body);
    
    await updateZoomSessionStatus(validatedData.sessionId, validatedData.status);
    
    const updatedSession = await getZoomSession(validatedData.sessionId);
    
    return NextResponse.json<ApiResponse<ZoomSession>>({
      data: updatedSession,
      error: null
    });
  } catch (error) {
    console.error('[UPDATE_ZOOM_SESSION_ERROR]', error);
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update Zoom session',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 });
  }
});

// Delete a Zoom session
export const DELETE = withApiAuth<void>(async (req: Request, { userUlid }) => {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session ID is required'
        }
      }, { status: 400 });
    }

    await deleteZoomSession(sessionId);

    return NextResponse.json<ApiResponse<void>>({
      data: undefined,
      error: null
    });
  } catch (error) {
    console.error('[DELETE_ZOOM_SESSION_ERROR]', error);
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete Zoom session',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 });
  }
}); 