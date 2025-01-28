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
      expiresAt: string
      organizationUrl: string
    }

    let accessToken = integration.accessToken
    const expiresAt = integration.expiresAt ? new Date(integration.expiresAt) : null

    // Refresh if token is expired or will expire in the next 5 minutes
    if (!expiresAt || expiresAt.getTime() - now.getTime() <= 5 * 60 * 1000) {
      try {
        console.log('[CALENDLY_TOKEN] Refreshing token that expires at:', expiresAt)
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
          const errorData = await refreshResponse.json().catch(() => null)
          console.error('[CALENDLY_REFRESH_ERROR]', errorData)
          
          // If refresh token is invalid, clean up the integration
          if (errorData?.error === 'invalid_grant') {
            const { error: deleteError } = await supabase
              .from('CalendlyIntegration')
              .delete()
              .eq('userDbId', dbUser.id)

            if (deleteError) {
              console.error('[CALENDLY_CLEANUP_ERROR] Failed to delete invalid integration:', deleteError)
            } else {
              console.log('[CALENDLY_CLEANUP] Removed invalid integration for userDbId:', dbUser.id)
            }
            return new NextResponse('Calendly connection expired. Please reconnect your account.', { status: 401 })
          }
          
          throw new Error('Failed to refresh token: ' + (errorData?.error_description || 'Unknown error'))
        }

        const refreshData = await refreshResponse.json()
        accessToken = refreshData.access_token

        // Update tokens in database
        const { error: updateError } = await supabase
          .from('CalendlyIntegration')
          .update({
            accessToken: refreshData.access_token,
            refreshToken: refreshData.refresh_token,
            expiresAt: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          })
          .eq('userDbId', dbUser.id)

        if (updateError) {
          console.error('[CALENDLY_DB_ERROR] Failed to update tokens:', updateError)
          throw new Error('Failed to update tokens in database')
        }
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