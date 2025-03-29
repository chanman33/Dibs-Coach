import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { createAuthClient } from '@/utils/auth'
import { createFreeIntroCallEventType } from '@/utils/actions/cal-event-type-actions'

/**
 * This API route creates free intro call event types for all coaches who don't already have one.
 * It's useful for bulk creating these event types for existing coaches.
 */
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
      console.error('[ADMIN_FREE_INTRO_AUTH_ERROR]', {
        error: userError,
        userId,
        timestamp: new Date().toISOString()
      })
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check if user has SYSTEM_OWNER role
    if (userData.systemRole !== 'SYSTEM_OWNER' && userData.systemRole !== 'SYSTEM_MODERATOR') {
      console.log('[ADMIN_FREE_INTRO_AUTH_DENIED]', {
        userId,
        role: userData.systemRole,
        timestamp: new Date().toISOString()
      })
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Get all users with coach capability
    const { data: coachUsers, error: coachError } = await supabase
      .from('User')
      .select('ulid')
      .contains('capabilities', ['COACH'])
    
    if (coachError) {
      console.error('[ADMIN_FREE_INTRO_COACH_ERROR]', {
        error: coachError,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        error: 'Failed to fetch coach users' 
      }, { 
        status: 500 
      })
    }
    
    if (!coachUsers || coachUsers.length === 0) {
      return NextResponse.json({
        success: true,
        stats: { total: 0, created: 0, skipped: 0, errors: 0 }
      })
    }
    
    // Stats to track results
    const stats = {
      total: coachUsers.length,
      created: 0,
      skipped: 0,
      errors: 0
    }
    
    // Process each coach
    for (const coach of coachUsers) {
      try {
        // Create free intro call event type for this coach
        const result = await createFreeIntroCallEventType(coach.ulid)
        
        if (result.error) {
          console.error('[ADMIN_FREE_INTRO_CREATE_ERROR]', {
            error: result.error,
            coachUlid: coach.ulid,
            timestamp: new Date().toISOString()
          })
          stats.errors++
        } else {
          console.log('[ADMIN_FREE_INTRO_CREATE_SUCCESS]', {
            coachUlid: coach.ulid,
            timestamp: new Date().toISOString()
          })
          stats.created++
        }
      } catch (error) {
        console.error('[ADMIN_FREE_INTRO_CREATE_ERROR]', {
          error,
          coachUlid: coach.ulid,
          timestamp: new Date().toISOString()
        })
        stats.errors++
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('[ADMIN_FREE_INTRO_ERROR]', {
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