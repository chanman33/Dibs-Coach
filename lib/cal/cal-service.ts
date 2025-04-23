import { createId } from '@paralleldrive/cuid2';
import { env } from '@/lib/env';
import { createAuthClient } from '@/utils/auth';
import { generateUlid } from '@/utils/ulid';
import { Database } from '@/types/supabase';

interface CalUserData {
  id: number;
  email: string;
  username: string;
  name: string;
  timeZone: string;
  weekStart: string;
  createdDate: string;
  timeFormat: number;
  defaultScheduleId: number | null;
  locale: string;
  avatarUrl: string | null;
}

interface CalTokenData {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number | string;
}

export interface TokenUpdateResult {
  success: boolean;
  error?: string;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number | string;
  };
}

export interface TokenRefreshResult {
  success: boolean;
  error?: string;
  tokens?: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

export interface CalManagedUserResponse {
  status: string;
  data: {
    user: CalUserData;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number;
  };
}

type CalendarIntegration = Database['public']['Tables']['CalendarIntegration']['Row'];

interface TokenRefreshTracker {
  [userUlid: string]: {
    lastRefresh: number;
    attempts: number;
    inProgress: boolean;
  }
}

// Track token refresh attempts to prevent loops
const tokenRefreshTracker: TokenRefreshTracker = {};

// Add a cooldown period (in milliseconds)
const TOKEN_REFRESH_COOLDOWN_MS = 30000; // 30 seconds
const MAX_REFRESH_ATTEMPTS = 3;

/**
 * Core token management service for Cal.com integration
 * Central source of truth for all Cal.com token operations
 */
export class CalTokenService {
  /**
   * Update a user's Cal.com tokens in the database
   * 
   * @param userUlid The user's ULID
   * @param tokenData The token data to store
   * @returns Result of the token update operation
   */
  static async updateTokens(
    userUlid: string, 
    tokenData: CalTokenData
  ): Promise<TokenUpdateResult> {
    try {
      console.log('[CAL_TOKEN_SERVICE] Updating tokens', {
        userUlid,
        tokenReceived: true,
        timestamp: new Date().toISOString()
      });

      // Validate inputs
      if (!userUlid) {
        console.error('[CAL_TOKEN_SERVICE_ERROR]', {
          context: 'MISSING_USER_ULID',
          timestamp: new Date().toISOString()
        });
        return { success: false, error: 'User ULID is required' };
      }

      if (!tokenData.accessToken || !tokenData.refreshToken) {
        console.error('[CAL_TOKEN_SERVICE_ERROR]', {
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
        console.error('[CAL_TOKEN_SERVICE_ERROR]', {
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

      console.log('[CAL_TOKEN_SERVICE_SUCCESS]', {
        userUlid,
        timestamp: new Date().toISOString()
      });

      return { 
        success: true,
        tokens: {
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          accessTokenExpiresAt: formattedExpiresAt
        }
      };
    } catch (error) {
      console.error('[CAL_TOKEN_SERVICE_ERROR]', {
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
   * Check if a Cal.com token is expired
   * 
   * @param accessTokenExpiresAt The token expiration time
   * @param bufferMinutes Optional buffer time in minutes (default: 5)
   * @param forceCheck Optional flag to force expiry check even if timestamp suggests validity
   * @returns True if the token is expired or will expire within the buffer time
   */
  static isTokenExpired(
    accessTokenExpiresAt: string | number | Date, 
    bufferMinutes = 5,
    forceCheck = false
  ): boolean {
    try {
      if (!accessTokenExpiresAt) {
        return true;
      }

      // Convert to Date object if it's not already
      const expiryDate = accessTokenExpiresAt instanceof Date 
        ? accessTokenExpiresAt 
        : new Date(accessTokenExpiresAt);

      // Calculate buffer time in milliseconds
      const bufferTime = bufferMinutes * 60 * 1000;
      
      // Check if token is expired or will expire within buffer time
      const isExpiredByTimestamp = Date.now() + bufferTime >= expiryDate.getTime();
      
      // If explicitly checking or token is expired by timestamp, return true
      if (forceCheck || isExpiredByTimestamp) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[CAL_TOKEN_SERVICE_ERROR]', {
        context: 'CHECK_EXPIRY',
        error,
        timestamp: new Date().toISOString()
      });
      
      // If there's an error parsing the date, consider the token expired
      return true;
    }
  }

  /**
   * Refresh a user's Cal.com tokens
   * 
   * @param userUlid The user's ULID
   * @param forceRefresh Whether to force refresh even if token is not expired
   * @returns Result of the token refresh operation
   */
  static async refreshTokens(
    userUlid: string, 
    forceRefresh = false
  ): Promise<TokenRefreshResult> {
    try {
      console.log('[CAL_TOKEN_SERVICE] Refreshing tokens', {
        userUlid,
        forceRefresh,
        timestamp: new Date().toISOString()
      });

      if (!userUlid) {
        return { success: false, error: 'User ULID is required' };
      }

      // Loop protection: check recent refresh attempts
      const now = Date.now();
      const tracker = tokenRefreshTracker[userUlid] || { 
        lastRefresh: 0, 
        attempts: 0,
        inProgress: false 
      };
      
      // If another refresh is already in progress for this user, prevent duplicate
      if (tracker.inProgress) {
        console.log('[CAL_TOKEN_SERVICE] Token refresh already in progress for user:', userUlid);
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
          console.warn('[CAL_TOKEN_SERVICE] Token refresh loop detected. Blocking refresh for user:', userUlid, 'attempts:', tracker.attempts);
          
          // Reset after a while
          setTimeout(() => {
            if (tokenRefreshTracker[userUlid]) {
              console.log('[CAL_TOKEN_SERVICE] Resetting attempts counter for user:', userUlid);
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

      // Get the user's Cal.com integration data
      const supabase = createAuthClient();
      const { data: integration, error: integrationError } = await supabase
        .from('CalendarIntegration')
        .select('calRefreshToken, calManagedUserId, calAccessTokenExpiresAt')
        .eq('userUlid', userUlid)
        .single();

      if (integrationError || !integration) {
        tracker.inProgress = false; // release lock
        console.error('[CAL_TOKEN_SERVICE_ERROR]', {
          context: 'DB_INTEGRATION',
          error: integrationError || 'Integration not found',
          userUlid,
          timestamp: new Date().toISOString()
        });
        return { success: false, error: 'Calendar integration not found' };
      }

      if (!integration.calRefreshToken) {
        tracker.inProgress = false; // release lock
        console.error('[CAL_TOKEN_SERVICE_ERROR]', {
          context: 'NO_REFRESH_TOKEN',
          userUlid,
          timestamp: new Date().toISOString()
        });
        return { success: false, error: 'No refresh token available' };
      }

      // Check if token is actually expired (unless forcing refresh)
      if (!forceRefresh && integration.calAccessTokenExpiresAt) {
        const isExpired = this.isTokenExpired(integration.calAccessTokenExpiresAt);
        if (!isExpired) {
          tracker.inProgress = false; // release lock
          console.log('[CAL_TOKEN_SERVICE] Token not expired, skipping refresh', {
            userUlid,
            expiresAt: integration.calAccessTokenExpiresAt
          });
          return { success: true, error: 'Token not expired' };
        }
      }

      // Get client credentials
      const clientId = env.NEXT_PUBLIC_CAL_CLIENT_ID;
      const clientSecret = env.CAL_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        tracker.inProgress = false; // release lock
        console.error('[CAL_TOKEN_SERVICE_ERROR]', {
          context: 'ENV',
          clientIdPresent: !!clientId,
          clientSecretPresent: !!clientSecret,
          timestamp: new Date().toISOString()
        });
        return { success: false, error: 'Missing required environment variables' };
      }

      // Determine the refresh strategy
      const isManagedUser = !!integration.calManagedUserId;
      // Use force-refresh ONLY if explicitly requested by the caller AND the user is managed.
      const useForceRefreshDirectly = isManagedUser && forceRefresh;

      let response;
      let responseJSON: any;
      let initialRefreshError: string | null = null;

      if (useForceRefreshDirectly) {
        // --- Direct Force Refresh (Caller explicitly requested) ---
        console.log('[CAL_TOKEN_SERVICE] Using managed user force refresh endpoint (explicitly requested)', {
          managedUserId: integration.calManagedUserId
        });
        response = await fetch(
          `https://api.cal.com/v2/oauth-clients/${clientId}/users/${integration.calManagedUserId}/force-refresh`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-cal-client-id': clientId,
              'x-cal-secret-key': clientSecret
            }
          }
        );
      } else {
        // --- Standard OAuth Refresh Attempt ---
        console.log('[CAL_TOKEN_SERVICE] Using standard OAuth refresh flow (attempt 1)');
        response = await fetch('https://api.cal.com/v2/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
            refresh_token: integration.calRefreshToken
          })
        });

        // --- Fallback to Force Refresh if Standard Failed (for Managed Users) ---
        if (!response.ok && isManagedUser) {
          let errorDetail = '';
          try { errorDetail = (await response.json())?.error?.message || ''; } catch {}
          initialRefreshError = `Standard refresh failed (status ${response.status}${errorDetail ? ': ' + errorDetail : ''}).`;
          
          console.warn(`[CAL_TOKEN_SERVICE] ${initialRefreshError} Attempting force refresh as fallback for managed user.`, {
            userUlid,
            managedUserId: integration.calManagedUserId
          });

          response = await fetch(
            `https://api.cal.com/v2/oauth-clients/${clientId}/users/${integration.calManagedUserId}/force-refresh`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-cal-client-id': clientId,
                'x-cal-secret-key': clientSecret
              }
            }
          );
        }
      }

      // --- Process Final Response ---
      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = errorData?.error?.message || errorData?.message || '';
        } catch { /* Ignore parsing error */ }
        
        tracker.inProgress = false; // release lock
        const finalErrorContext = initialRefreshError ? 'CAL_API_FORCE_REFRESH_FALLBACK_ERROR' : 'CAL_API_ERROR';
        const finalErrorMessage = initialRefreshError 
            ? `Standard refresh failed and fallback force refresh also failed (status ${response.status}${errorDetail ? ': ' + errorDetail : ''}).`
            : `Token refresh failed with status ${response.status}${errorDetail ? ': ' + errorDetail : ''}`;
            
        console.error('[CAL_TOKEN_SERVICE_ERROR]', {
          context: finalErrorContext,
          status: response.status,
          statusText: response.statusText,
          errorDetail,
          initialError: initialRefreshError, // Log the initial error if fallback occurred
          userUlid,
          timestamp: new Date().toISOString()
        });
        
        return { success: false, error: finalErrorMessage };
      }

      // Parse the successful response
      responseJSON = await response.json();
      
      let tokens;
      let updatedTokens: CalTokenData;
      
      // Determine structure based on which endpoint succeeded
      const forceRefreshSucceeded = (useForceRefreshDirectly || initialRefreshError) && responseJSON?.data?.accessToken;
      const standardRefreshSucceeded = !forceRefreshSucceeded && responseJSON?.access_token;

      if (forceRefreshSucceeded) {
        // --- Successful Force Refresh (Direct or Fallback) ---
        const tokenResult = responseJSON.data;
        console.log('[CAL_TOKEN_SERVICE] Force refresh successful', { userUlid });
        
        tokens = {
          access_token: tokenResult.accessToken,
          refresh_token: tokenResult.refreshToken || integration.calRefreshToken, // Use new if provided
          expires_in: Math.floor((new Date(tokenResult.accessTokenExpiresAt).getTime() - Date.now()) / 1000)
        };
        
        updatedTokens = {
          accessToken: tokenResult.accessToken,
          refreshToken: tokenResult.refreshToken || integration.calRefreshToken,
          accessTokenExpiresAt: tokenResult.accessTokenExpiresAt
        };
        
      } else if (standardRefreshSucceeded) {
        // --- Successful Standard Refresh ---
        console.log('[CAL_TOKEN_SERVICE] Standard refresh successful', { userUlid });
        
        tokens = {
          access_token: responseJSON.access_token,
          // IMPORTANT: Use the new refresh token if provided (rotation)
          refresh_token: responseJSON.refresh_token || integration.calRefreshToken, 
          expires_in: responseJSON.expires_in
        };
        
        const expiresAt = new Date(Date.now() + (responseJSON.expires_in * 1000));
        updatedTokens = {
          accessToken: responseJSON.access_token,
          refreshToken: responseJSON.refresh_token || integration.calRefreshToken,
          accessTokenExpiresAt: expiresAt.toISOString()
        };
        
      } else {
        // --- Invalid/Unexpected Response ---
        tracker.inProgress = false; // release lock
        console.error('[CAL_TOKEN_SERVICE_ERROR]', {
          context: 'INVALID_TOKEN_RESPONSE',
          response: responseJSON,
          userUlid,
          timestamp: new Date().toISOString()
        });
        return { success: false, error: 'Invalid token response structure after refresh' };
      }

      // Store the successfully refreshed tokens in the database
      const updateResult = await this.updateTokens(userUlid, updatedTokens);
      if (!updateResult.success) {
          // Handle potential DB update failure after successful API call
          tracker.inProgress = false;
          console.error('[CAL_TOKEN_SERVICE_ERROR]', {
            context: 'DB_UPDATE_AFTER_REFRESH',
            error: updateResult.error,
            userUlid,
            timestamp: new Date().toISOString()
          });
          // Even though API refresh worked, we failed to save, return error
          return { success: false, error: `Token refresh API succeeded, but failed to save new tokens: ${updateResult.error}` };
      }

      // Release lock
      tracker.inProgress = false;
      
      console.log('[CAL_TOKEN_SERVICE] Token refresh process completed successfully', {
        userUlid,
        methodUsed: forceRefreshSucceeded ? 'Force Refresh' : 'Standard Refresh',
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        tokens
      };
    } catch (error) {
      // Make sure to release the lock if there's an error
      if (tokenRefreshTracker[userUlid]) {
        tokenRefreshTracker[userUlid].inProgress = false;
      }
      
      console.error('[CAL_TOKEN_SERVICE_ERROR]', {
        context: 'REFRESH_TOKENS',
        error,
        userUlid,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error refreshing tokens'
      };
    }
  }

  /**
   * Refresh a managed user's token using the Cal.com API
   * 
   * @param userUlid The user's ULID
   * @returns Result of the token refresh operation
   */
  static async refreshManagedUserToken(userUlid: string): Promise<TokenRefreshResult> {
    // Call refreshTokens with forceRefresh=true to ensure we use the managed user flow
    return this.refreshTokens(userUlid, true);
  }

  /**
   * Get a valid Cal.com access token for a user
   * Refreshes the token if necessary
   * 
   * @param userUlid The user's ULID
   * @param forceRefresh Whether to force refresh even if not expired
   * @param apiReported Whether an API call already reported the token as invalid
   * @returns The valid access token or an error
   */
  static async ensureValidToken(
    userUlid: string, 
    forceRefresh = false,
    apiReported = false
  ): Promise<{
    accessToken: string;
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('[CAL_TOKEN_SERVICE] Ensuring valid token', {
        userUlid,
        forceRefresh,
        apiReported,
        timestamp: new Date().toISOString()
      });

      if (!userUlid) {
        return { 
          accessToken: '', 
          success: false, 
          error: 'User ULID is required' 
        };
      }

      // Get the user's Cal.com integration
      const supabase = createAuthClient();
      const { data: integration, error: integrationError } = await supabase
        .from('CalendarIntegration')
        .select('calAccessToken, calAccessTokenExpiresAt')
        .eq('userUlid', userUlid)
        .single();

      if (integrationError || !integration) {
        console.error('[CAL_TOKEN_SERVICE_ERROR]', {
          context: 'FETCH_INTEGRATION',
          error: integrationError,
          userUlid,
          timestamp: new Date().toISOString()
        });
        return { 
          accessToken: '', 
          success: false, 
          error: 'Calendar integration not found' 
        };
      }

      if (!integration.calAccessToken) {
        console.error('[CAL_TOKEN_SERVICE_ERROR]', {
          context: 'NO_ACCESS_TOKEN',
          userUlid,
          timestamp: new Date().toISOString()
        });
        return { 
          accessToken: '', 
          success: false, 
          error: 'No access token available' 
        };
      }

      // Check if token is expired, considering API reports
      const needsRefresh = forceRefresh || 
                         apiReported || 
                         (integration.calAccessTokenExpiresAt && 
                          this.isTokenExpired(integration.calAccessTokenExpiresAt, 5, apiReported));

      if (needsRefresh) {
        console.log('[CAL_TOKEN_SERVICE] Token needs refresh', {
          userUlid,
          reason: apiReported ? 'API reported invalid token' :
                 forceRefresh ? 'Forced refresh' : 
                 'Token expired based on DB',
          expiresAt: integration.calAccessTokenExpiresAt
        });
        
        // Refresh token. Pass forceRefresh=true if API reported token is invalid.
        const refreshResult = await this.refreshTokens(userUlid, forceRefresh || apiReported);
        
        if (!refreshResult.success) {
          return { 
            accessToken: '', 
            success: false, 
            error: refreshResult.error || 'Failed to refresh token' 
          };
        }

        // Get updated access token after refresh
        const { data: updatedIntegration, error: updatedError } = await supabase
          .from('CalendarIntegration')
          .select('calAccessToken')
          .eq('userUlid', userUlid)
          .single();

        if (updatedError || !updatedIntegration?.calAccessToken) {
          console.error('[CAL_TOKEN_SERVICE_ERROR]', {
            context: 'FETCH_UPDATED_TOKEN',
            error: updatedError,
            userUlid,
            timestamp: new Date().toISOString()
          });
          return { 
            accessToken: '', 
            success: false, 
            error: 'Failed to retrieve updated token' 
          };
        }

        return { 
          accessToken: updatedIntegration.calAccessToken, 
          success: true 
        };
      }

      // Token is valid, return it
      return { 
        accessToken: integration.calAccessToken, 
        success: true 
      };
    } catch (error) {
      console.error('[CAL_TOKEN_SERVICE_ERROR]', {
        context: 'ENSURE_VALID_TOKEN',
        error,
        userUlid,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      return { 
        accessToken: '', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error ensuring valid token' 
      };
    }
  }
}

// Keep the rest of the calService methods for user management, but replace token-related methods
export const calService = {
  /**
   * Create a new managed user in Cal.com
   */
  async createManagedUser(email: string, name: string): Promise<CalManagedUserResponse> {
    const response = await fetch(
      `https://api.cal.com/v2/oauth-clients/${env.NEXT_PUBLIC_CAL_CLIENT_ID}/users`,
      {
        method: 'POST',
        headers: {
          'x-cal-secret-key': env.CAL_CLIENT_SECRET || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          timeZone: 'America/New_York',
          timeFormat: 12,
          weekStart: 'Monday',
          locale: 'en',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create Cal.com managed user: ${JSON.stringify(error)}`);
    }

    return response.json();
  },

  /**
   * Save Cal.com integration data to the database
   */
  async saveCalendarIntegration(userUlid: string, calData: CalManagedUserResponse): Promise<any> {
    const { user, accessToken, refreshToken, accessTokenExpiresAt } = calData.data;
    
    // Convert Unix timestamp to Date
    const expiresAt = new Date(accessTokenExpiresAt).toISOString();
    const now = new Date().toISOString();
    const supabase = createAuthClient();

    try {
      // First check if a record exists for this user
      const { data: existingIntegration, error: fetchError } = await supabase
        .from('CalendarIntegration')
        .select('ulid')
        .eq('userUlid', userUlid)
        .maybeSingle();

      if (fetchError) {
        console.error('[CAL_INTEGRATION_FETCH_ERROR]', fetchError);
        throw fetchError;
      }

      if (existingIntegration) {
        // Update existing record
        const { data, error } = await supabase
          .from('CalendarIntegration')
          .update({
            calManagedUserId: user.id,
            calUsername: user.username,
            calAccessToken: accessToken,
            calRefreshToken: refreshToken,
            calAccessTokenExpiresAt: expiresAt,
            defaultScheduleId: user.defaultScheduleId,
            timeZone: user.timeZone,
            weekStart: user.weekStart,
            timeFormat: user.timeFormat,
            locale: user.locale,
            lastSyncedAt: now,
            syncEnabled: true,
            updatedAt: now
          })
          .eq('userUlid', userUlid)
          .select()
          .single();

        if (error) {
          console.error('[CAL_INTEGRATION_UPDATE_ERROR]', error);
          throw error;
        }

        return data;
      } else {
        // Create new record
        const ulid = generateUlid();
        const { data, error } = await supabase
          .from('CalendarIntegration')
          .insert({
            ulid: ulid,
            userUlid,
            provider: 'CAL',
            calManagedUserId: user.id,
            calUsername: user.username,
            calAccessToken: accessToken,
            calRefreshToken: refreshToken,
            calAccessTokenExpiresAt: expiresAt,
            defaultScheduleId: user.defaultScheduleId,
            timeZone: user.timeZone,
            weekStart: user.weekStart,
            timeFormat: user.timeFormat,
            locale: user.locale,
            syncEnabled: true,
            createdAt: now,
            updatedAt: now
          })
          .select()
          .single();

        if (error) {
          console.error('[CAL_INTEGRATION_INSERT_ERROR]', error);
          throw error;
        }

        return data;
      }
    } catch (error) {
      console.error('[CAL_INTEGRATION_ERROR]', error);
      throw error;
    }
  },

  /**
   * Get a user's Cal.com integration data
   */
  async getCalIntegration(userUlid: string): Promise<CalendarIntegration | null> {
    const supabase = createAuthClient();
    
    try {
      const { data, error } = await supabase
        .from('CalendarIntegration')
        .select('*')
        .eq('userUlid', userUlid)
        .maybeSingle();
        
      if (error) {
        console.error('[CAL_INTEGRATION_GET_ERROR]', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('[CAL_INTEGRATION_GET_ERROR]', error);
      return null;
    }
  },

  /**
   * Get a user's availability from Cal.com
   */
  async getUserAvailability(calUserId: number, accessToken: string, date: string): Promise<any> {
    try {
      const response = await fetch(
        `https://api.cal.com/v2/availability/${calUserId}?date=${date}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to get user availability: ${JSON.stringify(error)}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('[CAL_AVAILABILITY_ERROR]', error);
      throw error;
    }
  },
}; 