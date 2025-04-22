'use server';

import { auth } from '@clerk/nextjs/server';
import { createAuthClient } from '@/utils/auth';
import { ApiResponse } from '@/utils/types/api';

// Type for calendar integration data
type CalendarIntegrationData = {
  ulid: string;
  calManagedUserId?: string;
  calUsername?: string;
};

/**
 * Get authenticated user's ULID from the database
 * 
 * This helper function consolidates duplicate code for:
 * 1. Checking user authentication
 * 2. Retrieving user's ULID from database
 * 
 * @returns ApiResponse with userUlid, or error if authentication/database fails
 */
export async function getAuthenticatedUserUlid(): Promise<ApiResponse<{ userUlid: string }>> {
  // Get authenticated user
  const { userId } = auth();
  if (!userId) {
    return {
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
    };
  }

  // Initialize Supabase client
  const supabase = createAuthClient();

  // Get the user's ULID
  const { data: userData, error: userError } = await supabase
    .from('User')
    .select('ulid')
    .eq('userId', userId)
    .single();

  if (userError) {
    console.error('[CAL_AUTH_ERROR] User lookup', { 
      error: userError, 
      userId,
      timestamp: new Date().toISOString()
    });
    return {
      data: null,
      error: { code: 'DATABASE_ERROR', message: 'Failed to find user in database' }
    };
  }

  return {
    data: { userUlid: userData.ulid },
    error: null
  };
}

/**
 * Get calendar integration information for a user
 * 
 * This helper function retrieves calendar integration details needed for
 * operations involving Cal.com event types.
 * 
 * @param userUlid User's ULID
 * @param include Optional fields to include in the query
 * @returns ApiResponse with calendar integration or error
 */
export async function getCalendarIntegration(
  userUlid: string,
  include: {
    calManagedUserId?: boolean;
    calUsername?: boolean;
  } = { calManagedUserId: true }
): Promise<ApiResponse<{ 
  integrationUlid: string;
  calManagedUserId?: string;
  calUsername?: string;
}>> {
  if (!userUlid) {
    return {
      data: null,
      error: { code: 'INVALID_INPUT', message: 'User ULID is required' }
    };
  }

  // Initialize Supabase client
  const supabase = createAuthClient();

  // Build the field selection based on includes
  const selectFields = ['ulid'];
  if (include.calManagedUserId) selectFields.push('calManagedUserId');
  if (include.calUsername) selectFields.push('calUsername');

  try {
    // Execute the query
    const { data, error: calendarError } = await supabase
      .from('CalendarIntegration')
      .select(selectFields.join(', '))
      .eq('userUlid', userUlid)
      .maybeSingle();

    if (calendarError) {
      console.error('[CAL_AUTH_ERROR] Calendar integration lookup', { 
        error: calendarError, 
        userUlid,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch calendar integration' }
      };
    }

    if (!data) {
      console.error('[CAL_AUTH_ERROR] No calendar integration found', { 
        userUlid,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: { code: 'NOT_FOUND', message: 'No calendar integration found for this user' }
      };
    }

    // Safe access to data fields using optional chaining
    // Use type assertion to avoid TypeScript errors with Supabase types
    const integration = data as any;

    // Prepare the response with the ulid
    const response: { 
      integrationUlid: string;
      calManagedUserId?: string;
      calUsername?: string;
    } = {
      integrationUlid: integration.ulid
    };

    // Validate and include calManagedUserId if requested and available
    if (include.calManagedUserId) {
      if (!integration.calManagedUserId) {
        console.error('[CAL_AUTH_ERROR] No Cal.com managed user ID found', { 
          userUlid,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: { 
            code: 'INVALID_STATE', 
            message: 'No Cal.com managed user found for this user. Please reconnect Cal.com in settings.'
          }
        };
      }
      response.calManagedUserId = integration.calManagedUserId;
    }

    // Validate and include calUsername if requested and available
    if (include.calUsername) {
      if (!integration.calUsername) {
        console.error('[CAL_AUTH_ERROR] No Cal.com username found', { 
          userUlid,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: { 
            code: 'INVALID_STATE', 
            message: 'No Cal.com username found for this user. Please reconnect Cal.com in settings.'
          }
        };
      }
      response.calUsername = integration.calUsername;
    }

    return {
      data: response,
      error: null
    };
  } catch (error) {
    console.error('[CAL_AUTH_ERROR] Unexpected error fetching calendar integration', { 
      error, 
      userUlid,
      timestamp: new Date().toISOString()
    });
    return {
      data: null,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    };
  }
}

/**
 * Combined helper to get authenticated user and calendar integration in one call
 * 
 * @param include Optional fields to include from calendar integration
 * @returns ApiResponse with both userUlid and calendar integration details
 */
export async function getAuthenticatedCalUser(
  include: {
    calManagedUserId?: boolean;
    calUsername?: boolean;
  } = { calManagedUserId: true }
): Promise<ApiResponse<{
  userUlid: string;
  integrationUlid: string;
  calManagedUserId?: string;
  calUsername?: string;
}>> {
  try {
    // First get the authenticated user's ULID
    const userResult = await getAuthenticatedUserUlid();
    if (userResult.error || !userResult.data) {
      return {
        data: null,
        error: userResult.error || { code: 'INTERNAL_ERROR', message: 'Unknown error occurred' }
      };
    }

    const userUlid = userResult.data.userUlid;

    // Then get the calendar integration
    const integrationResult = await getCalendarIntegration(userUlid, include);
    if (integrationResult.error || !integrationResult.data) {
      return {
        data: null,
        error: integrationResult.error || { code: 'INTERNAL_ERROR', message: 'Unknown error occurred' }
      };
    }

    // Combine the results
    return {
      data: {
        userUlid,
        integrationUlid: integrationResult.data.integrationUlid,
        ...(integrationResult.data.calManagedUserId && { 
          calManagedUserId: integrationResult.data.calManagedUserId 
        }),
        ...(integrationResult.data.calUsername && { 
          calUsername: integrationResult.data.calUsername 
        })
      },
      error: null
    };
  } catch (error) {
    console.error('[CAL_AUTH_ERROR] Unexpected error in getAuthenticatedCalUser', { 
      error,
      timestamp: new Date().toISOString()
    });
    return {
      data: null,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    };
  }
} 