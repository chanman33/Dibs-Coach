import { NextResponse } from 'next/server';
import { calService } from '@/lib/cal/cal-service';
import { createAuthClient } from '@/utils/auth';

export async function GET() {
  try {
    // Get the most recently created user with a Cal integration
    const supabase = createAuthClient();
    
    // First, find the most recent calendar integration
    const { data: integrations, error: calError } = await supabase
      .from('CalendarIntegration')
      .select()
      .order('createdAt', { ascending: false })
      .limit(1);
    
    if (calError) {
      console.error('[GET_INTEGRATION_ERROR]', calError);
      return NextResponse.json(
        { error: 'Failed to find any calendar integrations', details: calError },
        { status: 500 }
      );
    }
    
    if (!integrations || integrations.length === 0) {
      return NextResponse.json(
        { error: 'No calendar integrations found. Create one first.' },
        { status: 404 }
      );
    }
    
    // Get the user associated with this integration
    const userUlid = integrations[0].userUlid;
    const { data: user, error: userError } = await supabase
      .from('User')
      .select()
      .eq('ulid', userUlid)
      .single();
    
    if (userError) {
      console.error('[GET_USER_ERROR]', userError);
      return NextResponse.json(
        { error: 'Failed to find user associated with integration', details: userError },
        { status: 500 }
      );
    }
    
    // Get the integration using the service
    const integrationData = await calService.getCalIntegration(userUlid);
    
    // Check if token needs refreshing
    let accessToken;
    let tokenRefreshed = false;
    
    try {
      accessToken = await calService.checkAndRefreshToken(userUlid);
      
      // Check if token was refreshed by comparing with the stored token
      tokenRefreshed = accessToken !== integrations[0].calAccessToken;
    } catch (tokenError: any) {
      console.error('[TOKEN_REFRESH_ERROR]', tokenError);
      // Continue even if token refresh fails
    }
    
    return NextResponse.json({
      success: true,
      data: {
        user,
        integration: integrationData,
        tokenRefreshed,
        tokenStatus: tokenRefreshed ? 'Token was refreshed' : 'Token is still valid'
      }
    });
  } catch (error: any) {
    console.error('[GET_CAL_INTEGRATION_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get Cal.com integration' },
      { status: 500 }
    );
  }
} 