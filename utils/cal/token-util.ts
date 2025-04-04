// This file contains utility functions that can be imported in both server and client components
// Remove the 'use server' directive since we have both async and sync functions
// Individual async server actions will be marked separately

import { createAuthClient } from '@/utils/auth';
import { refreshUserCalTokens } from '@/utils/actions/cal-tokens';

export interface CalTokenInfo {
  isExpired: boolean;
  isExpiringImminent: boolean;
  expiresAt: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  managedUserId: number | null;
}

export interface TokenRefreshResult {
  success: boolean;
  tokenInfo: CalTokenInfo | null;
  error?: string;
}

/**
 * Check if a Cal.com token is expired or will expire soon
 * 
 * @param expiresAt The token expiration time
 * @param bufferMinutes Buffer time in minutes to consider a token as "expiring soon"
 * @returns Boolean indicating if the token is expired or will expire soon
 */
export function isTokenExpiredOrExpiringSoon(
  expiresAt: string | null | undefined,
  bufferMinutes = 5
): { isExpired: boolean; isExpiringImminent: boolean } {
  if (!expiresAt) {
    return { isExpired: true, isExpiringImminent: true };
  }

  try {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    
    // Check if expiry date is valid
    if (isNaN(expiryDate.getTime())) {
      return { isExpired: true, isExpiringImminent: true };
    }
    
    // Check if token is already expired
    const isExpired = expiryDate <= now;
    
    // Check if token will expire soon
    const bufferTime = bufferMinutes * 60 * 1000; // Convert minutes to milliseconds
    const isExpiringImminent = !isExpired && 
                             (expiryDate.getTime() - now.getTime() < bufferTime);
    
    return { isExpired, isExpiringImminent };
  } catch (error) {
    console.error('[CAL_TOKEN_UTIL] Error checking token expiration:', error);
    // Default to considering it expired if we can't parse the date
    return { isExpired: true, isExpiringImminent: true };
  }
}

/**
 * Get the Cal.com token information for a user
 * 
 * @param userUlid The user's ULID
 * @param bufferMinutes Buffer time in minutes to consider a token as "expiring soon"
 * @returns Token information including expiration status
 */
export async function getCalTokenInfo(
  userUlid: string,
  bufferMinutes = 5
): Promise<CalTokenInfo | null> {
  'use server'; // Mark this specific function as a server action
  
  try {
    if (!userUlid) {
      console.error('[CAL_TOKEN_UTIL] Missing user ULID');
      return null;
    }

    const supabase = createAuthClient();
    const { data: integration, error } = await supabase
      .from('CalendarIntegration')
      .select('calAccessToken, calRefreshToken, calAccessTokenExpiresAt, calManagedUserId')
      .eq('userUlid', userUlid)
      .maybeSingle();

    if (error || !integration) {
      console.error('[CAL_TOKEN_UTIL] Error fetching Cal integration:', error);
      return null;
    }

    const { isExpired, isExpiringImminent } = isTokenExpiredOrExpiringSoon(
      integration.calAccessTokenExpiresAt,
      bufferMinutes
    );

    console.log('[CAL_TOKEN_UTIL] Token status for user:', {
      userUlid,
      isExpired,
      isExpiringImminent,
      expiresAt: integration.calAccessTokenExpiresAt,
      hasToken: !!integration.calAccessToken,
      timestamp: new Date().toISOString()
    });

    return {
      isExpired,
      isExpiringImminent,
      expiresAt: integration.calAccessTokenExpiresAt,
      accessToken: integration.calAccessToken,
      refreshToken: integration.calRefreshToken,
      managedUserId: integration.calManagedUserId
    };
  } catch (error) {
    console.error('[CAL_TOKEN_UTIL] Error getting token info:', error);
    return null;
  }
}

/**
 * Ensure a user has a valid (non-expired) Cal.com token 
 * Automatically refreshes the token if needed
 * 
 * @param userUlid The user's ULID
 * @param forceRefresh Whether to force refresh the token even if it's not expired
 * @returns The refreshed token information or error
 */
