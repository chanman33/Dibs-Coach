import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createAuthClient } from '@/utils/auth';
import { refreshCalAccessToken } from '@/utils/auth/cal-token-service';

/**
 * API endpoint for refreshing a user's Cal.com token
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      console.error('[API_ERROR]', {
        context: 'REFRESH_TOKEN_AUTH',
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Get the user's ULID from Supabase
    const supabase = createAuthClient();
    const { data: user, error } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single();

    if (error || !user?.ulid) {
      console.error('[API_ERROR]', {
        context: 'REFRESH_TOKEN_USER',
        error: error || 'User not found',
        userId,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ 
        success: false,
        error: 'User not found' 
      }, { status: 500 });
    }

    console.log('[API_INFO]', {
      context: 'REFRESH_TOKEN_ATTEMPT',
      userUlid: user.ulid,
      timestamp: new Date().toISOString()
    });

    // Check environment variables are available
    if (!process.env.CAL_CLIENT_ID || !process.env.CAL_CLIENT_SECRET) {
      console.error('[API_ERROR]', {
        context: 'REFRESH_TOKEN_ENV_MISSING',
        userUlid: user.ulid,
        clientIdPresent: !!process.env.CAL_CLIENT_ID,
        clientSecretPresent: !!process.env.CAL_CLIENT_SECRET,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: false,
        error: 'Missing required environment variables for Cal.com integration'
      }, { status: 500 });
    }

    // Use token service to refresh the Cal.com token
    const result = await refreshCalAccessToken(user.ulid);
    
    if (!result.success) {
      console.error('[API_ERROR]', {
        context: 'REFRESH_TOKEN_FAILED',
        error: result.error,
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      });
      
      // Return a more descriptive error
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to refresh token',
        details: result.tokens || null
      }, { status: 400 });
    } else {
      console.log('[API_SUCCESS]', {
        context: 'REFRESH_TOKEN',
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        // Return limited token info for client confirmation
        accessTokenUpdated: true,
        expiresIn: result.tokens?.expires_in || null
      }
    });
    
  } catch (error) {
    console.error('[API_ERROR]', {
      context: 'REFRESH_TOKEN_GENERAL',
      error,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
} 