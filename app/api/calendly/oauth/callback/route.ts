import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CALENDLY_CONFIG, isDevelopment } from '@/lib/calendly/calendly-config'

// Mock response for development mode
const MOCK_TOKEN_RESPONSE = {
  access_token: 'mock_access_token',
  refresh_token: 'mock_refresh_token',
  expires_in: 7200,
  scope: 'default'
}

const MOCK_USER_RESPONSE = {
  resource: {
    current_organization: 'https://api.calendly.com/organizations/MOCK-ORG',
    scheduling_url: 'https://calendly.com/mock-user',
  }
}

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

    // Validate required configuration
    if (!CALENDLY_CONFIG.oauth.clientId || !CALENDLY_CONFIG.oauth.clientSecret || !CALENDLY_CONFIG.oauth.redirectUri) {
      console.error('[CALENDLY_AUTH_ERROR] Missing required configuration')
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}/dashboard/settings/calendly?error=${encodeURIComponent('Missing required configuration')}`
      )
    }

    // Log the received code and verifier
    console.log('[CALENDLY_AUTH_DEBUG] Received authorization code:', {
      code: `${code?.substring(0, 10)}...`,
      code_length: code?.length,
      verifier: {
        exists: !!codeVerifier,
        length: codeVerifier?.length,
        preview: codeVerifier ? `${codeVerifier.substring(0, 10)}...` : 'none'
      }
    })

    // Prepare token exchange request
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: CALENDLY_CONFIG.oauth.redirectUri,
      client_id: CALENDLY_CONFIG.oauth.clientId,
      code_verifier: codeVerifier
    })

    // Create Basic Auth header
    const basicAuth = Buffer.from(`${CALENDLY_CONFIG.oauth.clientId}:${CALENDLY_CONFIG.oauth.clientSecret}`).toString('base64')

    // Log token request details (excluding sensitive data)
    console.log('[CALENDLY_AUTH_DEBUG] Token request:', {
      url: `${CALENDLY_CONFIG.oauth.baseUrl}/token`,
      params: {
        grant_type: 'authorization_code',
        redirect_uri: CALENDLY_CONFIG.oauth.redirectUri,
        client_id: CALENDLY_CONFIG.oauth.clientId,
        code_verifier_length: codeVerifier.length
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic [REDACTED]'
      }
    })

    let tokenData;
    let userData;

    if (isDevelopment) {
      console.log('[CALENDLY_AUTH_DEBUG] Using development mode with mock responses')
      tokenData = MOCK_TOKEN_RESPONSE
      userData = MOCK_USER_RESPONSE
    } else {
      const tokenResponse = await fetch(`${CALENDLY_CONFIG.oauth.baseUrl}${CALENDLY_CONFIG.oauth.tokenPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basicAuth}`
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

        console.error('[CALENDLY_AUTH_ERROR] Token exchange failed:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: errorData
        });

        let userMessage = '';
        switch (errorData.error) {
          case 'invalid_request':
            userMessage = 'The request was malformed or missing required parameters';
            break;
          case 'invalid_grant':
            userMessage = 'The authorization code is invalid or expired';
            break;
          case 'unsupported_grant_type':
            userMessage = 'The grant type is not supported';
            break;
          case 'invalid_client':
            userMessage = 'Client authentication failed. Please check your client credentials';
            break;
          case 'unauthorized_client':
            userMessage = 'The client is not authorized to use this grant type';
            break;
          default:
            userMessage = errorData.error_description || 'An unknown error occurred';
        }

        return NextResponse.redirect(
          `${process.env.FRONTEND_URL}/dashboard/settings/calendly?error=${encodeURIComponent(userMessage)}`
        )
      }

      tokenData = await tokenResponse.json()
      
      // Get user's Calendly information
      const userResponse = await fetch(`${CALENDLY_CONFIG.api.baseUrl}/users/me`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
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

      userData = await userResponse.json()
    }

    const { access_token, refresh_token, expires_in, scope } = tokenData

    if (!access_token || !refresh_token) {
      console.error('[CALENDLY_AUTH_ERROR] Missing tokens in response:', tokenData)
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}/dashboard/settings/calendly?error=${encodeURIComponent('Invalid token response')}`
      )
    }

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
            // Not needed for this flow
          },
          remove(name: string, options: any) {
            // Not needed for this flow
          },
        },
      }
    )

    // Get user's database ID
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
        // Format dates in ISO format
        expiresAt: new Date(Date.now() + (expires_in * 1000)).toISOString(),
        updatedAt: new Date().toISOString()
      })

    if (integrationError) {
      console.error('[CALENDLY_AUTH_ERROR] Failed to store integration:', integrationError)
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}/dashboard/settings/calendly?error=${encodeURIComponent('Failed to store integration data')}`
      )
    }

    // Clear the code verifier cookie
    cookieStore.delete('calendly_verifier')

    // Redirect to success page
    return NextResponse.redirect(`${process.env.FRONTEND_URL}/dashboard/settings/calendly?calendly=success`)
  } catch (error) {
    console.error('[CALENDLY_AUTH_ERROR]', error)
    return NextResponse.redirect(
      `${process.env.FRONTEND_URL}/dashboard/settings/calendly?error=${encodeURIComponent('Internal Server Error')}`
    )
  }
} 