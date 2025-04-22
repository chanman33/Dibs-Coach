import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import type { CalendarIntegrationRecord } from '@/utils/types/cal-managed-user'
import { getAuthenticatedUserUlid } from '@/utils/auth'

/**
 * API endpoint to check calendar connection flags in CalendarIntegration table
 * Returns { success: true/false, data: { isConnected: boolean, googleCalendarConnected: boolean, office365CalendarConnected: boolean } }
 */
export async function GET() {
  try {
    console.log('[CAL_INTEGRATION_STATUS_DEBUG] Checking calendar flags');
    
    // Get authenticated user using the centralized helper
    const authResult = await getAuthenticatedUserUlid();
    if (authResult.error || !authResult.data) {
      return NextResponse.json({ 
        success: false, 
        error: authResult.error?.message || 'Authentication failed' 
      }, { status: authResult.error?.code === 'UNAUTHORIZED' ? 401 : 500 });
    }

    const userUlid = authResult.data.userUlid;
    console.log('[CAL_INTEGRATION_STATUS_DEBUG] Found user ULID:', { userUlid });

    // Initialize Supabase client
    const supabase = createAuthClient();
    
    // Get calendar integration status - Use maybeSingle()
    const { data: integrationData, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('googleCalendarConnected, office365CalendarConnected')
      .eq('userUlid', userUlid)
      .maybeSingle()

    // Explicitly type the result
    const integration = integrationData as CalendarIntegrationRecord | null;

    if (integrationError) {
      // Log the error but don't necessarily fail if it's "No rows found"
      // PGRST116 indicates no rows found, which is valid if not integrated yet
      if (integrationError.code === 'PGRST116') {
         console.log('[CAL_INTEGRATION_STATUS_DEBUG] No integration record found for user:', { userUlid });
         // Return success: false, but with data indicating no connection
         return NextResponse.json({
           success: true, // Request succeeded, but integration doesn't exist
           data: {
             isConnected: false, // Add explicit isConnected flag
             googleCalendarConnected: false,
             office365CalendarConnected: false
           }
         });
      } else {
        // Handle other potential database errors
        console.error('[CAL_INTEGRATION_STATUS_DB_ERROR]', {
          error: integrationError,
          userUlid,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to query integration status' 
        }, { status: 500 });
      }
    }
    
    // If maybeSingle() returns null data (no record found)
    if (!integration) {
      console.log('[CAL_INTEGRATION_STATUS_DEBUG] No integration record found (null data) for user:', { userUlid });
      return NextResponse.json({
        success: true,
        data: {
          isConnected: false,
          googleCalendarConnected: false,
          office365CalendarConnected: false
        }
      });
    }

    // Integration record exists - Use the typed object, no need for 'as any'
    console.log('[CAL_INTEGRATION_STATUS_DEBUG] Calendar integration flags:', {
      userUlid,
      isConnected: true,
      googleCalendarConnected: integration.googleCalendarConnected || false,
      office365CalendarConnected: integration.office365CalendarConnected || false,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: {
        isConnected: true,
        googleCalendarConnected: integration.googleCalendarConnected || false,
        office365CalendarConnected: integration.office365CalendarConnected || false
      }
    })
  } catch (error) {
    console.error('[CAL_INTEGRATION_STATUS_ERROR]', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check calendar integration status' 
    }, { status: 500 })
  }
} 