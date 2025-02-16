import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getZoomSession, updateZoomSessionStatus } from '@/lib/zoom/zoom-service';
import { generateZoomSignature } from '@/utils/zoom-token';
import { withApiAuth } from '@/utils/middleware/withApiAuth';
import { ApiResponse } from '@/utils/types/api';
import { z } from 'zod';

// Response type
interface JoinSessionResponse {
  token: string;
  sessionName: string;
  role: 'host' | 'participant';
}

// Validation schema
const JoinSessionSchema = z.object({
  sessionId: z.string(),
  displayName: z.string().min(1, 'Display name is required')
});

export const POST = withApiAuth<JoinSessionResponse>(async (req: Request, { userUlid }) => {
  try {
    const body = await req.json();
    const validatedData = JoinSessionSchema.parse(body);
    
    // Get session details
    const session = await getZoomSession(validatedData.sessionId);
    
    if (!session) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found'
        }
      }, { status: 404 });
    }
    
    // Generate token
    const token = await generateZoomSignature(session.topic, session.hostId === userUlid ? 1 : 0);
    
    // If host is joining, update session status
    if (session.hostId === userUlid) {
      await updateZoomSessionStatus(validatedData.sessionId, 'started');
    }

    return NextResponse.json<ApiResponse<JoinSessionResponse>>({
      data: {
        token,
        sessionName: session.topic,
        role: session.hostId === userUlid ? 'host' : 'participant'
      },
      error: null
    });
  } catch (error) {
    console.error('[ZOOM_SESSION_JOIN_ERROR]', error);
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to join Zoom session',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 });
  }
}); 