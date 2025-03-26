import { NextResponse } from 'next/server'
import { calConfig } from '@/lib/cal/cal'

export async function GET() {
  try {
    const clientId = calConfig.clientId || process.env.NEXT_PUBLIC_CAL_CLIENT_ID || ''
    
    // Use the specific callback URL that was registered with Cal.com
    // This should match exactly what you configured in Cal.com app settings
    const redirectUrl = `${process.env.FRONTEND_URL}/callback` || 'http://localhost:3000/callback'
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Cal.com client ID is not configured' },
        { status: 400 }
      )
    }
    
    console.log('[CAL_AUTH_URL]', { 
      clientId, 
      redirectUrl,
      frontendUrl: process.env.FRONTEND_URL 
    })
    
    // Create authorization URL - using the correct Cal.com OAuth endpoint
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUrl,
      response_type: 'code',
      scope: 'availability:read availability:write bookings:read bookings:write',
    })
    
    // Cal.com OAuth uses app.cal.com domain, not api.cal.com
    const authUrl = `https://app.cal.com/auth/oauth?${params.toString()}`
    
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('[CAL_AUTH_URL_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    )
  }
} 