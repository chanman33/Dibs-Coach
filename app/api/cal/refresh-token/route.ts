import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createAuthClient } from '@/utils/auth';
import { refreshUserCalTokens } from '@/utils/actions/cal-tokens';

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

    // Use the server action to refresh the token
    const refreshResult = await refreshUserCalTokens(user.ulid, true);
    
    if (!refreshResult.success) {
      console.error('[API_ERROR]', {
        context: 'REFRESH_TOKEN_FAILED',
        error: refreshResult.error,
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: false,
        error: refreshResult.error || 'Failed to refresh token'
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
      message: 'Token refreshed successfully'
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