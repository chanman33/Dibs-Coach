import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getZoomSession, updateZoomSessionStatus } from '@/lib/zoom/zoom-service';
import { generateZoomSignature } from '@/utils/zoom-token';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { sessionId, displayName } = await request.json();
    
    if (!sessionId || !displayName) {
      return new NextResponse('Session ID and display name are required', { status: 400 });
    }

    // Get session details
    const session = await getZoomSession(sessionId);
    
    // Generate token
    const token = await generateZoomSignature(session.topic, userId === session.hostId ? 1 : 0);
    
    // If host is joining, update session status
    if (userId === session.hostId) {
      await updateZoomSessionStatus(sessionId, 'started');
    }

    return NextResponse.json({
      data: {
        token,
        sessionName: session.topic,
        role: userId === session.hostId ? 'host' : 'participant'
      }
    });
  } catch (error: any) {
    console.error('[ZOOM_SESSION_JOIN_ERROR]', error);
    return new NextResponse(error.message || 'Internal Server Error', { 
      status: error.status || 500 
    });
  }
} 