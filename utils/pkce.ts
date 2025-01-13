import { createHash, randomBytes } from 'crypto'

export function generateCodeVerifier() {
  return randomBytes(32)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 128)
}

export function generateCodeChallenge(verifier: string) {
  return createHash('sha256')
    .update(verifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
} 