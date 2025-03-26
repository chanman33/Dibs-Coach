import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createAuthClient } from '@/utils/auth';
import { withApiAuth } from '@/utils/middleware/withApiAuth';
import { ApiResponse } from '@/utils/types/api';

// Based on the actual schema in prisma/schema.prisma
interface CalIntegrationResponse {
  integration: {
    ulid: string;
    userUlid: string;
    provider: string;
    calManagedUserId: number;
    calUsername: string;
    calAccessToken: string;
    calRefreshToken: string;
    calAccessTokenExpiresAt: string;
    defaultScheduleId: number | null;
    timeZone: string | null;
    weekStart: string | null;
    timeFormat: number | null;
    locale: string | null;
    lastSyncedAt: string | null;
    syncEnabled: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createAuthClient();
    const url = new URL(request.url);
    const useTestUser = url.searchParams.get('lastTestUser') === 'true';
    
    let userUlid: string;
    
    if (useTestUser) {
      // For test purposes, get the most recently created test user
      // This is useful for the Cal DB Test page
      const { data: testUser, error: testUserError } = await supabase
        .from('User')
        .select('ulid')
        .like('userId', 'test_%')
        .order('createdAt', { ascending: false })
        .limit(1)
        .single();
      
      if (testUserError || !testUser) {
        console.error('[GET_TEST_USER_ERROR]', testUserError || 'No test user found');
        return NextResponse.json({ 
          success: false, 
          error: 'No test user found. Please create a test user first.' 
        }, { status: 404 });
      }
      
      userUlid = testUser.ulid;
      console.log('[USING_TEST_USER]', { userUlid });
    } else {
      // Regular flow - get the logged-in user's ULID
      const { data: user, error: userError } = await supabase
        .from('User')
        .select('ulid')
        .eq('userId', userId)
        .single();
      
      if (userError) {
        console.error('[GET_USER_ERROR]', userError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to fetch user data' 
        }, { status: 500 });
      }

      userUlid = user?.ulid;
    }
    
    // Get Cal.com integration data from the CalendarIntegration table
    const { data: integration, error } = await supabase
      .from('CalendarIntegration')
      .select('*')
      .eq('provider', 'CAL')
      .eq('userUlid', userUlid)
      .maybeSingle();

    if (error) {
      console.error('[GET_CAL_INTEGRATION_ERROR]', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch Cal.com integration' 
      }, { status: 500 });
    }

    // If no integration found, return a clear error message
    if (!integration) {
      console.log('[NO_CAL_INTEGRATION_FOUND]', { 
        userId, 
        userUlid, 
        isTestUser: useTestUser 
      });
      
      const errorMessage = useTestUser
        ? 'No Cal.com integration found for the test user. Please create a test user with Cal.com integration first.'
        : 'No Cal.com integration found for this user. Please connect your Cal.com account first.';
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        data: null
      }, { status: 404 });
    }

    // In a real app, we should never return the full tokens to the client
    // This is only for testing purposes
    return NextResponse.json({
      success: true,
      data: { 
        integration: {
          ...integration,
          calAccessToken: integration.calAccessToken ? 
            `${integration.calAccessToken.substring(0, 10)}...` : null,
          calRefreshToken: integration.calRefreshToken ? 
            `${integration.calRefreshToken.substring(0, 10)}...` : null
        }
      }
    });

  } catch (error) {
    console.error('[GET_CAL_INTEGRATION_ERROR]', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export const GET_WITH_AUTH = withApiAuth<CalIntegrationResponse>(async (req, { userUlid }) => {
  try {
    const supabase = await createAuthClient();
    
    // Get the user's Cal.com integration if it exists
    const { data, error } = await supabase
      .from('CalendarIntegration')
      .select('*')
      .eq('userUlid', userUlid)
      .eq('provider', 'CAL')
      .maybeSingle();
    
    if (error) {
      console.error('[GET_CAL_INTEGRATION_ERROR]', { 
        error,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json<ApiResponse<CalIntegrationResponse>>({
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch Cal.com integration'
        }
      }, { status: 500 });
    }
    
    return NextResponse.json<ApiResponse<CalIntegrationResponse>>({
      data: {
        integration: data
      },
      error: null
    });
  } catch (error) {
    console.error('[GET_CAL_INTEGRATION_ERROR]', { 
      error,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json<ApiResponse<CalIntegrationResponse>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 });
  }
}); 