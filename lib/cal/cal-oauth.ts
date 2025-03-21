import { calConfig } from './cal';
import { env } from '../env';

interface CalOAuthToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export const calOAuthClient = {
  clientId: env.NEXT_PUBLIC_CAL_CLIENT_ID,
  clientSecret: env.CAL_CLIENT_SECRET,
  organizationId: env.NEXT_PUBLIC_CAL_ORGANIZATION_ID,

  // Generate OAuth URL for user authorization
  getAuthUrl() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: calConfig.redirectUrl,
      response_type: 'code',
      scope: 'calendar availability:read availability:write',
      organization_id: this.organizationId,
    });

    return `https://api.cal.com/oauth/authorize?${params.toString()}`;
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
  async refreshToken(refreshToken: string): Promise<CalOAuthToken> {
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