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
          'x-cal-secret-key': env.CAL_CLIENT_SECRET,
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
   * Refresh the Cal.com access token
   */
  async refreshCalToken(userUlid: string): Promise<CalTokenData> {
    try {
      const supabase = createAuthClient();
      
      // Get the current integration data
      const { data: integration, error: fetchError } = await supabase
        .from('CalendarIntegration')
        .select()
        .eq('userUlid', userUlid)
        .single();

      if (fetchError) {
        console.error('[CAL_TOKEN_FETCH_ERROR]', fetchError);
        throw new Error('Calendar integration not found');
      }

      // Call the Cal.com API to refresh the token
      const response = await fetch(
        `https://api.cal.com/v2/oauth-clients/${env.NEXT_PUBLIC_CAL_CLIENT_ID}/refresh`,
        {
          method: 'POST',
          headers: {
            'x-cal-secret-key': env.CAL_CLIENT_SECRET,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken: integration.calRefreshToken,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to refresh Cal.com token: ${JSON.stringify(error)}`);
      }

      const tokenData = await response.json();
      const now = new Date().toISOString();
      
      // Update the database with the new tokens
      const { error: updateError } = await supabase
        .from('CalendarIntegration')
        .update({
          calAccessToken: tokenData.accessToken,
          calRefreshToken: tokenData.refreshToken,
          calAccessTokenExpiresAt: new Date(tokenData.accessTokenExpiresAt).toISOString(),
          lastSyncedAt: now,
          updatedAt: now
        })
        .eq('userUlid', userUlid);

      if (updateError) {
        console.error('[CAL_TOKEN_UPDATE_ERROR]', updateError);
        throw updateError;
      }

      return {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        accessTokenExpiresAt: tokenData.accessTokenExpiresAt,
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
   * Check if a user's Cal.com token needs refreshing
   */
  async checkAndRefreshToken(userUlid: string): Promise<string> {
    try {
      const supabase = createAuthClient();
      const { data: integration, error } = await supabase
        .from('CalendarIntegration')
        .select()
        .eq('userUlid', userUlid)
        .single();

      if (error) {
        console.error('[CAL_TOKEN_CHECK_ERROR]', error);
        throw new Error('Calendar integration not found');
      }

      // If token expires within the next 5 minutes, refresh it
      const now = new Date();
      const expiresAt = new Date(integration.calAccessTokenExpiresAt);
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      if (expiresAt < fiveMinutesFromNow) {
        const newTokens = await this.refreshCalToken(userUlid);
        return newTokens.accessToken;
      }

      return integration.calAccessToken;
    } catch (error) {
      console.error('[CAL_TOKEN_CHECK_ERROR]', error);
      throw error;
    }
  },
}; 