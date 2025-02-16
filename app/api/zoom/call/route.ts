import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAuthClient } from '@/utils/auth';
import { withApiAuth } from '@/utils/middleware/withApiAuth';
import { generateZoomSignature } from '@/utils/zoom-token';
import { z } from 'zod';
import { ApiResponse } from '@/utils/types/api';

const callSessionSchema = z.object({
  sessionId: z.string(),
  displayName: z.string()
});

type CallSessionResponse = {
  token: string;
  sessionName: string;
  role: number;
  startUrl: string;
  joinUrl: string;
};

export const POST = withApiAuth<CallSessionResponse>(async (req: Request) => {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: "UNAUTHORIZED",
          message: "Unauthorized"
        }
      }, { status: 401 });
    }

    const body = await req.json();
    const result = callSessionSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: result.error.errors
        }
      }, { status: 400 });
    }

    const { sessionId, displayName } = result.data;
    const supabase = await createAuthClient();

    // Get session details
    const { data: zoomSession, error: sessionError } = await supabase
      .from("ZoomSession")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !zoomSession) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: "NOT_FOUND",
          message: "Session not found"
        }
      }, { status: 404 });
    }

    // Check if user is host or participant
    const isHost = zoomSession.hostUlid === session.userId;
    const role = isHost ? 1 : 0; // 1 for host, 0 for participant

    // Generate Zoom token
    const token = await generateZoomSignature(zoomSession.sessionName, role);

    // If host is joining, update session status
    if (isHost) {
      await supabase
        .from("ZoomSession")
        .update({ status: "active", updatedAt: new Date().toISOString() })
        .eq("id", sessionId);
    }

    return NextResponse.json<ApiResponse<CallSessionResponse>>({
      data: {
        token,
        sessionName: zoomSession.sessionName,
        role,
        startUrl: zoomSession.startUrl,
        joinUrl: zoomSession.joinUrl
      },
      error: null
    });
  } catch (error) {
    console.error("[ZOOM_CALL_ERROR]", error);
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to process request"
      }
    }, { status: 500 });
  }
}); 