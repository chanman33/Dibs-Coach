import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHash, randomBytes } from 'crypto'

function generateCodeVerifier() {
  return randomBytes(32).toString('base64url')
}

function generateCodeChallenge(verifier: string) {
  return createHash('sha256')
    .update(verifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)

    // Store code verifier in cookies for callback verification
    const cookieStore = await cookies()
    cookieStore.set('calendly_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10 // 10 minutes
    })

    const params = new URLSearchParams({
      client_id: process.env.CALENDLY_CLIENT_ID!,
      response_type: 'code',
      redirect_uri: process.env.CALENDLY_REDIRECT_URI!,
      scope: 'default',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    })

    const authUrl = `https://auth.calendly.com/oauth/authorize?${params.toString()}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('[CALENDLY_OAUTH_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 