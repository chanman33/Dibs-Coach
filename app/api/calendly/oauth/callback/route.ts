import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CALENDLY_CONFIG } from '@/lib/calendly/calendly-config'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}/dashboard/settings/calendly?error=${encodeURIComponent('Authentication required')}`
      )
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    if (error) {
      console.error('[CALENDLY_AUTH_ERROR] OAuth error:', error, errorDescription)
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}/dashboard/settings/calendly?error=${encodeURIComponent(errorDescription || error)}`
      )
    }
    
    if (!code) {
      return new NextResponse('Missing authorization code', { status: 400 })
    }

    // Exchange code for token using Basic Auth
    const cookieStore = await cookies()
    const codeVerifier = cookieStore.get('calendly_verifier')?.value
    
    if (!codeVerifier) {
      console.error('[CALENDLY_AUTH_ERROR] Missing code verifier')
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}/dashboard/settings/calendly?error=${encodeURIComponent('Missing code verifier')}`
      )
    }

    // Validate required environment variables and redirect URI format
    const redirectUri = 'https://7f3e-172-59-155-40.ngrok-free.app/api/calendly/oauth/callback'
    
    // Validate redirect URI format
    try {
      const uri = new URL(redirectUri)
      if (uri.toString().endsWith('/')) {
        console.error('[CALENDLY_AUTH_ERROR] Redirect URI should not have trailing slash')
        return NextResponse.redirect(
          `${process.env.FRONTEND_URL}/dashboard/settings/calendly?error=${encodeURIComponent('Invalid redirect URI format')}`
        )
      }
    } catch (e) {
      console.error('[CALENDLY_AUTH_ERROR] Invalid redirect URI format:', e)
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}/dashboard/settings/calendly?error=${encodeURIComponent('Invalid redirect URI format')}`
      )
    }

    // Get client configuration based on environment
    const clientId = CALENDLY_CONFIG.CLIENT.id
    if (!clientId) {
      console.error('[CALENDLY_AUTH_ERROR] Missing client ID')
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}/dashboard/settings/calendly?error=${encodeURIComponent('Missing client configuration')}`
      )
    }

    // Prepare token exchange request exactly as per docs
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier
    })

    // Enhanced debug logging
    console.log('[CALENDLY_AUTH_DEBUG] Full request details:', {
      url: `${CALENDLY_CONFIG.OAUTH_BASE_URL}/token`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      params: Object.fromEntries(tokenParams.entries()),
      code: code,
      redirectUri: {
        exact: redirectUri,
        hasTrailingSlash: redirectUri.endsWith('/'),
        length: redirectUri.length
      },
      pkce: {
        verifier: codeVerifier.substring(0, 10) + '...',
        verifierLength: codeVerifier.length
      }
    })

    const tokenResponse = await fetch(`${CALENDLY_CONFIG.OAUTH_BASE_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenParams.toString()
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: 'unknown_error', error_description: errorText };
      }

      // Log detailed error information
      console.error('[CALENDLY_AUTH_ERROR] Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData
      });

      // Handle specific error cases
      let userMessage = '';
      switch (errorData.error) {
        // 400 Bad Request errors
        case 'invalid_request':
          userMessage = 'The request was malformed or missing required parameters';
          break;
        case 'invalid_grant':
          userMessage = 'The authorization code is invalid or expired';
          break;
        case 'unsupported_grant_type':
          userMessage = 'The grant type is not supported';
          break;
        
        // 401 Unauthorized errors
        case 'invalid_client':
          userMessage = 'Client authentication failed. Please check your client ID';
          break;
        case 'unauthorized_client':
          userMessage = 'The client is not authorized to use this grant type';
          break;
        
        default:
          userMessage = errorData.error_description || 'An unknown error occurred';
      }

      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}/dashboard/settings/calendly?error=${encodeURIComponent(userMessage)}&details=${encodeURIComponent(errorData.error_description || '')}`
      )
    }

    const tokenData = await tokenResponse.json()
    
    const { access_token, refresh_token, expires_in, scope } = tokenData

    if (!access_token || !refresh_token) {
      console.error('[CALENDLY_AUTH_ERROR] Missing tokens in response:', tokenData)
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}/dashboard/settings/calendly?error=${encodeURIComponent('Invalid token response: Missing required tokens')}`
      )
    }

    // Get user's Calendly information
    const userResponse = await fetch('https://api.calendly.com/users/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error('[CALENDLY_AUTH_ERROR] Failed to fetch user info:', errorText)
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}/dashboard/settings/calendly?error=${encodeURIComponent('Failed to fetch user info')}`
      )
    }

    const userData = await userResponse.json()
    if (!userData.resource) {
      console.error('[CALENDLY_AUTH_ERROR] Invalid user data:', userData)
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}/dashboard/settings/calendly?error=${encodeURIComponent('Invalid user data')}`
      )
    }

    // Initialize Supabase client
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // We don't need to set cookies in this flow anymore
          },
          remove(name: string, options: any) {
            // We don't need to remove cookies in this flow anymore
          },
        },
      }
    )

    // Get user's database ID using userId from state
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single()

    if (userError || !user) {
      console.error('[CALENDLY_AUTH_ERROR] User not found:', userError)
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}/dashboard/settings/calendly?error=${encodeURIComponent('User not found')}`
      )
    }

    // Store the integration data
    const { error: integrationError } = await supabase
      .from('CalendlyIntegration')
      .upsert({
        userDbId: user.id,
        accessToken: access_token,
        refreshToken: refresh_token,
        scope: scope || 'default',
        organizationUrl: userData.resource.current_organization,
        schedulingUrl: userData.resource.scheduling_url,
        expiresAt: new Date(Date.now() + expires_in * 1000).toISOString(),
      })

    if (integrationError) {
      console.error('[CALENDLY_AUTH_ERROR] Failed to store integration:', integrationError)
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}/dashboard/settings/calendly?error=${encodeURIComponent('Failed to store integration data')}`
      )
    }

    // Redirect to success page
    return NextResponse.redirect(`${process.env.FRONTEND_URL}/dashboard/settings/calendly?calendly=success`)
  } catch (error) {
    console.error('[CALENDLY_AUTH_ERROR]', error)
    return NextResponse.redirect(
      `${process.env.FRONTEND_URL}/dashboard/settings/calendly?error=${encodeURIComponent('Internal Server Error')}`
    )
  }
} 