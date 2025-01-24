import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { BusyTimeFilters } from '@/utils/types/calendly'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Parse query parameters for filters
    const { searchParams } = new URL(request.url)
    const now = new Date()
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    
    const filters: BusyTimeFilters = {
      type: searchParams.get('type') as any || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : now,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : thirtyDaysFromNow,
      calendar: searchParams.get('calendar') || undefined
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    )

    // Get user's database ID and Calendly integration
    const { data: dbUser, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single()

    if (userError || !dbUser) {
      return new NextResponse(userError ? 'Error fetching user data' : 'User not found', { 
        status: userError ? 500 : 404 
      })
    }

    const { data: dbIntegration, error: integrationError } = await supabase
      .from('CalendlyIntegration')
      .select('accessToken, refreshToken, expiresAt, organizationUrl')
      .eq('userDbId', dbUser.id)
      .single()

    if (integrationError || !dbIntegration) {
      return new NextResponse('Calendly integration not found', { status: 404 })
    }

    const integration = dbIntegration as {
      accessToken: string
      refreshToken: string
      expiresAt: number
      organizationUrl: string
    }

    let accessToken = integration.accessToken
    const now_timestamp = Math.floor(Date.now() / 1000)

    if (integration.expiresAt && now_timestamp >= integration.expiresAt) {
      try {
        const refreshResponse = await fetch('https://auth.calendly.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: process.env.CALENDLY_CLIENT_ID!,
            client_secret: process.env.CALENDLY_CLIENT_SECRET!,
            refresh_token: integration.refreshToken,
          }),
        })

        if (!refreshResponse.ok) {
          console.error('[CALENDLY_REFRESH_ERROR]', await refreshResponse.text())
          return new NextResponse('Failed to refresh Calendly token', { status: 401 })
        }

        const refreshData = await refreshResponse.json()
        accessToken = refreshData.access_token

        // Update tokens in database
        await supabase
          .from('CalendlyIntegration')
          .update({
            accessToken: refreshData.access_token,
            refreshToken: refreshData.refresh_token,
            expiresAt: Math.floor(Date.now() / 1000) + refreshData.expires_in,
          })
          .eq('userDbId', dbUser.id)
      } catch (error) {
        console.error('[CALENDLY_REFRESH_ERROR]', error)
        return new NextResponse('Failed to refresh Calendly token', { status: 401 })
      }
    }

    // First get user's URI
    const userResponse = await fetch('https://api.calendly.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error('[CALENDLY_API_ERROR]', errorText)
      if (userResponse.status === 401) {
        return new NextResponse('Calendly authentication expired. Please reconnect your account.', { status: 401 })
      }
      return new NextResponse('Failed to fetch user info', { status: userResponse.status })
    }

    const calendlyUserData = await userResponse.json()
    const userUri = calendlyUserData.resource.uri

    // Get availability schedules
    const schedulesResponse = await fetch(`https://api.calendly.com/user_availability_schedules?user=${userUri}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    })

    if (!schedulesResponse.ok) {
      const errorText = await schedulesResponse.text()
      console.error('[CALENDLY_API_ERROR]', errorText)
      return new NextResponse('Failed to fetch schedules', { status: schedulesResponse.status })
    }

    const schedulesData = await schedulesResponse.json()

    // Get busy times with filters
    const busyTimesUrl = new URL('https://api.calendly.com/user_busy_times')
    busyTimesUrl.searchParams.append('user', userUri)
    busyTimesUrl.searchParams.append('start_time', filters.startDate.toISOString())
    busyTimesUrl.searchParams.append('end_time', filters.endDate.toISOString())
    
    const calendar = filters.calendar
    if (calendar !== undefined && calendar !== '') {
      busyTimesUrl.searchParams.append('calendar_type', calendar as string)
    }

    const busyTimesResponse = await fetch(busyTimesUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    })

    if (!busyTimesResponse.ok) {
      const errorText = await busyTimesResponse.text()
      console.error('[CALENDLY_API_ERROR]', errorText)
      return new NextResponse('Failed to fetch busy times', { status: busyTimesResponse.status })
    }

    const busyTimesData = await busyTimesResponse.json()

    // Filter busy times if type filter is present
    const filteredBusyTimes = filters.type
      ? busyTimesData.collection.filter((time: any) => time.type === filters.type)
      : busyTimesData.collection

    return NextResponse.json({ 
      data: {
        schedules: schedulesData.collection,
        busyTimes: filteredBusyTimes,
        filters: {
          ...filters,
          startDate: filters.startDate.toISOString(),
          endDate: filters.endDate.toISOString()
        }
      }
    })

  } catch (error) {
    console.error('[CALENDLY_SCHEDULES_ERROR]', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 