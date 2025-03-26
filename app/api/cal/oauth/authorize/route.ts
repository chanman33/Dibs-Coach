import { NextResponse } from 'next/server';
import { calOAuthClient } from '@/lib/cal/cal-oauth';
import { auth } from '@clerk/nextjs';

export async function GET(request: Request) {
  try {
    // Get the user ID from Clerk
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get redirect URLs from query parameters
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get('redirect') || '/dashboard/settings?tab=integrations&success=true';
    const errorRedirectUrl = searchParams.get('error_redirect') || '/dashboard/settings?tab=integrations&error=true';

    // Generate state parameter to include redirect URLs (prevents CSRF)
    const state = Buffer.from(JSON.stringify({
      userId,
      redirectUrl,
      errorRedirectUrl
    })).toString('base64');

    // Generate the authorization URL
    const authUrl = calOAuthClient.getAuthUrl(state);

    // Redirect the user to Cal.com OAuth page
    console.log('[CAL_OAUTH_AUTHORIZE] Redirecting to Cal.com OAuth', {
      userId,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[CAL_OAUTH_AUTHORIZE_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    });
    
    // In case of error, redirect to the error page
    return NextResponse.redirect('/dashboard/settings?tab=integrations&error=true');
  }
} 