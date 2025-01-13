import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    
    if (!code) {
      return new NextResponse('Missing authorization code', { status: 400 })
    }

    // Get the code verifier from cookies
    const cookieStore = await cookies()
    const codeVerifier = cookieStore.get('calendly_code_verifier')?.value

    if (!codeVerifier) {
      return new NextResponse('Missing code verifier', { status: 400 })
    }

    // Exchange the code for tokens
    const tokenResponse = await fetch('https://auth.calendly.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.CALENDLY_CLIENT_ID!,
        client_secret: process.env.CALENDLY_CLIENT_SECRET!,
        code,
        redirect_uri: process.env.CALENDLY_REDIRECT_URI!,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier
      }),
    })

    if (!tokenResponse.ok) {
      console.error('[CALENDLY_OAUTH_ERROR] Token exchange failed:', await tokenResponse.text())
      return new NextResponse('Failed to exchange token', { status: 500 })
    }

    const tokenData = await tokenResponse.json()

    // Get user's Calendly information
    const userResponse = await fetch('https://api.calendly.com/users/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error('[CALENDLY_OAUTH_ERROR] Failed to fetch user info:', await userResponse.text())
      return new NextResponse('Failed to fetch user info', { status: 500 })
    }

    const userData = await userResponse.json()

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
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.delete({ name, ...options })
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
      return new NextResponse('User not found', { status: 404 })
    }

    // Store the integration data
    const { error } = await supabase
      .from('CalendlyIntegration')
      .upsert({
        userDbId: user.id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        scope: tokenData.scope,
        organizationUrl: userData.resource.current_organization,
        schedulingUrl: userData.resource.scheduling_url,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      })

    if (error) {
      console.error('[CALENDLY_OAUTH_ERROR] Failed to store integration:', error)
      return new NextResponse('Failed to store integration data', { status: 500 })
    }

    // Clean up the code verifier cookie
    cookieStore.delete('calendly_code_verifier')

    // Redirect to success page
    return NextResponse.redirect(`${process.env.FRONTEND_URL}/dashboard/settings/calendly?calendly=success`)
  } catch (error) {
    console.error('[CALENDLY_OAUTH_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 