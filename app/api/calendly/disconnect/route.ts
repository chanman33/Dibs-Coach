import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAuthClient } from '@/utils/auth'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { ApiResponse } from '@/utils/types/api'

export async function POST(req: Request) {
  try {
    // Get the user ID from Clerk
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ 
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, { status: 401 })
    }
    
    // Get the user ULID from the database
    const supabase = await createAuthClient()
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single()
      
    if (userError || !user) {
      return NextResponse.json({ 
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, { status: 404 })
    }
    
    // Initialize Calendly service with the user's ULID
    const calendlyService = new CalendlyService(user.ulid)
    await calendlyService.init()
    
    // Disconnect Calendly
    await calendlyService.disconnectCalendly()
    
    return NextResponse.json({ 
      success: true,
      message: 'Calendly disconnected successfully'
    })
  } catch (error) {
    console.error('[CALENDLY_DISCONNECT_ERROR]', error)
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to disconnect Calendly'
    }, { status: 500 })
  }
} 