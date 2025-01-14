import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function validateCalendlySession(
  request: NextRequest,
  response: NextResponse
) {
  try {
    // Get authenticated user
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get Calendly tokens from Supabase
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            return cookie?.value
          },
        },
      }
    )

    const { data: user, error } = await supabase
      .from('User')
      .select('calendlyAccessToken, calendlyRefreshToken')
      .eq('userId', userId)
      .single()

    if (error || !user?.calendlyAccessToken) {
      console.error('[CALENDLY_AUTH_ERROR]', error || 'No Calendly tokens found')
      return new NextResponse('Calendly not connected', { status: 403 })
    }

    // Add Calendly tokens to request for downstream use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-calendly-access-token', user.calendlyAccessToken)
    requestHeaders.set('x-calendly-refresh-token', user.calendlyRefreshToken)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('[CALENDLY_SESSION_ERROR]', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 