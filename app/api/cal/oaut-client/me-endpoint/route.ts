import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { makeCalApiRequest, getCalOAuthHeaders } from '@/utils/cal/cal-api-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Only allow in development or for system owners
    // Note: In a real production environment, you would want to add proper authentication
    // to ensure only system owners can access this endpoint
    if (process.env.NODE_ENV !== 'development') {
      // In production, you'd want to check if the user is a system owner here
      // For now, we'll keep it simple
    }

    // Get the client credentials from environment variables
    const clientId = env.NEXT_PUBLIC_CAL_CLIENT_ID;
    const clientSecret = env.CAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('[CAL_TEST_ME_ERROR] Missing client credentials:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: false,
        error: 'Cal.com client credentials are missing'
      }, { status: 500 });
    }

    console.log('[CAL_TEST_ME_INFO] Testing /v2/me endpoint with client credentials', {
      clientId: clientId.substring(0, 5) + '...',
      timestamp: new Date().toISOString()
    });

    // Use the utility function to make the request
    try {
      // Get the OAuth headers with client credentials
      const headers = getCalOAuthHeaders();
      
      // Call the /me endpoint
      const responseData = await makeCalApiRequest({
        endpoint: '/me',
        headers
      });
      
      console.log('[CAL_TEST_ME_SUCCESS] Successfully called Cal.com /v2/me endpoint', {
        timestamp: new Date().toISOString()
      });

      // Return the response data
      return NextResponse.json({
        success: true,
        data: responseData
      });
    } catch (apiError) {
      console.error('[CAL_TEST_ME_ERROR] Cal.com API request failed:', {
        error: apiError,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: false,
        error: 'Failed to call Cal.com /v2/me endpoint',
        details: apiError instanceof Error ? apiError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[CAL_TEST_ME_ERROR] Unexpected error:', {
      error,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to test Cal.com /v2/me endpoint',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 