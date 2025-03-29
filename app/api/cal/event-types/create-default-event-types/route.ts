import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { createDefaultEventTypesForAllCoaches } from '@/utils/actions/cal-event-type-actions'
import { createAuthClient } from '@/utils/auth'

export async function POST() {
  try {
    // Get the user's ID and check admin permissions
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check if user is a system owner/admin by querying the database
    const supabase = createAuthClient()
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('systemRole')
      .eq('userId', userId)
      .single()

    if (userError || !userData) {
      console.error('[ADMIN_AUTH_ERROR]', {
        error: userError,
        userId,
        timestamp: new Date().toISOString()
      })
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check if user has SYSTEM_OWNER role
    if (userData.systemRole !== 'SYSTEM_OWNER' && userData.systemRole !== 'SYSTEM_MODERATOR') {
      console.log('[ADMIN_AUTH_DENIED]', {
        userId,
        role: userData.systemRole,
        timestamp: new Date().toISOString()
      })
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Call the function to create default event types
    const result = await createDefaultEventTypesForAllCoaches()

    if (result.error) {
      console.error('[ADMIN_CREATE_DEFAULT_EVENT_TYPES_ERROR]', {
        error: result.error,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        error: result.error 
      }, { 
        status: 500 
      })
    }

    // Return success response
    return NextResponse.json({
      success: true,
      stats: result.data?.stats
    })
  } catch (error) {
    console.error('[ADMIN_CREATE_DEFAULT_EVENT_TYPES_ERROR]', {
      error,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json({
      error: {
        message: 'An unexpected error occurred'
      }
    }, {
      status: 500
    })
  }
} 