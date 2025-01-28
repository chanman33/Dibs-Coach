import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { CalendlyService } from '../../../../lib/calendly/calendly-service'
import { env } from '../../../../lib/env'

export const maxDuration = 300 // 5 minutes max execution time

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Initialize Supabase client
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_KEY,
      {
        cookies: {
          get(name: string) {
            return null
          },
          set(name: string, value: string, options: any) {
            // No-op
          },
          remove(name: string, options: any) {
            // No-op
          },
        },
      }
    )

    // Find users with expired or missing availability cache
    const { data: usersToSync, error: fetchError } = await supabase
      .from('CalendlyIntegration')
      .select(`
        userDbId,
        accessToken,
        CalendlyAvailabilityCache (
          expiresAt
        )
      `)
      .eq('status', 'active')
      .or('CalendlyAvailabilityCache.is.null,CalendlyAvailabilityCache.expiresAt.lt.now()')

    if (fetchError) {
      console.error('[CALENDLY_SYNC_ERROR] Failed to fetch users:', fetchError)
      return new NextResponse('Failed to fetch users', { status: 500 })
    }

    if (!usersToSync?.length) {
      return NextResponse.json({ message: 'No availability to sync' })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Process each user
    for (const user of usersToSync) {
      try {
        const calendlyService = new CalendlyService()
        
        // Fetch user's availability and event types using access token
        const [availability, eventTypes] = await Promise.all([
          calendlyService.getUserAvailability(user.accessToken),
          calendlyService.getEventTypes(user.accessToken)
        ])

        // Update or insert availability cache
        const { error: upsertError } = await supabase
          .from('CalendlyAvailabilityCache')
          .upsert({
            userDbId: user.userDbId,
            data: {
              availability,
              eventTypes,
              lastSyncedAt: new Date().toISOString()
            },
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            updatedAt: new Date().toISOString(),
          })

        if (upsertError) throw upsertError

        results.success++

      } catch (error) {
        console.error('[CALENDLY_SYNC_ERROR] Failed to sync user:', user.userDbId, error)
        results.failed++
        results.errors.push(`Failed to sync availability for user ${user.userDbId}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('[CALENDLY_SYNC_ERROR] Sync job failed:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// Vercel Cron configuration
export const dynamic = 'force-dynamic'
export const runtime = 'edge' 