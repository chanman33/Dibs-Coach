import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { generateCodeVerifier, generateCodeChallenge } from '@/utils/pkce'

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
      verifier: codeVerifier
    })
    const encodedState = Buffer.from(state).toString('base64')

    // Create response with auth URL
    const authUrl = `https://auth.calendly.com/oauth/authorize?${new URLSearchParams({
      client_id: process.env.CALENDLY_CLIENT_ID!,
      response_type: 'code',
      redirect_uri: process.env.CALENDLY_REDIRECT_URI!,
      scope: 'default',
      state: encodedState,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    }).toString()}`

    console.log('[CALENDLY_AUTH] Generated state with verifier:', { userId, verifier: codeVerifier })

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('[CALENDLY_AUTH_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 