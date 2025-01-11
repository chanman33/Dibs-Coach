import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateVideoToken } from '@/utils/zoom-token';

export async function GET() {
  try {
    // Get the authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!process.env.ZOOM_SDK_KEY || !process.env.ZOOM_SDK_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Zoom SDK credentials are not configured on the server' },
        { status: 500 }
      );
    }

    // Generate a unique session name using userId and timestamp
    const sessionName = `session_${userId}_${Date.now()}`;
    const sessionPasscode = Math.random().toString(36).slice(-8); // Generate random passcode

    // Generate the token on the server side
    const token = await generateVideoToken(sessionName);

    return NextResponse.json({
      success: true,
      config: {
        sessionName,
        sessionPasscode,
        userName: userId, // You might want to fetch the actual user name from your database
        token, // Include the token in the response
      }
    });
  } catch (error) {
    console.error('[ZOOM_CONFIG_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate Zoom configuration' },
      { status: 500 }
    );
  }
} 