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
    const accessToken = searchParams.get('access_token')
    
    if (!accessToken) {
      return new NextResponse('Missing access token', { status: 400 })
    }

    // Get user's Calendly information
    const userResponse = await fetch('https://api.calendly.com/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
        accessToken,
        organizationUrl: userData.resource.current_organization,
        schedulingUrl: userData.resource.scheduling_url,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
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