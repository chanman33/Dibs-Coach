/**
 * Cal.com Managed Users API - Refresh Managed User Token
 * 
 * This API route refreshes tokens for a managed user in Cal.com's API v2.
 * It implements the refresh endpoint documented at:
 * https://cal.com/docs/api-reference/v2/platform-managed-users/refresh-managed-user-tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createAuthClient } from '@/utils/auth';
import { env } from '@/lib/env';
import { CalTokenService } from '@/lib/cal/cal-service';
import { refreshUserCalTokens } from '@/utils/actions/cal-tokens';

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const forceRefresh = !!body.forceRefresh;
    const isManagedUser = !!body.isManagedUser;
    let userUlid = body.userUlid;
    const isServerAction = body.isServerAction === true;
    
    // If this is not a server action, validate authentication
    if (!isServerAction) {
      // Check authentication
      const { userId } = auth();
      if (!userId) {
        console.error('[CAL_REFRESH_TOKEN_ERROR]', {
          context: 'AUTH',
          error: 'User not authenticated',
          timestamp: new Date().toISOString()
        });
        return NextResponse.json({ 
          success: false,
          error: 'Unauthorized' 
        }, { status: 401 });
      }
      
      // If this is a direct user request (not a server action), get the userUlid from auth
      if (!userUlid) {
        const supabase = createAuthClient();
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('ulid')
          .eq('userId', userId)
          .single();
          
        if (userError || !userData?.ulid) {
          console.error('[CAL_REFRESH_TOKEN_ERROR]', {
            context: 'USER_LOOKUP',
            error: userError || 'User not found',
            userId,
            timestamp: new Date().toISOString()
          });
          return NextResponse.json({
            success: false,
            error: 'Failed to find user in database'
          }, { status: 404 });
        }
        
        userUlid = userData.ulid;
      }
    } else {
      console.log('[CAL_REFRESH_TOKEN]', {
        context: 'SERVER_ACTION',
        userUlid,
        forceRefresh,
        isManagedUser,
        timestamp: new Date().toISOString()
      });
      
      // For server actions, we MUST have a userUlid
      if (!userUlid) {
        console.error('[CAL_REFRESH_TOKEN_ERROR]', {
          context: 'SERVER_ACTION_MISSING_ULID',
          timestamp: new Date().toISOString()
        });
        return NextResponse.json({
          success: false,
          error: 'User ULID is required for server action calls'
        }, { status: 400 });
      }
    }
    
    console.log('[CAL_REFRESH_TOKEN]', {
      userUlid,
      forceRefresh,
      isManagedUser,
      timestamp: new Date().toISOString()
    });

    // Always use the server action for consistent cache invalidation behavior
    const result = await refreshUserCalTokens(userUlid, true);

    if (!result.success) {
      console.error('[CAL_REFRESH_TOKEN_ERROR]', {
        context: 'TOKEN_REFRESH_FAILED',
        error: result.error,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to refresh token'
      }, { status: 400 });
    }

    // Get the updated token data
    const supabase = createAuthClient();
    const { data: integration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('calAccessToken, calRefreshToken, calAccessTokenExpiresAt')
      .eq('userUlid', userUlid)
      .single();
      
    if (integrationError || !integration) {
      console.error('[CAL_REFRESH_TOKEN_ERROR]', {
        context: 'FETCH_UPDATED_TOKEN',
        error: integrationError,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: true,
        warning: 'Token refreshed but could not fetch updated token data'
      });
    }
    
    console.log('[CAL_REFRESH_TOKEN_SUCCESS]', {
      userUlid,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: {
        accessToken: integration.calAccessToken,
        refreshToken: integration.calRefreshToken,
        accessTokenExpiresAt: integration.calAccessTokenExpiresAt
      },
      method: 'managed-user-refresh'
    });
  } catch (error) {
    console.error('[CAL_REFRESH_TOKEN_ERROR]', {
      context: 'GENERAL',
      error,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
} 