import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { generateCodeVerifier, generateCodeChallenge } from '@/utils/pkce'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Generate PKCE values
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)

    // Store code verifier in cookie for callback
    const cookieStore = await cookies()
    cookieStore.set('calendly_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    const params = new URLSearchParams({
      client_id: 'yg_LJx9do9N0qOYeZH6iTQj6vfMA8w2OsPpY6qk7AdI',
      response_type: 'code',
      redirect_uri: 'https://7f3e-172-59-155-40.ngrok-free.app/api/calendly/oauth/callback',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    })

    // Log the authorization URL for debugging
    console.log('[CALENDLY_AUTH_DEBUG] Authorization request:', {
      url: 'https://auth.calendly.com/oauth/authorize',
      params: Object.fromEntries(params.entries()),
      challenge: codeChallenge
    })

    const authUrl = `https://auth.calendly.com/oauth/authorize?${params.toString()}`
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('[CALENDLY_AUTH_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 