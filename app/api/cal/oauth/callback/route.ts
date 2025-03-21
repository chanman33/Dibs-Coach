import { NextResponse } from 'next/server';
import { calOAuthClient } from '@/lib/cal/cal-oauth';
import { env } from '@/lib/env';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Cal.com OAuth error:', error);
    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_CAL_BOOKING_CANCEL_URL}?error=${error}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_CAL_BOOKING_CANCEL_URL}?error=no_code`
    );
  }

  try {
    const token = await calOAuthClient.getAccessToken(code);
    
    // Here you would typically:
    // 1. Store the token securely (e.g., in your database)
    // 2. Associate it with the current user
    // 3. Set up a refresh token rotation mechanism
    
    return NextResponse.redirect(
      env.NEXT_PUBLIC_CAL_BOOKING_SUCCESS_URL
    );
  } catch (error) {
    console.error('Failed to get access token:', error);
    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_CAL_BOOKING_CANCEL_URL}?error=token_error`
    );
  }
} 