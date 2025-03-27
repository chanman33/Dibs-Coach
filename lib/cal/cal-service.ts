import { createId } from '@paralleldrive/cuid2';
import { env } from '@/lib/env';
import { createAuthClient } from '@/utils/auth';
import { generateUlid } from '@/utils/ulid';
import { Database } from '@/types/supabase';
import { refreshCalAccessToken as refreshCalToken, isCalTokenExpired } from '@/utils/auth/cal-token-service';

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
  accessTokenExpiresAt: number;
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
   * Refresh the Cal.com access token using the centralized token service
   */
  async refreshCalToken(userUlid: string): Promise<CalTokenData> {
    try {
      // Use the centralized token service
      const result = await refreshCalToken(userUlid);
      
      if (!result.success || !result.tokens) {
        throw new Error(result.error || 'Failed to refresh token');
      }
      
      // Map the token service result to the expected CalTokenData format
      return {
        accessToken: result.tokens.access_token,
        refreshToken: result.tokens.refresh_token || '',
        accessTokenExpiresAt: Date.now() + (result.tokens.expires_in * 1000)
      };
    } catch (error) {
      console.error('[CAL_TOKEN_REFRESH_ERROR]', error);
      throw error;
    }
  },

  /**
   * Get the Cal.com integration for a user
   */
  async getCalIntegration(userUlid: string): Promise<CalendarIntegration | null> {
    try {
      const supabase = createAuthClient();
      const { data, error } = await supabase
        .from('CalendarIntegration')
        .select()
        .eq('userUlid', userUlid)
        .maybeSingle();

      if (error) {
        console.error('[CAL_INTEGRATION_GET_ERROR]', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[CAL_INTEGRATION_GET_ERROR]', error);
      throw error;
    }
  },

  /**
   * Get a user's availability from Cal.com API
   */
  async getUserAvailability(calUserId: number, accessToken: string, date: string): Promise<any> {
    try {
      // Validate the token before making the API call
      if (!accessToken) {
        throw new Error('No access token provided');
      }

      // Format date for Cal.com API (YYYY-MM-DD)
      const formattedDate = new Date(date).toISOString().split('T')[0];
      
      // Call Cal.com API to get user availability
      const response = await fetch(
        `https://api.cal.com/v2/availability?userId=${calUserId}&dateFrom=${formattedDate}&dateTo=${formattedDate}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[CAL_AVAILABILITY_ERROR]', {
          status: response.status,
          error: errorData,
          timestamp: new Date().toISOString()
        });
        throw new Error(`Failed to fetch availability: ${response.status} ${JSON.stringify(errorData)}`);
      }

      const availabilityData = await response.json();
      return availabilityData.data;
    } catch (error) {
      console.error('[CAL_AVAILABILITY_ERROR]', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  /**
   * Check if a user's Cal.com token needs refreshing
   */
  async checkAndRefreshToken(userUlid: string): Promise<string> {
    try {
      const supabase = createAuthClient();
      const { data: integration, error } = await supabase
        .from('CalendarIntegration')
        .select('calAccessToken, calAccessTokenExpiresAt')
        .eq('userUlid', userUlid)
        .single();

      if (error || !integration) {
        console.error('[CAL_TOKEN_CHECK_ERROR]', error);
        throw new Error('Calendar integration not found');
      }

      // Use the utility function from token-service
      const isExpired = await isCalTokenExpired(integration.calAccessTokenExpiresAt, 5); // 5 minutes buffer
      
      if (isExpired) {
        // Use the centralized token refresh
        const result = await refreshCalToken(userUlid);
        if (!result.success || !result.tokens) {
          throw new Error(result.error || 'Failed to refresh token');
        }
        return result.tokens.access_token;
      }

      return integration.calAccessToken;
    } catch (error) {
      console.error('[CAL_TOKEN_CHECK_ERROR]', error);
      throw error;
    }
  },

  /**
   * Fetch a user's Cal.com bookings
   */
  async fetchUserCalBookings(userUlid: string) {
    try {
      // Get the user's Cal.com integration
      const supabase = createAuthClient();
      const { data: integration, error } = await supabase
        .from('CalendarIntegration')
        .select('calAccessToken, calAccessTokenExpiresAt')
        .eq('userUlid', userUlid)
        .single();
      
      if (error) {
        console.error('[CAL_SERVICE_ERROR]', {
          context: 'FETCH_INTEGRATION',
          error,
          userUlid,
          timestamp: new Date().toISOString()
        });
        return {
          success: false,
          error: 'Failed to fetch calendar integration'
        };
      }
      
      if (!integration?.calAccessToken) {
        return {
          success: false,
          error: 'No Cal.com integration found or missing access token'
        };
      }
      
      let accessToken = integration.calAccessToken;
      
      // Check if token needs refreshing
      const isExpired = await isCalTokenExpired(integration.calAccessTokenExpiresAt);
      if (isExpired) {
        console.log('[CAL_SERVICE] Refreshing token before fetching bookings');
        
        const refreshResult = await refreshCalToken(userUlid);
        if (refreshResult.success && refreshResult.tokens?.access_token) {
          accessToken = refreshResult.tokens.access_token;
        }
      }
      
      // Fetch bookings from Cal.com API
      const response = await fetch('https://api.cal.com/v2/bookings', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'cal-api-version': '2024-08-13'
        }
      });
      
      // Handle errors
      if (!response.ok) {
        // If token expired, try refreshing once more (just in case the expiry check missed it)
        if ((response.status === 498 || response.status === 401)) {
          console.log('[CAL_SERVICE] Token appears expired, attempting refresh');
          
          const refreshResult = await refreshCalToken(userUlid);
          if (refreshResult.success && refreshResult.tokens?.access_token) {
            // Retry with new token
            const retryResponse = await fetch('https://api.cal.com/v2/bookings', {
              headers: {
                'Authorization': `Bearer ${refreshResult.tokens.access_token}`,
                'cal-api-version': '2024-08-13'
              }
            });
            
            if (retryResponse.ok) {
              const bookingsData = await retryResponse.json();
              return {
                success: true,
                data: bookingsData
              };
            }
          }
        }
        
        // If we got here, something is still wrong
        console.error('[CAL_SERVICE_ERROR]', {
          context: 'FETCH_BOOKINGS',
          status: response.status,
          statusText: response.statusText,
          userUlid,
          timestamp: new Date().toISOString()
        });
        
        return {
          success: false,
          error: `Failed to fetch bookings: ${response.status} ${response.statusText}`
        };
      }
      
      const bookingsData = await response.json();
      return {
        success: true,
        data: bookingsData
      };
      
    } catch (error) {
      console.error('[CAL_SERVICE_ERROR]', {
        context: 'GENERAL',
        error,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        error: 'Error fetching bookings'
      };
    }
  }
}; 