import { NextResponse } from 'next/server';
import { calOAuthClient } from '@/lib/cal/cal-oauth';
import { env } from '@/lib/env';
import { auth } from '@clerk/nextjs';
import { createAuthClient } from '@/utils/auth';
import { generateUlid } from '@/utils/ulid';

interface StateParams {
  userId: string;
  redirectUrl: string;
  errorRedirectUrl: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const stateParam = searchParams.get('state');
  
  // Default redirect URLs
  let redirectUrl = env.NEXT_PUBLIC_CAL_BOOKING_SUCCESS_URL;
  let errorRedirectUrl = env.NEXT_PUBLIC_CAL_BOOKING_CANCEL_URL;
  let stateUserId: string | null = null;
  
  // Try to parse the state parameter to get custom redirect URLs
  if (stateParam) {
    try {
      const stateData = JSON.parse(Buffer.from(stateParam, 'base64').toString()) as StateParams;
      redirectUrl = stateData.redirectUrl || redirectUrl;
      errorRedirectUrl = stateData.errorRedirectUrl || errorRedirectUrl;
      stateUserId = stateData.userId;
      
      console.log('[CAL_OAUTH_CALLBACK] Parsed state parameter:', {
        redirectUrl,
        errorRedirectUrl,
        stateUserId,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('[CAL_OAUTH_CALLBACK_ERROR] Failed to parse state parameter:', {
        error: e,
        stateParam,
        timestamp: new Date().toISOString()
      });
    }
  }

  if (error) {
    console.error('[CAL_OAUTH_ERROR]', { error, timestamp: new Date().toISOString() });
    return NextResponse.redirect(
      `${errorRedirectUrl}?error=${error}`
    );
  }

  if (!code) {
    console.error('[CAL_OAUTH_ERROR] No code provided in callback');
    return NextResponse.redirect(
      `${errorRedirectUrl}?error=no_code`
    );
  }

  // Get the current user from Clerk
  const { userId } = auth();
  if (!userId && !stateUserId) {
    console.error('[CAL_OAUTH_ERROR] No authenticated user');
    return NextResponse.redirect(
      `${errorRedirectUrl}?error=unauthorized`
    );
  }
  
  // Use either the authenticated user or the one from the state
  const actualUserId = userId || stateUserId;
  if (!actualUserId) {
    console.error('[CAL_OAUTH_ERROR] Unable to determine user ID');
    return NextResponse.redirect(
      `${errorRedirectUrl}?error=user_not_found`
    );
  }

  try {
    // Exchange the code for an access token
    const tokenData = await calOAuthClient.getAccessToken(code);
    
    // Get the supabase client
    const supabase = createAuthClient();
    
    // Get the user's ULID from their Clerk ID
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', actualUserId)
      .single();
    
    if (userError) {
      console.error('[CAL_OAUTH_ERROR] Failed to fetch user', {
        error: userError,
        userId: actualUserId,
        timestamp: new Date().toISOString()
      });
      return NextResponse.redirect(
        `${errorRedirectUrl}?error=user_fetch_error`
      );
    }

    const userUlid = user.ulid;
    const now = new Date().toISOString();
    
    // Calculate token expiration date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);
    
    // Check if this user already has a Cal.com integration
    const { data: existingIntegration, error: fetchError } = await supabase
      .from('CalendarIntegration')
      .select('ulid')
      .eq('userUlid', userUlid)
      .eq('provider', 'CAL')
      .maybeSingle();

    if (fetchError) {
      console.error('[CAL_OAUTH_ERROR] Failed to check for existing integration', {
        error: fetchError,
        userUlid,
        timestamp: new Date().toISOString()
      });
      return NextResponse.redirect(
        `${errorRedirectUrl}?error=integration_check_error`
      );
    }

    // Fetch user profile from Cal.com to get additional data
    const userProfileResponse = await fetch('https://api.cal.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userProfileResponse.ok) {
      console.error('[CAL_OAUTH_ERROR] Failed to fetch Cal.com user profile', {
        status: userProfileResponse.status,
        timestamp: new Date().toISOString()
      });
      return NextResponse.redirect(
        `${errorRedirectUrl}?error=profile_fetch_error`
      );
    }

    const userProfile = await userProfileResponse.json();
    const calManagedUserId = userProfile.id;
    const calUsername = userProfile.username;
    
    if (existingIntegration) {
      // Update existing integration
      const { error: updateError } = await supabase
        .from('CalendarIntegration')
        .update({
          calManagedUserId: calManagedUserId,
          calUsername: calUsername,
          calAccessToken: tokenData.access_token,
          calRefreshToken: tokenData.refresh_token,
          calAccessTokenExpiresAt: expiresAt.toISOString(),
          defaultScheduleId: userProfile.defaultScheduleId,
          timeZone: userProfile.timeZone,
          weekStart: userProfile.weekStart,
          timeFormat: userProfile.timeFormat,
          locale: userProfile.locale,
          lastSyncedAt: now,
          syncEnabled: true,
          updatedAt: now
        })
        .eq('ulid', existingIntegration.ulid);

      if (updateError) {
        console.error('[CAL_OAUTH_ERROR] Failed to update integration', {
          error: updateError,
          integrationUlid: existingIntegration.ulid,
          timestamp: new Date().toISOString()
        });
        return NextResponse.redirect(
          `${errorRedirectUrl}?error=integration_update_error`
        );
      }
    } else {
      // Create new integration
      const integrationUlid = generateUlid();
      const { error: insertError } = await supabase
        .from('CalendarIntegration')
        .insert({
          ulid: integrationUlid,
          userUlid: userUlid,
          provider: 'CAL',
          calManagedUserId: calManagedUserId,
          calUsername: calUsername,
          calAccessToken: tokenData.access_token,
          calRefreshToken: tokenData.refresh_token,
          calAccessTokenExpiresAt: expiresAt.toISOString(),
          defaultScheduleId: userProfile.defaultScheduleId,
          timeZone: userProfile.timeZone,
          weekStart: userProfile.weekStart,
          timeFormat: userProfile.timeFormat,
          locale: userProfile.locale,
          syncEnabled: true,
          createdAt: now,
          updatedAt: now
        });

      if (insertError) {
        console.error('[CAL_OAUTH_ERROR] Failed to create integration', {
          error: insertError,
          userUlid,
          timestamp: new Date().toISOString()
        });
        return NextResponse.redirect(
          `${errorRedirectUrl}?error=integration_create_error`
        );
      }
    }

    // Successfully saved the integration, redirect to success page
    console.log('[CAL_OAUTH_SUCCESS] Integration saved', { 
      userUlid, 
      calManagedUserId: calManagedUserId, 
      timestamp: new Date().toISOString() 
    });
    
    return NextResponse.redirect(
      `${redirectUrl}?success=true`
    );
  } catch (error) {
    console.error('[CAL_OAUTH_ERROR] Failed during OAuth process:', {
      error,
      userId: actualUserId,
      timestamp: new Date().toISOString()
    });
    return NextResponse.redirect(
      `${errorRedirectUrl}?error=oauth_process_error`
    );
  }
} 