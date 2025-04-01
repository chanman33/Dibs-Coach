import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAuthClient } from '@/utils/auth';
import { SYSTEM_ROLES } from '@/utils/roles/roles';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get authenticated Supabase client
    const supabase = await createAuthClient();

    // Get admin's ULID and check role
    const { data: adminCheck, error: adminCheckError } = await supabase
      .from('User')
      .select('ulid, systemRole')
      .eq('userId', session.userId)
      .single();

    if (adminCheckError) {
      console.error('[ADMIN_CHECK_ERROR]', { userId: session.userId, error: adminCheckError });
      return new NextResponse('Error checking admin status', { status: 500 });
    }

    if (!adminCheck || adminCheck.systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
      return new NextResponse('Forbidden: System owner access required', { status: 403 });
    }

    // Get the authorization code from the URL
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const state = url.searchParams.get('state');

    console.log('[CAL_CALLBACK_DEBUG] Received callback:', {
      code: code ? 'present' : 'missing',
      error,
      state,
      url: request.url,
      headers: Object.fromEntries(request.headers)
    });

    if (error) {
      console.error('[CAL_CALLBACK_ERROR]', { error });
      return NextResponse.redirect(new URL('/dashboard/system/cal-auth-code?error=' + encodeURIComponent(error), request.url));
    }

    if (!code) {
      console.error('[CAL_CALLBACK_ERROR] No code received');
      return NextResponse.redirect(new URL('/dashboard/system/cal-auth-code?error=no_code', request.url));
    }

    // Exchange the code for tokens
    console.log('[CAL_CALLBACK_DEBUG] Exchanging code for tokens');
    
    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_CAL_CLIENT_ID || !process.env.CAL_CLIENT_SECRET) {
      console.error('[CAL_CALLBACK_ERROR] Missing required environment variables');
      return NextResponse.redirect(
        new URL('/dashboard/system/cal-auth-code?error=missing_credentials', request.url)
      );
    }

    const tokenEndpoint = 'https://app.cal.com/api/auth/oauth/token';
    const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/cal/auth-code/callback`;
    
    const tokenRequestBody = {
      client_id: process.env.NEXT_PUBLIC_CAL_CLIENT_ID,
      client_secret: process.env.CAL_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    };

    console.log('[CAL_CALLBACK_DEBUG] Token request details:', {
      tokenEndpoint,
      clientIdPresent: !!process.env.NEXT_PUBLIC_CAL_CLIENT_ID,
      clientSecretPresent: !!process.env.CAL_CLIENT_SECRET,
      redirectUri,
      requestUrl: request.url,
      appUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    });

    try {
      const tokenResponse = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(tokenRequestBody),
      });

      const responseBody = await tokenResponse.text();
      let tokens;
      
      try {
        tokens = JSON.parse(responseBody);
      } catch (e) {
        console.error('[CAL_TOKEN_PARSE_ERROR]', { 
          responseBody, 
          error: e,
          stack: e instanceof Error ? e.stack : undefined 
        });
        return NextResponse.redirect(
          new URL(`/dashboard/system/cal-auth-code?error=invalid_response&details=invalid_json_response`, request.url)
        );
      }

      if (!tokenResponse.ok) {
        console.error('[CAL_TOKEN_ERROR]', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          responseBody,
          redirectUri,
          responseHeaders: Object.fromEntries(tokenResponse.headers.entries())
        });
        
        // Extract error message from tokens if possible
        const errorMessage = tokens?.error || tokens?.error_description || 'Token exchange failed';
        return NextResponse.redirect(
          new URL(`/dashboard/system/cal-auth-code?error=token_error&details=${encodeURIComponent(errorMessage)}`, request.url)
        );
      }

      if (!tokens || !tokens.access_token) {
        console.error('[CAL_TOKEN_ERROR] Invalid token response', { responseBody });
        return NextResponse.redirect(
          new URL('/dashboard/system/cal-auth-code?error=invalid_token_response', request.url)
        );
      }

      console.log('[CAL_CALLBACK_DEBUG] Successfully exchanged code for tokens');

      // Redirect back to the auth page with the tokens
      const successUrl = new URL('/dashboard/system/cal-auth-code', request.url);
      successUrl.searchParams.set('success', 'true');
      successUrl.searchParams.set('access_token', tokens.access_token);
      successUrl.searchParams.set('refresh_token', tokens.refresh_token || '');
      
      return NextResponse.redirect(successUrl);
    } catch (error) {
      console.error('[CAL_AUTH_CALLBACK_ERROR]', {
        error,
        stack: error instanceof Error ? error.stack : undefined
      });
      return NextResponse.redirect(
        new URL('/dashboard/system/cal-auth-code?error=callback_error', request.url)
      );
    }
  } catch (error) {
    console.error('[CAL_AUTH_CALLBACK_ERROR]', error);
    return NextResponse.redirect(new URL('/dashboard/system/cal-auth-code?error=callback_error', request.url));
  }
} 