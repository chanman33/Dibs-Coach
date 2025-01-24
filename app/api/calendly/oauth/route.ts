import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { generateCodeVerifier, generateCodeChallenge } from '@/utils/pkce'
import { cookies } from 'next/headers'
import { CALENDLY_CONFIG } from '@/lib/calendly/calendly-config'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get the redirect URL from query params
    const { searchParams } = new URL(request.url)
    const redirectUrl = searchParams.get('redirect')
    
    if (!redirectUrl) {
      return new NextResponse('Missing redirect URL', { status: 400 })
    }

    // Validate required configuration
    if (!CALENDLY_CONFIG.oauth.clientId || !CALENDLY_CONFIG.oauth.redirectUri) {
      console.error('[CALENDLY_AUTH_ERROR] Missing required configuration')
      return new NextResponse('Missing required configuration', { status: 500 })
    }

    // Validate redirect URI format
    try {
      const uri = new URL(CALENDLY_CONFIG.oauth.redirectUri)
      if (uri.toString().endsWith('/')) {
        console.error('[CALENDLY_AUTH_ERROR] Redirect URI should not have trailing slash')
        return new NextResponse('Invalid redirect URI format', { status: 500 })
      }
    } catch (e) {
      console.error('[CALENDLY_AUTH_ERROR] Invalid redirect URI format:', e)
      return new NextResponse('Invalid redirect URI format', { status: 500 })
    }

    // Generate PKCE values
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)

    // Store code verifier and redirect URL in cookies for callback
    const cookieStore = await cookies()
    cookieStore.set('calendly_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 5 * 60 // 5 minutes expiry
    })
    cookieStore.set('calendly_redirect', redirectUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 5 * 60 // 5 minutes expiry
    })

    // Construct authorization parameters
    const params = new URLSearchParams({
      client_id: CALENDLY_CONFIG.oauth.clientId,
      response_type: 'code',
      redirect_uri: CALENDLY_CONFIG.oauth.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    })

    // Log detailed request information for debugging
    console.log('[CALENDLY_AUTH_DEBUG] Authorization request:', {
      url: `${CALENDLY_CONFIG.oauth.baseUrl}${CALENDLY_CONFIG.oauth.authorizePath}`,
      params: {
        client_id: CALENDLY_CONFIG.oauth.clientId,
        redirect_uri: CALENDLY_CONFIG.oauth.redirectUri,
        code_challenge: `${codeChallenge.substring(0, 10)}...`,
        code_challenge_method: 'S256',
        response_type: 'code'
      },
      verifier: {
        length: codeVerifier.length,
        preview: `${codeVerifier.substring(0, 10)}...`
      },
      challenge: {
        length: codeChallenge.length,
        preview: `${codeChallenge.substring(0, 10)}...`
      }
    })

    const authUrl = `${CALENDLY_CONFIG.oauth.baseUrl}${CALENDLY_CONFIG.oauth.authorizePath}?${params.toString()}`
    
    // Log the final URL for verification
    console.log('[CALENDLY_AUTH_DEBUG] Final authorization URL:', authUrl)
    
    // Redirect to Calendly's authorization URL instead of returning it
    return Response.redirect(authUrl)
  } catch (error) {
    console.error('[CALENDLY_AUTH_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 