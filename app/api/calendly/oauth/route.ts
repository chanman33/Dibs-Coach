import { NextResponse } from 'next/server'
import { generateCodeVerifier, generateCodeChallenge } from '@/utils/pkce'
import { cookies } from 'next/headers'
import { CALENDLY_CONFIG } from '@/lib/calendly/calendly-config'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { ApiResponse } from '@/utils/types/calendly'

export const GET = withApiAuth(async (req, { userUlid }) => {
  try {
    // Get the redirect URL from query params
    const { searchParams } = new URL(req.url)
    const redirectUrl = searchParams.get('redirect')
    
    if (!redirectUrl) {
      const error = {
        code: 'MISSING_REDIRECT',
        message: 'Missing redirect URL'
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 400 })
    }

    // Validate required configuration
    if (!CALENDLY_CONFIG.oauth.clientId || !CALENDLY_CONFIG.oauth.redirectUri) {
      console.error('[CALENDLY_AUTH_ERROR] Missing required configuration')
      const error = {
        code: 'MISSING_CONFIG',
        message: 'Missing required configuration'
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 500 })
    }

    // Validate redirect URI format
    try {
      const uri = new URL(CALENDLY_CONFIG.oauth.redirectUri)
      if (uri.toString().endsWith('/')) {
        console.error('[CALENDLY_AUTH_ERROR] Redirect URI should not have trailing slash')
        const error = {
          code: 'INVALID_URI',
          message: 'Invalid redirect URI format'
        }
        return NextResponse.json<ApiResponse<never>>({ 
          data: null, 
          error 
        }, { status: 500 })
      }
    } catch (e) {
      console.error('[CALENDLY_AUTH_ERROR] Invalid redirect URI format:', e)
      const error = {
        code: 'INVALID_URI',
        message: 'Invalid redirect URI format'
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 500 })
    }

    // Generate PKCE values
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)

    // Store code verifier, redirect URL, and user ULID in cookies for callback
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
    cookieStore.set('calendly_user_ulid', userUlid, {
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
      userUlid,
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
    
    // Return the authorization URL
    return NextResponse.json<ApiResponse<{ authUrl: string }>>({ 
      data: { authUrl },
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_AUTH_ERROR]', error)
    const apiError = {
      code: 'AUTH_ERROR',
      message: 'Failed to initialize OAuth flow',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
}) 