export async function ensureValidCalToken(
  userUlid: string,
  forceRefresh = false
): Promise<TokenRefreshResult> {
  'use server'; // Mark this specific function as a server action
  
  try {
    console.log('[CAL_TOKEN_UTIL] Ensuring valid token for user:', {
      userUlid,
      forceRefresh,
      timestamp: new Date().toISOString()
    });

    // Get current token info
    const tokenInfo = await getCalTokenInfo(userUlid);

    if (!tokenInfo) {
      return {
        success: false,
        tokenInfo: null,
        error: 'Failed to get token information'
      };
    }

    // If token is valid and force refresh is not requested, return current token
    if (!forceRefresh && !tokenInfo.isExpired && !tokenInfo.isExpiringImminent) {
      return {
        success: true,
        tokenInfo
      };
    }

    // Need to refresh the token
    console.log('[CAL_TOKEN_UTIL] Refreshing token for user:', {
      userUlid,
      reason: forceRefresh ? 'Force refresh requested' : 
             tokenInfo.isExpired ? 'Token expired' : 'Token expiring soon',
      timestamp: new Date().toISOString()
    });

    // Use the existing refresh function
    const refreshResult = await refreshUserCalTokens(userUlid, true);

    if (!refreshResult.success) {
      console.error('[CAL_TOKEN_UTIL] Token refresh failed:', refreshResult.error);
      return {
        success: false,
        tokenInfo,
        error: refreshResult.error || 'Token refresh failed'
      };
    }

    // Get updated token info after refresh
    const refreshedTokenInfo = await getCalTokenInfo(userUlid);

    if (!refreshedTokenInfo) {
      return {
        success: false,
        tokenInfo,
        error: 'Failed to get refreshed token information'
      };
    }

    return {
      success: true,
      tokenInfo: refreshedTokenInfo
    };
  } catch (error) {
    console.error('[CAL_TOKEN_UTIL] Error ensuring valid token:', error);
    return {
      success: false,
      tokenInfo: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Handle a Cal.com API response that might have token expiration issues
 * If a 498 error is detected, it will attempt to refresh the token and retry the request
 * 
 * @param apiResponse The original API response
 * @param retryFn Function to retry the API call with the new token
 * @param userUlid The user's ULID
 * @returns The API response or the retry response if token was refreshed
 */
export async function handleCalApiResponse(
  apiResponse: Response,
  retryFn: (token: string) => Promise<Response>,
  userUlid: string
): Promise<Response> {
  'use server'; // Mark this specific function as a server action
  
  // If response is OK, return it immediately
  if (apiResponse.ok) {
    return apiResponse;
  }

  try {
    // Check if this is a token expiration error
    const status = apiResponse.status;
    
    // Clone the response before reading it
    const clonedResponse = apiResponse.clone();
    
    // Try to parse as JSON to check for token expiration
    let errorBody;
    let isTokenError = false;
    
    try {
      errorBody = await clonedResponse.json();
      isTokenError = status === 498 || 
                    (typeof errorBody === 'object' && 
                     errorBody?.error?.code === 'TokenExpiredException');
    } catch (e) {
      // If we can't parse as JSON, check only the status code
      isTokenError = status === 498;
    }
    
    if (!isTokenError) {
      // Not a token error, return the original response
      return apiResponse;
    }
    
    console.log('[CAL_TOKEN_UTIL] Detected token error in API response:', {
      status,
      userUlid,
      timestamp: new Date().toISOString()
    });
    
    // Refresh the token
    const refreshResult = await ensureValidCalToken(userUlid, true);
    
    if (!refreshResult.success || !refreshResult.tokenInfo?.accessToken) {
      console.error('[CAL_TOKEN_UTIL] Failed to refresh token for retry:', refreshResult.error);
      return apiResponse;
    }
    
    // Retry the API call with the new token
    console.log('[CAL_TOKEN_UTIL] Retrying API call with refreshed token');
    return await retryFn(refreshResult.tokenInfo.accessToken);
    
  } catch (error) {
    console.error('[CAL_TOKEN_UTIL] Error handling API response:', error);
    return apiResponse;
  }
} 