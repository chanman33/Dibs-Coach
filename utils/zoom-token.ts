import { createHmac } from 'crypto';

interface TokenPayload {
  app_key: string;
  tpc: string;
  version: number;
  role_type: number;
  user_identity?: string;
  session_key?: string;
  geo_regions?: string[];
  iat: number;
  exp: number;
}

// Generate a Video SDK token
export const generateVideoToken = async (sessionName: string): Promise<string> => {
  if (!process.env.ZOOM_SDK_KEY || !process.env.ZOOM_SDK_SECRET) {
    throw new Error('Zoom SDK credentials are not configured');
  }

  const iat = Math.round(new Date().getTime() / 1000);
  const exp = iat + 60 * 60 * 2; // Token expires in 2 hours

  const payload: TokenPayload = {
    app_key: process.env.ZOOM_SDK_KEY,
    tpc: sessionName,
    version: 1,
    role_type: 1, // 1 for host
    user_identity: '', // Optional: Add user identity if needed
    iat,
    exp,
  };

  // Create token header
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  // Encode header and payload
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  // Create signature
  const signature = createHmac('sha256', process.env.ZOOM_SDK_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  // Combine to create JWT
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}; 