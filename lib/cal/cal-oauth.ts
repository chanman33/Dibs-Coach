import { calConfig } from './cal';
import { env } from '../env';

interface CalOAuthToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Cal.com OAuth client for authorization and token exchange
 * Note: For token refresh operations, please use the centralized token service
 * in utils/auth/token-service.ts instead of the methods here.
 */
export const calOAuthClient = {
  clientId: env.NEXT_PUBLIC_CAL_CLIENT_ID || '',
  clientSecret: env.CAL_CLIENT_SECRET || '',
  organizationId: env.NEXT_PUBLIC_CAL_ORGANIZATION_ID || '',

  // Generate OAuth URL for user authorization
  getAuthUrl(state?: string) {
    const params = new URLSearchParams();
    
    // Add required parameters
    params.append('client_id', this.clientId);
    params.append('redirect_uri', calConfig.redirectUrl);
    params.append('response_type', 'code');
    params.append('scope', 'calendar availability:read availability:write');
    
    // Ensure organizationId is not empty before adding it
    if (this.organizationId) {
      params.append('organization_id', this.organizationId);
    }
    
    // Add state parameter if provided
    if (state) {
      params.append('state', state);
    }

    // Use app.cal.com instead of api.cal.com for OAuth
    return `https://app.cal.com/auth/oauth?${params.toString()}`;
  },

  // Exchange authorization code for access token
  async getAccessToken(code: string): Promise<CalOAuthToken> {
    const response = await fetch('https://api.cal.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: calConfig.redirectUrl,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    return response.json();
  },

  // Refresh access token
  // @deprecated Use the centralized token refresh service in utils/auth/token-service.ts instead
  async refreshToken(refreshToken: string): Promise<CalOAuthToken> {
    console.warn('[DEPRECATED] Using deprecated refreshToken method. Please use utils/auth/token-service.ts instead.');
    
    const response = await fetch('https://api.cal.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    return response.json();
  },
}; 