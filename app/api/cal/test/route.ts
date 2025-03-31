import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { makeCalApiRequest, getCalOAuthHeaders } from '@/utils/cal/cal-api-utils';

export async function GET() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Test routes are only available in development' },
        { status: 403 }
      );
    }

    // First, create a test managed user
    const createUserData = await makeCalApiRequest({
      endpoint: `/oauth-clients/${env.NEXT_PUBLIC_CAL_CLIENT_ID}/users`,
      method: 'POST',
      headers: getCalOAuthHeaders(),
      body: {
        email: `test-user-${Date.now()}@example.com`,
        name: 'Test User',
        timeZone: 'America/New_York',
        timeFormat: 12,
        weekStart: 'Monday',
        locale: 'en',
      },
    });

    // Then, list all managed users to verify
    const listUsersData = await makeCalApiRequest({
      endpoint: `/oauth-clients/${env.NEXT_PUBLIC_CAL_CLIENT_ID}/users`,
      headers: getCalOAuthHeaders(),
    });

    return NextResponse.json({
      success: true,
      message: 'OAuth credentials are working',
      data: {
        createdUser: createUserData,
        managedUsers: listUsersData,
      },
    });
  } catch (error) {
    console.error('[CAL_TEST_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { error: 'Failed to test OAuth credentials', details: error },
      { status: 500 }
    );
  }
} 