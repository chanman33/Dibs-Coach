import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAuthClient } from '@/utils/auth';
import { withApiAuth } from '@/utils/middleware/withApiAuth';
import { generateZoomSignature } from '@/utils/zoom-token';
import { z } from 'zod';
import { ApiResponse } from '@/utils/types/api';
import { getUserById } from '@/utils/auth/user-management';

export const dynamic = 'force-dynamic';

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
    const sessionAuth = await auth();
    if (!sessionAuth?.userId) {
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

    // Get the current user's context (which includes ULID) from their Clerk ID
    const userContext = await getUserById(sessionAuth.userId);
    if (!userContext) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: "USER_NOT_FOUND",
          message: "Authenticated user not found in database"
        }
      }, { status: 404 });
    }
    const userUlid = userContext.userUlid;

    // Get session details from the Session table
    const { data: dbSession, error: sessionError } = await supabase
      .from("Session")
      .select("ulid, coachUlid, zoomMeetingId, zoomStartUrl, zoomJoinUrl")
      .eq("ulid", sessionId)
      .single();

    if (sessionError || !dbSession) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: "NOT_FOUND",
          message: "Session not found"
        }
      }, { status: 404 });
    }

    // Check if user is host or participant
    const isHost = dbSession.coachUlid === userUlid;
    const role = isHost ? 1 : 0; // 1 for host, 0 for participant

    // Generate Zoom token using zoomMeetingId as the sessionName/topic
    if (!dbSession.zoomMeetingId) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: "INVALID_INPUT",
          message: "Zoom meeting ID not found for this session, which is required."
        }
      }, { status: 400 });
    }
    const token = await generateZoomSignature(dbSession.zoomMeetingId, role);

    // If host is joining, update session status (Commented out as SessionStatus doesn't have 'active')
    /*
    if (isHost) {
      await supabase
        .from("Session")
        .update({ status: "active", updatedAt: new Date().toISOString() })
        .eq("ulid", sessionId);
    }
    */

    return NextResponse.json<ApiResponse<CallSessionResponse>>({
      data: {
        token,
        sessionName: dbSession.zoomMeetingId,
        role,
        startUrl: dbSession.zoomStartUrl || '',
        joinUrl: dbSession.zoomJoinUrl || ''
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