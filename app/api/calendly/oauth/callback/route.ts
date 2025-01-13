import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const CALENDLY_AUTH_BASE = 'https://auth.calendly.com'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const encodedState = searchParams.get('state')
    
    if (!code || !encodedState) {
      return new NextResponse('Invalid authorization response', { status: 400 })
    }

    // Decode and parse state
    let state;
    try {
      const decodedState = Buffer.from(encodedState, 'base64').toString()
      state = JSON.parse(decodedState)
      console.log('[CALENDLY_AUTH] Decoded state:', state)
    } catch (error) {
      console.error('[CALENDLY_AUTH_ERROR] Failed to decode state:', error)
      return new NextResponse('Invalid state parameter', { status: 400 })
    }

    const { userId, verifier: codeVerifier } = state
    if (!userId || !codeVerifier) {
      return new NextResponse('Invalid state content', { status: 400 })
    }

    // Exchange code for access token with PKCE
    console.log('[CALENDLY_AUTH] Sending token request:', {
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: process.env.CALENDLY_REDIRECT_URI,
    })

    // Create Basic Auth header
    const basicAuth = Buffer.from(
      `${process.env.CALENDLY_CLIENT_ID}:${process.env.CALENDLY_CLIENT_SECRET}`
    ).toString('base64')

    const tokenResponse = await fetch(`${CALENDLY_AUTH_BASE}/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
        redirect_uri: process.env.CALENDLY_REDIRECT_URI!,
      }).toString(),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('[CALENDLY_AUTH_ERROR] Token exchange failed:', errorText)
      return new NextResponse('Failed to exchange authorization code', { status: 500 })
    }

    const { access_token, refresh_token, expires_in } = await tokenResponse.json()

    // Get user's Calendly information
    const userResponse = await fetch('https://api.calendly.com/users/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error('[CALENDLY_AUTH_ERROR] Failed to fetch user info:', await userResponse.text())
      return new NextResponse('Failed to fetch user info', { status: 500 })
    }

    const userData = await userResponse.json()

    // Initialize Supabase client
    const cookieStore = await cookies()
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
      return new NextResponse('User not found', { status: 404 })
    }

    // Store the integration data
    const { error } = await supabase
      .from('CalendlyIntegration')
      .upsert({
        userDbId: user.id,
        accessToken: access_token,
        refreshToken: refresh_token,
        organizationUrl: userData.resource.current_organization,
        schedulingUrl: userData.resource.scheduling_url,
        expiresAt: new Date(Date.now() + expires_in * 1000).toISOString(),
      })

    if (error) {
      console.error('[CALENDLY_AUTH_ERROR] Failed to store integration:', error)
      return new NextResponse('Failed to store integration data', { status: 500 })
    }

    // Redirect to success page
    return NextResponse.redirect(`${process.env.FRONTEND_URL}/dashboard/settings/calendly?calendly=success`)
  } catch (error) {
    console.error('[CALENDLY_AUTH_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 