import { NextResponse } from 'next/server'
import { createAuthClient } from '@/utils/auth'
import { auth } from '@clerk/nextjs'

/**
 * API endpoint to check calendar connection flags in CalendarIntegration table
 * Returns { success: true/false, data: { googleCalendarConnected: boolean, office365CalendarConnected: boolean } }
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

    // Get calendar integration status
    const { data: integration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('googleCalendarConnected, office365CalendarConnected')
      .eq('userUlid', userData.ulid)
      .single()

    if (integrationError) {
      console.error('[CAL_INTEGRATION_STATUS_ERROR]', {
        error: integrationError,
        userUlid: userData.ulid,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch integration status' 
      }, { status: 500 })
    }

    console.log('[CAL_INTEGRATION_STATUS_DEBUG] Calendar integration flags:', {
      userUlid: userData.ulid,
      googleCalendarConnected: integration?.googleCalendarConnected || false,
      office365CalendarConnected: integration?.office365CalendarConnected || false,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: {
        googleCalendarConnected: integration?.googleCalendarConnected || false,
        office365CalendarConnected: integration?.office365CalendarConnected || false
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