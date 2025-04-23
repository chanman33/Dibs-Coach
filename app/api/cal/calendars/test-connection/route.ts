import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAuthClient } from '@/utils/auth';
import { ensureValidCalToken } from '@/utils/actions/cal/cal-tokens';

/**
 * Test Cal.com API Connection
 * 
 * This endpoint tests the Cal.com API connectivity by attempting a basic API call.
 * It's used to verify if the user's Cal.com token is actually working, rather than
 * just checking database values.
 */
export async function GET() {
  try {
    // Authenticate the user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not authenticated' 
      }, { status: 401 });
    }

    // Get the user's ULID
    const supabase = createAuthClient();
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('clerkId', userId)
      .single();
      
    if (userError || !userData) {
      console.error('[CAL_API_TEST] User not found', {
        clerkId: userId,
        error: userError
      });
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    const userUlid = userData.ulid;
    
    // Get user's calendar integration data to find Cal.com managed user ID
    const { data: integration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('calManagedUserId')
      .eq('userUlid', userUlid)
      .single();
      
    if (integrationError || !integration) {
      console.error('[CAL_API_TEST] Calendar integration not found', {
        userUlid,
        error: integrationError
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Calendar integration not found' 
      }, { status: 404 });
    }
    
    // Try to get a valid token
    console.log('[CAL_API_TEST] Getting valid token for', { userUlid });
    const tokenResult = await ensureValidCalToken(userUlid, true); // Force refresh for thorough testing
    
    if (!tokenResult.success || !tokenResult.accessToken) {
      console.error('[CAL_API_TEST] Failed to get valid token', {
        userUlid,
        error: tokenResult.error
      });
      return NextResponse.json({ 
        success: false, 
        error: `Token validation failed: ${tokenResult.error || 'Unknown error'}` 
      }, { status: 500 });
    }
    
    // Make a basic API call to Cal.com
    console.log('[CAL_API_TEST] Testing API with valid token');
    const apiResponse = await fetch('https://api.cal.com/v2/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenResult.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error('[CAL_API_TEST] Cal.com API call failed', {
        status: apiResponse.status,
        response: errorBody
      });
      
      return NextResponse.json({ 
        success: false, 
        error: `Cal.com API returned error: ${apiResponse.status}`,
        details: errorBody
      }, { status: 500 });
    }
    
    // Successfully called the API
    const apiData = await apiResponse.json();
    
    return NextResponse.json({
      success: true,
      data: {
        apiVersion: apiData.apiVersion,
        message: 'Calendar API connection successful'
      }
    });
  } catch (error) {
    console.error('[CAL_API_TEST] Unexpected error', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to test API connection' 
    }, { status: 500 });
  }
} 