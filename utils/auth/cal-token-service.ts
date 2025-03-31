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

// Add these near the top of the file, after imports
interface TokenRefreshTracker {
  [userUlid: string]: {
    lastRefresh: number;
    attempts: number;
    inProgress: boolean; // Add inProgress flag to track ongoing refreshes
  }
}

// Track token refresh attempts to prevent loops
const tokenRefreshTracker: TokenRefreshTracker = {};

// Add a cooldown period (in milliseconds)
const TOKEN_REFRESH_COOLDOWN_MS = 30000; // 30 seconds
const MAX_REFRESH_ATTEMPTS = 3;

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
    
    // Loop protection: check recent refresh attempts
    const now = Date.now();
    const tracker = tokenRefreshTracker[userUlid] || { 
      lastRefresh: 0, 
      attempts: 0,
      inProgress: false 
    };
    
    // If another refresh is already in progress for this user, prevent duplicate
    if (tracker.inProgress) {
      console.log('[TOKEN_SERVICE] Token refresh already in progress for user:', userUlid);
      return { 
        success: false, 
        error: 'Token refresh already in progress' 
      };
    }
    
    // Check if we're in a potential loop
    if (now - tracker.lastRefresh < TOKEN_REFRESH_COOLDOWN_MS) {
      tracker.attempts += 1;
      
      // If too many attempts in short period, block refresh
      if (tracker.attempts >= MAX_REFRESH_ATTEMPTS) {
        console.warn('[TOKEN_SERVICE] Token refresh loop detected. Blocking refresh for user:', userUlid, 'attempts:', tracker.attempts);
        
        // Reset after a while
        setTimeout(() => {
          if (tokenRefreshTracker[userUlid]) {
            console.log('[TOKEN_SERVICE] Resetting attempts counter for user:', userUlid);
            tokenRefreshTracker[userUlid].attempts = 0;
            tokenRefreshTracker[userUlid].inProgress = false;
          }
        }, TOKEN_REFRESH_COOLDOWN_MS);
        
        return {
          success: false, 
          error: 'Token refresh loop detected. Please try again later.'
        };
      }
    } else {
      // Reset attempts if outside cooldown window
      tracker.attempts = 1;
    }
    
    // Update tracker and mark refresh as in progress
    tracker.lastRefresh = now;
    tracker.inProgress = true;
    tokenRefreshTracker[userUlid] = tracker;
    
    // Get user's Cal.com integration
    const supabase = createAuthClient();
    const { data: integration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('*')
      .eq('userUlid', userUlid)
      .single();

    if (integrationError || !integration) {
      tracker.inProgress = false; // release lock
      console.error('[TOKEN_SERVICE_ERROR]', {
        context: 'FETCH_INTEGRATION',
        error: integrationError,
        userUlid,
        timestamp: new Date().toISOString()
      });
      return { success: false, error: 'Integration not found' };
    }

    if (!integration.calRefreshToken) {
      tracker.inProgress = false; // release lock
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
        tracker.inProgress = false; // release lock
        console.error('[TOKEN_SERVICE_ERROR]', {
          context: 'MISSING_CLIENT_ID',
          userUlid,
          timestamp: new Date().toISOString()
        });
        return { success: false, error: 'Missing CAL_CLIENT_ID in environment variables' };
      }
      
      if (!CAL_CLIENT_SECRET) {
        tracker.inProgress = false; // release lock
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
        
        tracker.inProgress = false; // release lock
        return { 
          success: false, 
          error: `Token refresh failed with status ${response.status}${errorDetail ? ': ' + errorDetail : ''}` 
        };
      }

      // Parse the token response
      const responseJSON = await response.json();
      
      // Standardize token format based on whether we're dealing with managed user or standard OAuth
      let parsedTokenData;
      
      if (isCalManagedUser) {
        // For managed users, the response structure is different
        const tokenResult = responseJSON?.data;
        
        if (!tokenResult?.accessToken) {
          tracker.inProgress = false; // release lock
          console.error('[TOKEN_SERVICE_ERROR]', {
            context: 'INVALID_MANAGED_USER_TOKEN_RESPONSE',
            response: responseJSON,
            userUlid,
            timestamp: new Date().toISOString()
          });
          return { success: false, error: 'Invalid token response for managed user' };
        }
        
        // Map the response to the expected format
        parsedTokenData = {
          access_token: tokenResult.accessToken,
          refresh_token: tokenResult.refreshToken || integration.calRefreshToken,
          expires_in: Math.floor((new Date(tokenResult.accessTokenExpiresAt).getTime() - Date.now()) / 1000)
        };
      } else {
        // Standard OAuth flow response
        if (!responseJSON.access_token) {
          tracker.inProgress = false; // release lock
          console.error('[TOKEN_SERVICE_ERROR]', {
            context: 'INVALID_TOKEN_RESPONSE',
            tokenData: responseJSON,
            userUlid,
            timestamp: new Date().toISOString()
          });
          return { success: false, error: 'Invalid token response' };
        }
        
        parsedTokenData = responseJSON;
      }

      // Ensure we have a refresh token, falling back to the existing one if needed
      if (!parsedTokenData.refresh_token) {
        parsedTokenData.refresh_token = integration.calRefreshToken;
        console.log('[TOKEN_SERVICE] No new refresh token provided, keeping existing one');
      }

      // Update the integration record in the database
      const { error: updateError } = await supabase
        .from('CalendarIntegration')
        .update({
          calAccessToken: parsedTokenData.access_token,
          calRefreshToken: parsedTokenData.refresh_token,
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
        
        // We'll still return the tokens even if DB update failed
        tracker.inProgress = false; // release lock
        return { 
          success: true, // Consider this a partial success since we have valid tokens
          error: 'Failed to update integration record in database',
          tokens: parsedTokenData
        };
      }

      console.log('[TOKEN_SERVICE] Successfully refreshed Cal.com token for user:', userUlid);
      
      // Revalidate related paths to ensure fresh data
      revalidatePath('/dashboard/settings');
      revalidatePath('/dashboard/coach/availability');
      revalidatePath('/api/cal/event-types');
      
      // Release the lock
      if (tokenRefreshTracker[userUlid]) {
        tokenRefreshTracker[userUlid].inProgress = false;
      }
      
      return {
        success: true,
        tokens: parsedTokenData
      };
    } catch (error) {
      // Release the lock on error
      if (tokenRefreshTracker[userUlid]) {
        tokenRefreshTracker[userUlid].inProgress = false;
      }
      
      console.error('[TOKEN_SERVICE_ERROR]', {
        context: 'UNEXPECTED',
        error,
        userUlid,
        timestamp: new Date().toISOString()
      });
      return { success: false, error: 'Error refreshing token' };
    }
  } catch (error) {
    // Release the lock on unexpected error
    if (userUlid && tokenRefreshTracker[userUlid]) {
      tokenRefreshTracker[userUlid].inProgress = false;
    }
    
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