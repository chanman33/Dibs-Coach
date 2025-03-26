import { NextRequest, NextResponse } from 'next/server'
import { calConfig } from '@/lib/cal/cal'

export async function POST(req: NextRequest) {
  try {
    const { code, redirect_uri } = await req.json()

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 })
    }

    console.log('[CAL_TOKEN_EXCHANGE]', { 
      code: code.substring(0, 5) + '...',
      redirect_uri,
      clientId: calConfig.clientId.substring(0, 5) + '...' 
    })

    // Server has access to the client secret
    // Use app.cal.com domain for OAuth endpoints
    const response = await fetch('https://app.cal.com/auth/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: calConfig.clientId,
        client_secret: calConfig.clientSecret || process.env.CAL_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: redirect_uri || calConfig.redirectUrl,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('[CAL_TOKEN_EXCHANGE_ERROR]', errorData)
      return NextResponse.json(
        { error: 'Failed to exchange code for tokens' },
        { status: response.status }
      )
    }

    const tokenData = await response.json()
    
    // Return the token data to the client
    return NextResponse.json(tokenData)
  } catch (error) {
    console.error('[CAL_TOKEN_EXCHANGE_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to process token exchange' },
      { status: 500 }
    )
  }
} 