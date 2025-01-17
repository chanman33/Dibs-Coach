import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createZoomSession, getZoomSession, updateZoomSessionStatus, deleteZoomSession } from '@/lib/zoom/zoom-service';
import { ZoomSessionConfig } from '@/utils/types/zoom';

// Create a new Zoom session
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const config: Omit<ZoomSessionConfig, 'token'> = await request.json();
    const session = await createZoomSession(config);

    return NextResponse.json({ data: session });
  } catch (error: any) {
    console.error('[ZOOM_SESSION_CREATE_ERROR]', error);
    return new NextResponse(error.message || 'Internal Server Error', { 
      status: error.status || 500 
    });
  }
}

// Get a Zoom session
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return new NextResponse('Session ID is required', { status: 400 });
    }

    const session = await getZoomSession(sessionId);
    return NextResponse.json({ data: session });
  } catch (error: any) {
    console.error('[ZOOM_SESSION_GET_ERROR]', error);
    return new NextResponse(error.message || 'Internal Server Error', { 
      status: error.status || 500 
    });
  }
}

// Update a Zoom session status
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { sessionId, status } = await request.json();
    
    if (!sessionId || !status) {
      return new NextResponse('Session ID and status are required', { status: 400 });
    }

    await updateZoomSessionStatus(sessionId, status);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('[ZOOM_SESSION_UPDATE_ERROR]', error);
    return new NextResponse(error.message || 'Internal Server Error', { 
      status: error.status || 500 
    });
  }
}

// Delete a Zoom session
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return new NextResponse('Session ID is required', { status: 400 });
    }

    await deleteZoomSession(sessionId);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('[ZOOM_SESSION_DELETE_ERROR]', error);
    return new NextResponse(error.message || 'Internal Server Error', { 
      status: error.status || 500 
    });
  }
} 