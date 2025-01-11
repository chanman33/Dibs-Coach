'use server'

import { KJUR } from 'jsrsasign'

/**
 * Generates a JWT signature for Zoom Video SDK
 * @param sessionName - Unique session identifier
 * @param role - User role (0: attendee, 1: host)
 * @returns JWT token string
 */
export async function generateZoomSignature(sessionName: string, role: number): Promise<string> {
  if (!process.env.ZOOM_SDK_KEY || !process.env.ZOOM_SDK_SECRET) {
    throw new Error('Missing required Zoom SDK credentials')
  }

  const iat = Math.round(new Date().getTime() / 1000) - 30
  const exp = iat + 60 * 60 * 2 // 2 hours expiration

  const oHeader = { alg: 'HS256', typ: 'JWT' }
  const sdkKey = process.env.ZOOM_SDK_KEY
  const sdkSecret = process.env.ZOOM_SDK_SECRET

  const oPayload = {
    app_key: sdkKey,
    tpc: sessionName,
    role_type: role,
    version: 1,
    iat: iat,
    exp: exp,
  }

  const sHeader = JSON.stringify(oHeader)
  const sPayload = JSON.stringify(oPayload)
  
  try {
    const sdkJWT = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, sdkSecret)
    return sdkJWT
  } catch (error) {
    console.error('[ZOOM_TOKEN_ERROR]', error)
    throw new Error('Failed to generate Zoom signature')
  }
}

/**
 * Gets a Zoom Video SDK token for a session
 * @param slug - Session identifier
 * @returns JWT token for the session
 */
export async function getZoomToken(slug: string) {
  try {
    const JWT = await generateZoomSignature(slug, 1) // Default as host
    return JWT
  } catch (error) {
    console.error('[ZOOM_TOKEN_ERROR]', error)
    throw error
  }
} 