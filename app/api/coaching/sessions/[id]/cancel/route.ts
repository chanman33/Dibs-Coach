import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const sessionId = params.id
    if (!sessionId) {
      return new NextResponse('Session ID is required', { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    )

    // Get user's database ID
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single()

    if (userError || !user) {
      return new NextResponse(userError ? 'Error fetching user data' : 'User not found', { 
        status: userError ? 500 : 404 
      })
    }

    // Get session and verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('Session')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return new NextResponse(sessionError ? 'Error fetching session' : 'Session not found', { 
        status: sessionError ? 500 : 404 
      })
    }

    // Verify user is either the coach or mentee
    if (session.coachDbId !== user.id && session.menteeDbId !== user.id) {
      return new NextResponse('Unauthorized to cancel this session', { status: 403 })
    }

    // Verify session can be cancelled (not already cancelled or completed)
    if (session.status !== 'scheduled') {
      return new NextResponse(`Cannot cancel a session that is ${session.status}`, { 
        status: 400 
      })
    }

    // Cancel the session
    const { error: updateError } = await supabase
      .from('Session')
      .update({
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('[CANCEL_SESSION_ERROR]', updateError)
      return new NextResponse('Failed to cancel session', { status: 500 })
    }

    // TODO: Handle refund if payment was made
    // TODO: Send cancellation notifications
    // TODO: Remove calendar invites

    return new NextResponse(null, { status: 204 })

  } catch (error) {
    console.error('[CANCEL_SESSION_ERROR]', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 