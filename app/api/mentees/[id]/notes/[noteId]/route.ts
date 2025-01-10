import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ROLES } from '@/utils/roles/roles'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> | { id: string; noteId: string } }
) {
  try {
    const resolvedParams = await params
    const menteeId = Number(resolvedParams.id)
    const noteId = Number(resolvedParams.noteId)
    
    if (!menteeId || isNaN(menteeId) || !noteId || isNaN(noteId)) {
      return new NextResponse('Valid mentee ID and note ID are required', { status: 400 })
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
      console.error('[UPDATE_NOTE_ERROR] User lookup:', userError)
      return new NextResponse('User not found', { status: 404 })
    }

    if (userData.role !== ROLES.REALTOR_COACH) {
      return new NextResponse('Unauthorized - Not a coach', { status: 403 })
    }

    // Verify the note exists and belongs to this coach and mentee
    const { data: noteCheck, error: noteCheckError } = await supabase
      .from('Note')
      .select('id')
      .eq('id', noteId)
      .eq('authorDbId', userData.id)
      .eq('relatedUserDbId', menteeId)
      .single()

    if (noteCheckError || !noteCheck) {
      return new NextResponse('Note not found or not authorized', { status: 404 })
    }

    // Update the note
    const { data: updatedNote, error: updateError } = await supabase
      .from('Note')
      .update({
        content: body.content.trim(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', noteId)
      .select()
      .single()

    if (updateError) {
      console.error('[UPDATE_NOTE_ERROR] Note update:', updateError)
      return new NextResponse('Failed to update note', { status: 500 })
    }

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error('[UPDATE_NOTE_ERROR]', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> | { id: string; noteId: string } }
) {
  try {
    const resolvedParams = await params
    const menteeId = Number(resolvedParams.id)
    const noteId = Number(resolvedParams.noteId)
    
    if (!menteeId || isNaN(menteeId) || !noteId || isNaN(noteId)) {
      return new NextResponse('Valid mentee ID and note ID are required', { status: 400 })
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
      console.error('[DELETE_NOTE_ERROR] User lookup:', userError)
      return new NextResponse('User not found', { status: 404 })
    }

    if (userData.role !== ROLES.REALTOR_COACH) {
      return new NextResponse('Unauthorized - Not a coach', { status: 403 })
    }

    // Verify the note exists and belongs to this coach and mentee
    const { data: noteCheck, error: noteCheckError } = await supabase
      .from('Note')
      .select('id')
      .eq('id', noteId)
      .eq('authorDbId', userData.id)
      .eq('relatedUserDbId', menteeId)
      .single()

    if (noteCheckError || !noteCheck) {
      return new NextResponse('Note not found or not authorized', { status: 404 })
    }

    // Delete the note
    const { error: deleteError } = await supabase
      .from('Note')
      .delete()
      .eq('id', noteId)

    if (deleteError) {
      console.error('[DELETE_NOTE_ERROR] Note deletion:', deleteError)
      return new NextResponse('Failed to delete note', { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE_NOTE_ERROR]', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 