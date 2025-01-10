import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ROLES } from '@/utils/roles/roles'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params
    const menteeId = Number(resolvedParams.id)
    if (!menteeId || isNaN(menteeId)) {
      return new NextResponse('Valid mentee ID is required', { status: 400 })
    }

    const body = await req.json()
    if (!body.content?.trim()) {
      return new NextResponse('Note content is required', { status: 400 })
    }

    // Auth check
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get coach's database ID and verify role
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('id, role')
      .eq('userId', userId)
      .single()

    if (userError || !userData) {
      console.error('[ADD_NOTE_ERROR] User lookup:', userError)
      return new NextResponse('User not found', { status: 404 })
    }

    if (userData.role !== ROLES.REALTOR_COACH) {
      return new NextResponse('Unauthorized - Not a coach', { status: 403 })
    }

    // Verify this mentee has sessions with this coach and get the most recent session
    const { data: sessionCheck, error: sessionError } = await supabase
      .from('Session')
      .select('id')
      .eq('coachDbId', userData.id)
      .eq('menteeDbId', menteeId)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    if (sessionError || !sessionCheck) {
      return new NextResponse('Mentee not found or not authorized', { status: 404 })
    }

    // Create the note
    const { data: note, error: noteError } = await supabase
      .from('Note')
      .insert({
        content: body.content.trim(),
        relatedUserDbId: menteeId,
        authorDbId: userData.id,
        sessionId: sessionCheck.id,
        visibility: 'private',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (noteError) {
      console.error('[ADD_NOTE_ERROR] Note creation:', noteError)
      return new NextResponse('Failed to create note', { status: 500 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error('[ADD_NOTE_ERROR]', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 