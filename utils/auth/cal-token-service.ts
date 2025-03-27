'use server';

import { createAuthClient } from '@/utils/auth';
import { revalidatePath } from 'next/cache';

// Use consistent naming with proper fallbacks
const CAL_CLIENT_ID = process.env.CAL_CLIENT_ID || process.env.NEXT_PUBLIC_CAL_CLIENT_ID || '';
const CAL_CLIENT_SECRET = process.env.CAL_CLIENT_SECRET || process.env.X_CAL_SECRET_KEY || '';

/**
 * Response format from Cal.com token refresh operations
 */
interface TokenRefreshResult {
  success: boolean;
  error?: string;
  tokens?: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

/**
 * Refreshes a Cal.com access token using the stored refresh token
 * This is the single source of truth for Cal.com token refresh in the application
 * 
 * @param userUlid The user's ULID to refresh the token for
 * @returns Result of the token refresh operation
 */
export async function refreshCalAccessToken(userUlid: string): Promise<TokenRefreshResult> {
  try {
    console.log('[TOKEN_SERVICE] Attempting to refresh Cal.com token for user:', userUlid);
    
    // Get user's Cal.com integration
    const supabase = createAuthClient();
    const { data: integration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('*')
      .eq('userUlid', userUlid)
      .single();

    if (integrationError || !integration) {
      console.error('[TOKEN_SERVICE_ERROR]', {
        context: 'FETCH_INTEGRATION',
        error: integrationError,
        userUlid,
        timestamp: new Date().toISOString()
      });
      return { success: false, error: 'Integration not found' };
    }

    if (!integration.calRefreshToken) {
      console.error('[TOKEN_SERVICE_ERROR]', {
        context: 'NO_REFRESH_TOKEN',
        userUlid,
        timestamp: new Date().toISOString()
      });
      return { success: false, error: 'No refresh token available' };
    }

    // Make request to Cal.com's token endpoint
    try {
      // Check if we're using a managed user
      const isCalManagedUser = integration.calManagedUserId !== undefined && 
                              integration.calManagedUserId !== null;
      
      // Ensure we have required credentials
      if (!CAL_CLIENT_ID) {
        console.error('[TOKEN_SERVICE_ERROR]', {
          context: 'MISSING_CLIENT_ID',
          userUlid,
          timestamp: new Date().toISOString()
        });
        return { success: false, error: 'Missing CAL_CLIENT_ID in environment variables' };
      }
      
      if (!CAL_CLIENT_SECRET) {
        console.error('[TOKEN_SERVICE_ERROR]', {
          context: 'MISSING_CLIENT_SECRET',
          userUlid,
          timestamp: new Date().toISOString()
        });
        return { success: false, error: 'Missing CAL_CLIENT_SECRET in environment variables' };
      }
      
      let response;
      if (isCalManagedUser) {
        // Use force-refresh endpoint for managed users
        const managedUserEndpoint = `https://api.cal.com/v2/oauth-clients/${CAL_CLIENT_ID}/users/${integration.calManagedUserId}/force-refresh`;
        
        console.log('[TOKEN_SERVICE] Using managed user token refresh endpoint:', { 
          endpoint: managedUserEndpoint,
          managedUserId: integration.calManagedUserId,
          clientId: CAL_CLIENT_ID
        });
        
        response = await fetch(managedUserEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cal-client-id': CAL_CLIENT_ID,
            'x-cal-secret-key': CAL_CLIENT_SECRET
          }
        });
      } else {
        // Use standard OAuth refresh flow
        console.log('[TOKEN_SERVICE] Using standard OAuth refresh flow');
        
        response = await fetch('https://api.cal.com/v2/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_id: CAL_CLIENT_ID,
            client_secret: CAL_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: integration.calRefreshToken
          })
        });
      }

      if (!response.ok) {
        // Attempt to parse the error response
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = errorData?.error?.message || errorData?.message || '';
        } catch {
          // Unable to parse error response, continue with status code only
        }
        
        console.error('[TOKEN_SERVICE_ERROR]', {
          context: 'CAL_API_ERROR',
          status: response.status,
          statusText: response.statusText,
          errorDetail,
          userUlid,
          timestamp: new Date().toISOString()
        });
        
        return { 
          success: false, 
          error: `Token refresh failed with status ${response.status}${errorDetail ? ': ' + errorDetail : ''}` 
        };
      }

      // Parse the token response
      let parsedTokenData = await response.json();
      const tokenResult = isCalManagedUser ? parsedTokenData?.data : parsedTokenData;
      
      if (isCalManagedUser) {
        // For managed users, the response structure is different
        if (!tokenResult?.accessToken) {
          console.error('[TOKEN_SERVICE_ERROR]', {
            context: 'INVALID_MANAGED_USER_TOKEN_RESPONSE',
            response: parsedTokenData,
            userUlid,
            timestamp: new Date().toISOString()
          });
          return { success: false, error: 'Invalid token response for managed user' };
        }
        
        // Map the response to the expected format
        parsedTokenData = {
          access_token: tokenResult.accessToken,
          refresh_token: tokenResult.refreshToken || integration.calRefreshToken,
          expires_in: Math.floor((tokenResult.accessTokenExpiresAt - Date.now()) / 1000)
        };
      } else if (!parsedTokenData.access_token) {
        console.error('[TOKEN_SERVICE_ERROR]', {
          context: 'INVALID_TOKEN_RESPONSE',
          tokenData: parsedTokenData,
          userUlid,
          timestamp: new Date().toISOString()
        });
        return { success: false, error: 'Invalid token response' };
      }

      // Update the integration record in the database
      const { error: updateError } = await supabase
        .from('CalendarIntegration')
        .update({
          calAccessToken: parsedTokenData.access_token,
          calRefreshToken: parsedTokenData.refresh_token || integration.calRefreshToken,
          calAccessTokenExpiresAt: new Date(Date.now() + (parsedTokenData.expires_in * 1000)).toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('userUlid', userUlid);

      if (updateError) {
        console.error('[TOKEN_SERVICE_ERROR]', {
          context: 'UPDATE_ERROR',
          error: updateError,
          userUlid,
          timestamp: new Date().toISOString()
        });
        return { 
          success: false, 
          error: 'Failed to update integration record',
          tokens: parsedTokenData
        };
      }

      console.log('[TOKEN_SERVICE] Successfully refreshed Cal.com token');
      
      // Revalidate related paths to ensure fresh data
      revalidatePath('/dashboard/settings');
      revalidatePath('/test/cal-webhook-test');
      
      return {
        success: true,
        tokens: parsedTokenData
      };
    } catch (error) {
      console.error('[TOKEN_SERVICE_ERROR]', {
        context: 'UNEXPECTED',
        error,
        userUlid,
        timestamp: new Date().toISOString()
      });
      return { success: false, error: 'Error refreshing token' };
    }
  } catch (error) {
    console.error('[TOKEN_SERVICE_ERROR]', {
      context: 'GENERAL',
      error,
      userUlid,
      timestamp: new Date().toISOString()
    });
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Checks if a Cal.com token is expired or will expire soon
 */
export async function isCalTokenExpired(expiresAt: string | null, bufferMinutes = 10): Promise<boolean> {
  if (!expiresAt) return true;
  
  try {
    const expiryTime = new Date(expiresAt).getTime();
    const currentTime = Date.now();
    const bufferMs = bufferMinutes * 60 * 1000;
    
    return expiryTime - currentTime < bufferMs;
  } catch (error) {
    console.error('[TOKEN_SERVICE_ERROR]', {
      context: 'EXPIRY_CHECK',
      error,
      timestamp: new Date().toISOString()
    });
    return true; // Assume expired on error to force refresh
  }
} 