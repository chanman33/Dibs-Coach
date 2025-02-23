import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { CALENDLY_CONFIG } from './calendly-config'

export class CalendlyAuthManager {
  private accessToken?: string
  private refreshToken?: string

  async initialize() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { userId } = await auth()
    if (!userId) throw new Error('User not authenticated')

    // Get user's database ID
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()

    if (userError || !user) {
      throw new Error('User not found')
    }

    // Get Calendly integration
    const { data: integration, error: integrationError } = await supabase
      .from('CalendlyIntegration')
      .select('accessToken, refreshToken')
      .eq('userUlid', user.ulid)
      .single()

    if (integrationError || !integration) {
      throw new Error('Failed to get Calendly tokens')
    }

    this.accessToken = integration.accessToken
    this.refreshToken = integration.refreshToken

    return this.accessToken
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch(`${CALENDLY_CONFIG.oauth.baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CALENDLY_CONFIG.oauth.clientId,
        client_secret: CALENDLY_CONFIG.oauth.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const data = await response.json()
    
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { userId } = await auth()
    if (!userId) throw new Error('User not authenticated')

    const { data: user, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()

    if (userError || !user) {
      throw new Error('User not found')
    }

    // Update tokens
    const { error: updateError } = await supabase
      .from('CalendlyIntegration')
      .update({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        updatedAt: new Date().toISOString()
      })
      .eq('userUlid', user.ulid)

    if (updateError) {
      throw new Error('Failed to update tokens')
    }

    this.accessToken = data.access_token
    this.refreshToken = data.refresh_token

    return this.accessToken
  }

  getAccessToken() {
    return this.accessToken
  }
} 