import { createHash, randomBytes } from 'crypto'

export function generateCodeVerifier() {
  // Generate a code verifier that meets the PKCE requirements:
  // - Between 43 and 128 characters long
  // - Contains only alphanumeric characters plus "_", "-", "."
  // - Base64URL encoded
  const verifier = randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  // Ensure minimum length of 43 characters
  return verifier.padEnd(43, '-')
}

export function generateCodeChallenge(verifier: string) {
  // Generate SHA256 hash of the verifier
  const hash = createHash('sha256')
    .update(verifier)
    .digest('base64')
    
  // Convert to base64URL format
  return hash
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
} 