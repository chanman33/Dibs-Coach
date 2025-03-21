import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function GET() {
  try {
    // First, create a test managed user
    const createUserResponse = await fetch(
      `https://api.cal.com/v2/oauth-clients/${env.NEXT_PUBLIC_CAL_CLIENT_ID}/users`,
      {
        method: 'POST',
        headers: {
          'x-cal-secret-key': env.CAL_CLIENT_SECRET,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `test-user-${Date.now()}@example.com`,
          name: 'Test User',
          timeZone: 'America/New_York',
          timeFormat: 12,
          weekStart: 'Monday',
          locale: 'en',
        }),
      }
    );

    if (!createUserResponse.ok) {
      const error = await createUserResponse.json();
      return NextResponse.json(
        { error: 'Failed to create managed user', details: error },
        { status: createUserResponse.status }
      );
    }

    const createUserData = await createUserResponse.json();

    // Then, list all managed users to verify
    const listUsersResponse = await fetch(
      `https://api.cal.com/v2/oauth-clients/${env.NEXT_PUBLIC_CAL_CLIENT_ID}/users`,
      {
        headers: {
          'x-cal-secret-key': env.CAL_CLIENT_SECRET,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!listUsersResponse.ok) {
      const error = await listUsersResponse.json();
      return NextResponse.json(
        { error: 'Failed to list managed users', details: error },
        { status: listUsersResponse.status }
      );
    }

    const listUsersData = await listUsersResponse.json();

    return NextResponse.json({
      success: true,
      message: 'OAuth credentials are working',
      data: {
        createdUser: createUserData,
        managedUsers: listUsersData,
      },
    });
  } catch (error) {
    console.error('Cal.com OAuth test error:', error);
    return NextResponse.json(
      { error: 'Failed to test OAuth credentials', details: error },
      { status: 500 }
    );
  }
} 