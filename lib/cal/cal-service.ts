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
   * @returns True if the token is expired or will expire within the buffer time
   */
  static isTokenExpired(
    accessTokenExpiresAt: string | number | Date, 
    bufferMinutes = 5
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
      return Date.now() + bufferTime >= expiryDate.getTime();
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

      // Determine if we should use managed user refresh
      const isManagedUser = !!integration.calManagedUserId;
      const shouldUseForceRefresh = (isManagedUser || forceRefresh) && integration.calManagedUserId;

      let response;
      if (shouldUseForceRefresh) {
        // Use force-refresh endpoint for managed users
        console.log('[CAL_TOKEN_SERVICE] Using managed user force refresh endpoint', {
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
        // Use standard OAuth refresh flow
        console.log('[CAL_TOKEN_SERVICE] Using standard OAuth refresh flow');
        
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
        
        tracker.inProgress = false; // release lock
        console.error('[CAL_TOKEN_SERVICE_ERROR]', {
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

      // Parse the response and handle different response formats
      const responseJSON = await response.json();
      
      let tokens;
      if (shouldUseForceRefresh) {
        // For managed users, the response structure is different
        const tokenResult = responseJSON?.data;
        
        if (!tokenResult?.accessToken) {
          tracker.inProgress = false; // release lock
          console.error('[CAL_TOKEN_SERVICE_ERROR]', {
            context: 'INVALID_MANAGED_USER_RESPONSE',
            response: responseJSON,
            userUlid,
            timestamp: new Date().toISOString()
          });
          return { success: false, error: 'Invalid token response for managed user' };
        }
        
        // Map the managed user response to our standard format
        tokens = {
          access_token: tokenResult.accessToken,
          refresh_token: tokenResult.refreshToken || integration.calRefreshToken,
          expires_in: Math.floor((new Date(tokenResult.accessTokenExpiresAt).getTime() - Date.now()) / 1000)
        };
        
        // Store the new tokens in the database
        const updatedTokens = {
          accessToken: tokenResult.accessToken,
          refreshToken: tokenResult.refreshToken || integration.calRefreshToken,
          accessTokenExpiresAt: tokenResult.accessTokenExpiresAt
        };
        
        await this.updateTokens(userUlid, updatedTokens);
      } else {
        // Standard OAuth flow response
        if (!responseJSON.access_token) {
          tracker.inProgress = false; // release lock
          console.error('[CAL_TOKEN_SERVICE_ERROR]', {
            context: 'INVALID_TOKEN_RESPONSE',
            response: responseJSON,
            userUlid,
            timestamp: new Date().toISOString()
          });
          return { success: false, error: 'Invalid token response' };
        }
        
        tokens = {
          access_token: responseJSON.access_token,
          refresh_token: responseJSON.refresh_token || integration.calRefreshToken,
          expires_in: responseJSON.expires_in
        };
        
        // Store the new tokens in the database
        const expiresAt = new Date(Date.now() + (responseJSON.expires_in * 1000));
        const updatedTokens = {
          accessToken: responseJSON.access_token,
          refreshToken: responseJSON.refresh_token || integration.calRefreshToken,
          accessTokenExpiresAt: expiresAt.toISOString()
        };
        
        await this.updateTokens(userUlid, updatedTokens);
      }

      // Release lock
      tracker.inProgress = false;
      
      console.log('[CAL_TOKEN_SERVICE] Token refresh successful', {
        userUlid,
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
   * @returns The valid access token or an error
   */
  static async ensureValidToken(userUlid: string): Promise<{
    accessToken: string;
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('[CAL_TOKEN_SERVICE] Ensuring valid token', {
        userUlid,
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

      // Check if token is expired
      if (integration.calAccessTokenExpiresAt && 
          this.isTokenExpired(integration.calAccessTokenExpiresAt)) {
        console.log('[CAL_TOKEN_SERVICE] Token expired, refreshing', {
          userUlid,
          expiresAt: integration.calAccessTokenExpiresAt
        });
        
        // Refresh token
        const refreshResult = await this.refreshTokens(userUlid);
        
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