// This file contains server actions for Cal.com token management
'use server';

import { createAuthClient } from '@/utils/auth';
import { ensureValidCalToken as serverActionEnsureValidToken } from '@/utils/actions/cal/cal-tokens';
import { CalTokenService } from '@/lib/cal/cal-service';

/**
 * Token information interface
 */
export interface CalTokenInfo {
  isExpired: boolean;
  isExpiringImminent: boolean;
  expiresAt: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  managedUserId: number | null;
}

/**
 * Token refresh result interface
 */
export interface TokenRefreshResult {
  success: boolean;
  tokenInfo: CalTokenInfo | null;
  error?: string;
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

    // Use CalTokenService to check expiration
    const isExpired = CalTokenService.isTokenExpired(
      integration.calAccessTokenExpiresAt || '',
      bufferMinutes
    );
    
    // For imminent expiration, use a shorter buffer
    const isExpiringImminent = integration.calAccessTokenExpiresAt ? 
      CalTokenService.isTokenExpired(integration.calAccessTokenExpiresAt, 2) : true;

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

    // Use the server action, passing the forceRefresh flag
    const tokenResult = await serverActionEnsureValidToken(userUlid, forceRefresh);
    
    if (!tokenResult.success) {
      return {
        success: false,
        tokenInfo: null,
        error: tokenResult.error || 'Failed to get token'
      };
    }
    
    // Get the full token info
    const tokenInfo = await getCalTokenInfo(userUlid);
    
    return {
      success: true,
      tokenInfo
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

    // Treat 401 Unauthorized or 498 Token Expired as needing a refresh
    if (status === 401 || status === 498) {
      console.log(`[CAL_TOKEN_UTIL] Detected potential token expiration (status ${status}), refreshing token`);

      // Use the CalTokenService directly to refresh the token
      const refreshResult = await CalTokenService.refreshTokens(userUlid, true);

      if (!refreshResult.success) {
        console.error(`[CAL_TOKEN_UTIL] Failed to refresh token after ${status} status:`, refreshResult.error);
        // Return the original error response if token refresh fails
        return apiResponse;
      }
      
      // Get the updated token using the centralized ensureValidToken service
      // We use forceRefresh=false here because we ONLY want the LATEST token,
      // the refresh should have already happened via CalTokenService.refreshTokens above.
      const tokenResult = await CalTokenService.ensureValidToken(userUlid, false);
      
      if (!tokenResult.success || !tokenResult.accessToken) {
        console.error(`[CAL_TOKEN_UTIL] Failed to get valid token after refresh:`, tokenResult.error);
        return apiResponse; // Return original error if we can't get the new token
      }

      // Retry the original API call with the new token
      console.log(`[CAL_TOKEN_UTIL] Retrying API call with new token after ${status} response`);
      return await retryFn(tokenResult.accessToken);
    }

    // For other status codes, try to examine the response body for specific token errors
    // Clone the response before reading it
    const clonedResponse = apiResponse.clone();

    // Try to parse as JSON to check for token expiration
    let errorBody;
    let isTokenExpiredException = false;

    try {
      errorBody = await clonedResponse.json();
      isTokenExpiredException = (typeof errorBody === 'object' &&
                                 errorBody?.error?.code === 'TokenExpiredException');
    } catch (e) {
      // If we can't parse as JSON, assume it's not the specific exception
      isTokenExpiredException = false;
    }

    if (!isTokenExpiredException) {
      // Not the specific TokenExpiredException, return the original response
      return apiResponse;
    }

    // This is the TokenExpiredException, refresh the token and retry
    console.log('[CAL_TOKEN_UTIL] Detected TokenExpiredException in API response body, refreshing token');

    // Refresh token using the CalTokenService
    const refreshResult = await CalTokenService.refreshTokens(userUlid, true);

    if (!refreshResult.success) {
      console.error('[CAL_TOKEN_UTIL] Failed to refresh token for API retry (TokenExpiredException):', refreshResult.error);
      // Return the original error response if token refresh fails
      return apiResponse;
    }
    
    // Get the updated token using the centralized ensureValidToken service
    const tokenResult = await CalTokenService.ensureValidToken(userUlid, false);
    
    if (!tokenResult.success || !tokenResult.accessToken) {
      console.error(`[CAL_TOKEN_UTIL] Failed to get valid token after refresh (TokenExpiredException):`, tokenResult.error);
      return apiResponse;
    }

    // Retry the original API call with the new token
    console.log('[CAL_TOKEN_UTIL] Retrying API call with new token (TokenExpiredException)');
    return await retryFn(tokenResult.accessToken);
  } catch (error) {
    console.error('[CAL_TOKEN_UTIL] Error handling Cal API response:', error);
    // Return the original response in case of errors during our handling
    return apiResponse;
  }
} 