'use server';

import { createAuthClient } from '@/utils/auth';
import { revalidatePath } from 'next/cache';

/**
 * Cal.com token data interface
 */
interface CalTokenData {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number | string;
}

/**
 * Response format for Cal.com token operations
 */
interface TokenUpdateResult {
  success: boolean;
  error?: string;
  debounced?: boolean;
}

// Add a timestamp of the last update to prevent rapid updates
let lastUpdateTimestamp = 0;
const UPDATE_COOLDOWN_MS = 2000; // 2 seconds

/**
 * Updates a user's Cal.com tokens in the database
 * This follows the managed user pattern as documented in Cal.com API docs
 * 
 * @param userUlid The user's ULID
 * @param tokenData The new token data to store
 * @returns Result of the database update operation
 */
export async function updateCalTokens(
  userUlid: string, 
  tokenData: CalTokenData
): Promise<TokenUpdateResult> {
  try {
    // Check if we're within the cooldown period
    const now = Date.now();
    if (now - lastUpdateTimestamp < UPDATE_COOLDOWN_MS) {
      console.log('[CAL_TOKENS_UPDATE_DEBOUNCED]', {
        userUlid,
        timeSinceLastUpdate: now - lastUpdateTimestamp,
        cooldownPeriod: UPDATE_COOLDOWN_MS,
        timestamp: new Date().toISOString()
      });
      return { success: true, debounced: true };
    }
    
    // Set the timestamp at the start of the update
    lastUpdateTimestamp = now;
    
    console.log('[CAL_TOKENS_UPDATE]', {
      userUlid,
      tokenReceived: true,
      timestamp: new Date().toISOString()
    });

    // Validate inputs
    if (!userUlid) {
      console.error('[CAL_TOKENS_UPDATE_ERROR]', {
        context: 'MISSING_USER_ULID',
        timestamp: new Date().toISOString()
      });
      return { success: false, error: 'User ULID is required' };
    }

    if (!tokenData.accessToken || !tokenData.refreshToken) {
      console.error('[CAL_TOKENS_UPDATE_ERROR]', {
        context: 'MISSING_TOKENS',
        userUlid,
        timestamp: new Date().toISOString()
      });
      return { success: false, error: 'Access token and refresh token are required' };
    }

    // Format the expiration date if needed
    let formattedExpiresAt: string;
    
    if (typeof tokenData.accessTokenExpiresAt === 'number') {
      // If it's a timestamp in milliseconds since epoch, convert to ISO string
      formattedExpiresAt = new Date(tokenData.accessTokenExpiresAt).toISOString();
    } else {
      // Assume it's already a string date
      formattedExpiresAt = tokenData.accessTokenExpiresAt;
    }

    // Get an authenticated Supabase client
    const supabase = createAuthClient();

    // Update the tokens in the database
    const { error } = await supabase
      .from('CalendarIntegration')
      .update({
        calAccessToken: tokenData.accessToken,
        calRefreshToken: tokenData.refreshToken,
        calAccessTokenExpiresAt: formattedExpiresAt,
        updatedAt: new Date().toISOString() // Always include updatedAt timestamp
      })
      .eq('userUlid', userUlid);

    if (error) {
      console.error('[CAL_TOKENS_UPDATE_ERROR]', {
        context: 'DB_UPDATE',
        error,
        userUlid,
        timestamp: new Date().toISOString()
      });
      return { 
        success: false, 
        error: `Failed to update tokens in database: ${error.message}` 
      };
    }

    // Revalidate relevant paths to reflect token updates
    // Use more specific paths to minimize unnecessary re-renders
    revalidatePath('/dashboard/settings?tab=integrations');
    revalidatePath('/dashboard/calendar');
    
    console.log('[CAL_TOKENS_UPDATE_SUCCESS]', {
      userUlid,
      timestamp: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('[CAL_TOKENS_UPDATE_ERROR]', {
      context: 'GENERAL',
      error,
      userUlid,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error'
    };
  }
}

/**
 * Refreshes a user's Cal.com tokens using the managed user refresh endpoint
 * 
 * @param userUlid The user's ULID
 * @param forceRefresh Force token refresh even if not expired
 * @returns Result of the token refresh operation
 */
export async function refreshUserCalTokens(userUlid: string, forceRefresh = false): Promise<TokenUpdateResult> {
  try {
    console.log('[CAL_TOKENS_REFRESH]', {
      userUlid,
      forceRefresh,
      timestamp: new Date().toISOString()
    });

    if (!userUlid) {
      return { success: false, error: 'User ULID is required' };
    }

    // Call our API endpoint that handles token refresh
    const response = await fetch(`${process.env.FRONTEND_URL}/api/cal/refresh-managed-user-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        userUlid,
        forceRefresh,
        isServerAction: true // Flag to indicate this is a server-to-server call
      })
    });

    if (!response.ok) {
      let errorMessage = 'Failed to refresh token';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Unable to parse error response
      }
      
      console.error('[CAL_TOKENS_REFRESH_ERROR]', {
        context: 'API_ERROR',
        status: response.status,
        error: errorMessage,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      return { success: false, error: errorMessage };
    }

    // Parse the response
    const result = await response.json();
    
    if (!result.success) {
      console.error('[CAL_TOKENS_REFRESH_ERROR]', {
        context: 'API_RESULT',
        error: result.error,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      return { success: false, error: result.error || 'Unknown error occurred' };
    }

    // If tokens were refreshed, update them in the database
    if (result.data) {
      return await updateCalTokens(userUlid, {
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        accessTokenExpiresAt: result.data.accessTokenExpiresAt
      });
    }

    return { success: true };
  } catch (error) {
    console.error('[CAL_TOKENS_REFRESH_ERROR]', {
      context: 'GENERAL',
      error,
      userUlid,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error'
    };
  }
} 