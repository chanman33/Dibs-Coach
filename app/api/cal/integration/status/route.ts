import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { auth } from '@clerk/nextjs'
import type { CalendarIntegrationRecord } from '@/utils/types/cal-managed-user'

/**
 * API endpoint to check calendar connection flags in CalendarIntegration table
 * Returns { success: true/false, data: { isConnected: boolean, googleCalendarConnected: boolean, office365CalendarConnected: boolean } }
 */
export async function GET() {
  try {
    // Get the user's ID from auth
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not authenticated' 
      }, { status: 401 })
    }

    console.log('[CAL_INTEGRATION_STATUS_DEBUG] Checking calendar flags for user:', userId);

    // Get the user's ULID and calendar integration status from the database
    const supabase = createAuthClient()
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()

    if (userError) {
      console.error('[CAL_INTEGRATION_STATUS_ERROR]', {
        error: userError,
        userId,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to find user in database' 
      }, { status: 500 })
    }

    // If user not found (edge case after auth check?)
    if (!userData) {
      console.error('[CAL_INTEGRATION_STATUS_ERROR] User data not found after successful auth lookup', { userId });
      return NextResponse.json({ success: false, error: 'User data not found' }, { status: 404 });
    }

    console.log('[CAL_INTEGRATION_STATUS_DEBUG] Found user ULID:', { userUlid: userData.ulid });

    // Get calendar integration status - Use maybeSingle()
    const { data: integrationData, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('googleCalendarConnected, office365CalendarConnected, isManagedUser')
      .eq('userUlid', userData.ulid)
      .maybeSingle()

    // Explicitly type the result
    const integration = integrationData as CalendarIntegrationRecord | null;

    if (integrationError) {
      // Log the error but don't necessarily fail if it's "No rows found"
      // PGRST116 indicates no rows found, which is valid if not integrated yet
      if (integrationError.code === 'PGRST116') {
         console.log('[CAL_INTEGRATION_STATUS_DEBUG] No integration record found for user:', { userUlid: userData.ulid });
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
          userUlid: userData.ulid,
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
      console.log('[CAL_INTEGRATION_STATUS_DEBUG] No integration record found (null data) for user:', { userUlid: userData.ulid });
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
      userUlid: userData.ulid,
      isConnected: integration.isManagedUser || false, 
      googleCalendarConnected: integration.googleCalendarConnected || false,
      office365CalendarConnected: integration.office365CalendarConnected || false,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: {
        isConnected: integration.isManagedUser || false, 
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