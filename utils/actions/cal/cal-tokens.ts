'use server';

import { createAuthClient } from '@/utils/auth';
import { revalidatePath } from 'next/cache';
import { CalTokenService } from '@/lib/cal/cal-service';

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
    
    // Call the centralized service to update tokens
    const result = await CalTokenService.updateTokens(userUlid, tokenData);
    
    if (result.success) {
      // Revalidate relevant paths to reflect token updates
      revalidatePath('/dashboard/settings?tab=integrations');
      revalidatePath('/dashboard/calendar');
      revalidatePath('/dashboard/coach/availability');
    }
    
    return {
      success: result.success,
      error: result.error
    };
  } catch (error) {
    console.error('[CAL_TOKENS_UPDATE_ERROR]', {
      context: 'SERVER_ACTION',
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

    // Call the centralized service to refresh tokens
    const result = await CalTokenService.refreshTokens(userUlid, forceRefresh);
    
    if (result.success) {
      // Revalidate relevant paths to reflect token updates
      revalidatePath('/dashboard/settings?tab=integrations');
      revalidatePath('/dashboard/calendar');
      revalidatePath('/dashboard/coach/availability');
    }
    
    return {
      success: result.success,
      error: result.error
    };
  } catch (error) {
    console.error('[CAL_TOKENS_REFRESH_ERROR]', {
      context: 'SERVER_ACTION',
      error,
      userUlid,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error refreshing tokens'
    };
  }
}

/**
 * Gets a valid Cal.com token for a user
 * Refreshes the token if necessary
 * 
 * @param userUlid The user's ULID
 * @param forceRefresh (Optional) Force token refresh even if not expired
 * @returns The valid token or an error
 */
export async function ensureValidCalToken(userUlid: string, forceRefresh = false): Promise<{
  accessToken: string;
  success: boolean;
  error?: string;
}> {
  try {
    console.log('[CAL_TOKENS_ENSURE]', {
      userUlid,
      forceRefresh,
      timestamp: new Date().toISOString()
    });

    // Call the centralized service to ensure a valid token, passing forceRefresh
    return await CalTokenService.ensureValidToken(userUlid, forceRefresh);
  } catch (error) {
    console.error('[CAL_TOKENS_ENSURE_ERROR]', {
      context: 'SERVER_ACTION',
      error,
      userUlid,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return {
      accessToken: '',
      success: false,
      error: error instanceof Error ? error.message : 'Error ensuring valid token'
    };
  }
} 