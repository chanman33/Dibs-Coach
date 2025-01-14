import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { generateCodeVerifier, generateCodeChallenge } from '@/utils/pkce'

const REQUIRED_SCOPES = [
  'default',  // Basic user info
  'webhook_subscriptions:write',  // Create webhook subscriptions
  'scheduling_links:read',  // Read scheduling links
  'organizations:read',  // Read organization info
  'user_availability:read'  // Read user availability
]

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Generate PKCE values
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)

    // Combine userId and verifier in state
    const state = JSON.stringify({
      userId,
      verifier: codeVerifier,
      timestamp: Date.now()  // Add timestamp for additional security
    })
    const encodedState = Buffer.from(state).toString('base64')

    if (!process.env.CALENDLY_CLIENT_ID || !process.env.CALENDLY_REDIRECT_URI) {
      console.error('[CALENDLY_AUTH_ERROR] Missing required environment variables')
      return new NextResponse('Configuration error', { status: 500 })
    }

    // Create response with auth URL
    const authUrl = `https://auth.calendly.com/oauth/authorize?${new URLSearchParams({
      client_id: process.env.CALENDLY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: process.env.CALENDLY_REDIRECT_URI,
      scope: REQUIRED_SCOPES.join(' '),
      state: encodedState,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    }).toString()}`

    console.log('[CALENDLY_AUTH] Initiating OAuth flow:', { 
      userId,
      scopes: REQUIRED_SCOPES,
      redirectUri: process.env.CALENDLY_REDIRECT_URI 
    })

    return NextResponse.json({ 
      authUrl,
      scopes: REQUIRED_SCOPES,
      state: encodedState 
    })
  } catch (error) {
    console.error('[CALENDLY_AUTH_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 