// This file contains server actions for Cal.com token management
'use server';

import { createAuthClient } from '@/utils/auth';
import { refreshUserCalTokens } from '@/utils/actions/cal-tokens';
import { isTokenExpiredOrExpiringSoon, type CalTokenInfo, type TokenRefreshResult } from '@/utils/cal';

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

    // This is a token expiration error, refresh the token and retry
    console.log('[CAL_TOKEN_UTIL] Detected token expiration in API response, refreshing token');
    
    // Refresh token
    const refreshResult = await ensureValidCalToken(userUlid, true);
    
    if (!refreshResult.success || !refreshResult.tokenInfo?.accessToken) {
      console.error('[CAL_TOKEN_UTIL] Failed to refresh token for API retry:', refreshResult.error);
      // Return the original error response if token refresh fails
      return apiResponse;
    }
    
    // Retry the original API call with the new token
    console.log('[CAL_TOKEN_UTIL] Retrying API call with new token');
    return await retryFn(refreshResult.tokenInfo.accessToken);
  } catch (error) {
    console.error('[CAL_TOKEN_UTIL] Error handling Cal API response:', error);
    // Return the original response in case of errors during our handling
    return apiResponse;
  }
} 