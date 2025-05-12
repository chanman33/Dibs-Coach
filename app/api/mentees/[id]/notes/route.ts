import { NextResponse } from 'next/server'
import { ApiResponse } from '@/utils/types/api'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { type AuthContext } from '@/utils/types/auth'
import { z } from 'zod'
import { ulidSchema } from '@/utils/types/auth'
import { generateUlid } from '@/utils/ulid'

// Validation schemas
const MenteeParamsSchema = z.object({
  id: ulidSchema
})

const CreateNoteSchema = z.object({
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

export const POST = withApiAuth<Note>(async (request: Request, ctx: AuthContext) => {
  const { userUlid } = ctx
  const id = request.url.split('/').slice(-2)[0] // Get mentee ID from URL

  try {
    // Validate mentee ID
    const validationResult = MenteeParamsSchema.safeParse({ id })
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid mentee ID format',
          details: validationResult.error.flatten()
        }
      }, { status: 400 })
    }

    // Validate request body
    const body = await request.json()
    const bodyValidation = CreateNoteSchema.safeParse(body)
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

    const supabase = await createAuthClient()

    // Verify this mentee has sessions with this coach and get the most recent session
    const { data: sessionCheck, error: sessionError } = await supabase
      .from('Session')
      .select('ulid')
      .eq('coachUlid', userUlid)
      .eq('menteeUlid', id)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    if (sessionError || !sessionCheck) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Mentee not found or not authorized'
        }
      }, { status: 404 })
    }

    // Create the note
    const { data: note, error: noteError } = await supabase
      .from('Note')
      .insert({
        ulid: generateUlid(),
        content: bodyValidation.data.content,
        relatedUserUlid: id,
        authorUlid: userUlid,
        sessionUlid: sessionCheck.ulid,
        visibility: 'private',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (noteError) {
      console.error('[ADD_NOTE_ERROR] Note creation:', noteError)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create note'
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<Note>>({
      data: note as Note,
      error: null
    })
  } catch (error) {
    console.error('[ADD_NOTE_ERROR]', error)
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
}, { requiredCapabilities: [USER_CAPABILITIES.COACH] }) 