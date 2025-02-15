import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { CircuitBreaker } from '@/lib/calendly/circuit-breaker'
import { RetryManager } from '@/lib/calendly/retry-manager'
import { env } from '@/lib/env'
import { ApiResponse } from '@/utils/types/api'

// Vercel Cron authentication
const CRON_SECRET = env.CRON_SECRET

// Circuit breaker for managing failed refresh attempts
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 60 * 60 * 1000, // 1 hour
})

// Retry manager for handling refresh retries
const retryManager = new RetryManager({
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
})

interface RefreshResults {
  success: number
  failed: number
  errors: string[]
}

export const maxDuration = 300 // 5 minutes max execution time

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid cron secret'
        }
      }, { status: 401 })
    }

    // Initialize Supabase client for server-side cron
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_KEY,
      {
        cookies: {
          get(name: string) {
            return null // No cookies needed for cron job
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

    // Find tokens that expire in the next hour
    const { data: expiredTokens, error: fetchError } = await supabase
      .from('CalendlyIntegration')
      .select(`
        ulid,
        userUlid,
        accessToken,
        refreshToken,
        expiresAt,
        status,
        failedRefreshCount
      `)
      .eq('status', 'active')
      .lt('expiresAt', new Date(Date.now() + 60 * 60 * 1000).toISOString()) // Tokens expiring in next hour
      .order('expiresAt', { ascending: true })

    if (fetchError) {
      console.error('[CALENDLY_REFRESH_ERROR] Failed to fetch expired tokens:', fetchError)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch tokens',
          details: fetchError
        }
      }, { status: 500 })
    }

    if (!expiredTokens?.length) {
      return NextResponse.json<ApiResponse<RefreshResults>>({
        data: { success: 0, failed: 0, errors: [] },
        error: null
      })
    }

    const calendlyService = new CalendlyService()
    const results: RefreshResults = {
      success: 0,
      failed: 0,
      errors: [],
    }

    // Process each token
    for (const integration of expiredTokens) {
      try {
        // Check circuit breaker
        if (circuitBreaker.isOpen()) {
          console.warn('[CALENDLY_REFRESH_WARN] Circuit breaker is open, skipping refresh')
          break
        }

        // Attempt token refresh with retry
        let attempt = 0
        let success = false
        
        while (!success && retryManager.shouldRetry(null, attempt)) {
          try {
            const newToken = await calendlyService.refreshToken(integration.refreshToken)
            
            // Update token in database
            const { error: updateError } = await supabase
              .from('CalendlyIntegration')
              .update({
                accessToken: newToken.access_token,
                refreshToken: newToken.refresh_token,
                expiresAt: new Date(Date.now() + newToken.expires_in * 1000).toISOString(),
                failedRefreshCount: 0,
                updatedAt: new Date().toISOString(),
              })
              .eq('ulid', integration.ulid)

            if (updateError) throw updateError

            success = true
            results.success++
            circuitBreaker.recordSuccess()

          } catch (error) {
            attempt++
            if (!retryManager.shouldRetry(error instanceof Error ? error : new Error(String(error)), attempt)) {
              throw error
            }
            await new Promise(resolve => setTimeout(resolve, retryManager.getBackoffTime(attempt)))
          }
        }

      } catch (error) {
        console.error('[CALENDLY_REFRESH_ERROR] Failed to refresh token:', {
          integrationUlid: integration.ulid,
          userUlid: integration.userUlid,
          error
        })
        results.failed++
        results.errors.push(`Failed to refresh token for integration ${integration.ulid}: ${error instanceof Error ? error.message : String(error)}`)
        circuitBreaker.recordFailure()

        // Update integration status
        await supabase
          .from('CalendlyIntegration')
          .update({
            status: 'error',
            failedRefreshCount: integration.failedRefreshCount + 1,
            updatedAt: new Date().toISOString(),
          })
          .eq('ulid', integration.ulid)
      }
    }

    return NextResponse.json<ApiResponse<RefreshResults>>({
      data: results,
      error: null
    })

  } catch (error) {
    console.error('[CALENDLY_REFRESH_ERROR] Cron job failed:', error)
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Cron job failed',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
}

// Vercel Cron configuration
export const dynamic = 'force-dynamic'
export const runtime = 'edge'