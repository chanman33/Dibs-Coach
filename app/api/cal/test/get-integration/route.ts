import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createAuthClient } from '@/utils/auth';
import { withApiAuth } from '@/utils/middleware/withApiAuth';
import { ApiResponse } from '@/utils/types/api';
import { Database } from '@/types/supabase';

type DbCalendarIntegration = {
  ulid: string;
  userUlid: string;
  calManagedUserId: number;
  calAccessToken: string;
  calRefreshToken: string;
  calAccessTokenExpiresAt: string;
};

// Based on the actual schema in prisma/schema.prisma
interface CalIntegrationResponse {
  integration: {
    id: string;
    userUlid: string;
    calManagedUserId: number;
    calAccessToken: string;
    calRefreshToken: string;
    calAccessTokenExpiresAt: string;
  } | null;
}

export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const supabase = createAuthClient();
    const url = new URL(request.url);
    const useTestUser = url.searchParams.get('lastTestUser') === 'true';
    
    let userUlid: string;
    
    if (useTestUser) {
      // For test purposes, get the most recently created test user
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
      
      if (userError || !user) {
        console.error('[GET_USER_ERROR]', userError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to fetch user data' 
        }, { status: 500 });
      }

      userUlid = user.ulid;
    }
    
    // Get Cal.com integration data from the CalendarIntegration table
    const { data: integration, error } = await supabase
      .from('CalendarIntegration')
      .select('ulid, userUlid, calManagedUserId, calAccessToken, calRefreshToken, calAccessTokenExpiresAt')
      .eq('provider', 'CAL')
      .eq('userUlid', userUlid)
      .maybeSingle() as { data: DbCalendarIntegration | null, error: any };

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
        success: true,
        data: {
          integration: null
        }
      }, { status: 404 });
    }

    // Map the integration data to match the expected interface
    const mappedIntegration: NonNullable<CalIntegrationResponse['integration']> = {
      id: integration.ulid,
      userUlid: integration.userUlid,
      calManagedUserId: integration.calManagedUserId,
      calAccessToken: integration.calAccessToken,
      calRefreshToken: integration.calRefreshToken,
      calAccessTokenExpiresAt: integration.calAccessTokenExpiresAt
    };

    console.log('[DEBUG] Returning integration:', {
      ...mappedIntegration,
      calAccessToken: '***',
      calRefreshToken: '***'
    });

    return NextResponse.json({
      success: true,
      data: { 
        integration: mappedIntegration
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