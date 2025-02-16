import { NextResponse } from 'next/server'
import { ApiResponse } from '@/utils/types/api'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'
import { ROLES } from '@/utils/roles/roles'
import { z } from 'zod'
import { ulidSchema } from '@/utils/types/auth'

// Validation schemas
const NoteParamsSchema = z.object({
  id: ulidSchema,
  noteId: ulidSchema
})

const UpdateNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required').trim()
})

interface Note {
  ulid: string
  content: string
  relatedUserUlid: string
  authorUlid: string
  sessionUlid: string | null
  visibility: 'private' | 'goal'
  createdAt: string
  updatedAt: string
}

export const PATCH = withApiAuth<Note>(async (request: Request, ctx) => {
  const { userUlid, role } = ctx
  const urlParts = request.url.split('/')
  const noteId = urlParts.pop()
  const menteeId = urlParts[urlParts.length - 2]

  try {
    // Validate IDs
    const validationResult = NoteParamsSchema.safeParse({ id: menteeId, noteId })
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid mentee ID or note ID format',
          details: validationResult.error.flatten()
        }
      }, { status: 400 })
    }

    // Validate request body
    const body = await request.json()
    const bodyValidation = UpdateNoteSchema.safeParse(body)
    if (!bodyValidation.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid note data',
          details: bodyValidation.error.flatten()
        }
      }, { status: 400 })
    }

    if (role !== ROLES.COACH) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Only coaches can update notes'
        }
      }, { status: 403 })
    }

    const supabase = await createAuthClient()

    // Verify the note exists and belongs to this coach and mentee
    const { data: noteCheck, error: noteCheckError } = await supabase
      .from('Note')
      .select('ulid')
      .eq('ulid', noteId)
      .eq('authorUlid', userUlid)
      .eq('relatedUserUlid', menteeId)
      .single()

    if (noteCheckError || !noteCheck) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Note not found or not authorized'
        }
      }, { status: 404 })
    }

    // Update the note
    const { data: updatedNote, error: updateError } = await supabase
      .from('Note')
      .update({
        content: bodyValidation.data.content,
        updatedAt: new Date().toISOString()
      })
      .eq('ulid', noteId)
      .select()
      .single()

    if (updateError) {
      console.error('[UPDATE_NOTE_ERROR] Note update:', updateError)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update note'
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<Note>>({
      data: updatedNote,
      error: null
    })
  } catch (error) {
    console.error('[UPDATE_NOTE_ERROR]', error)
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
}, { requiredRoles: [ROLES.COACH] })

export const DELETE = withApiAuth(async (request: Request, ctx) => {
  const { userUlid, role } = ctx
  const urlParts = request.url.split('/')
  const noteId = urlParts.pop()
  const menteeId = urlParts[urlParts.length - 2]

  try {
    // Validate IDs
    const validationResult = NoteParamsSchema.safeParse({ id: menteeId, noteId })
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid mentee ID or note ID format',
          details: validationResult.error.flatten()
        }
      }, { status: 400 })
    }

    if (role !== ROLES.COACH) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Only coaches can delete notes'
        }
      }, { status: 403 })
    }

    const supabase = await createAuthClient()

    // Verify the note exists and belongs to this coach and mentee
    const { data: noteCheck, error: noteCheckError } = await supabase
      .from('Note')
      .select('ulid')
      .eq('ulid', noteId)
      .eq('authorUlid', userUlid)
      .eq('relatedUserUlid', menteeId)
      .single()

    if (noteCheckError || !noteCheck) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Note not found or not authorized'
        }
      }, { status: 404 })
    }

    // Delete the note
    const { error: deleteError } = await supabase
      .from('Note')
      .delete()
      .eq('ulid', noteId)

    if (deleteError) {
      console.error('[DELETE_NOTE_ERROR] Note deletion:', deleteError)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete note'
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<{ success: true }>>({
      data: { success: true },
      error: null
    })
  } catch (error) {
    console.error('[DELETE_NOTE_ERROR]', error)
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
}, { requiredRoles: [ROLES.COACH] }) 