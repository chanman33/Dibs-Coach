import { NextResponse } from 'next/server'
import { ApiResponse } from '@/utils/types/api'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'
import { ROLES } from '@/utils/roles/roles'
import { z } from 'zod'
import { ulidSchema } from '@/utils/types/auth'

// Validation schema for mentee ID
const MenteeParamsSchema = z.object({
  id: ulidSchema
})

interface MenteeDetails {
  ulid: string
  firstName: string | null
  lastName: string | null
  email: string
  profileImageUrl: string | null
  realtorProfile: {
    ulid: string
    companyName: string | null
    licenseNumber: string | null
    phoneNumber: string | null
  } | null
  goals: Array<{
    ulid: string
    content: string
    createdAt: string
    updatedAt: string
  }>
  sessions: Array<{
    ulid: string
    durationMinutes: number
    status: string
    createdAt: string
    notes: Array<{
      ulid: string
      content: string
      createdAt: string
    }>
  }>
  notes: Array<{
    ulid: string
    content: string
    createdAt: string
    updatedAt: string
  }>
}

export const GET = withApiAuth<MenteeDetails>(async (request: Request, ctx) => {
  const { userUlid, role } = ctx
  const id = request.url.split('/').slice(-1)[0]

  try {
    // Validate mentee ID
    const validationResult = MenteeParamsSchema.safeParse({ id })
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid mentee ID format',
          details: validationResult.error.flatten()
        }
      }, { status: 400 })
    }

    if (role !== ROLES.COACH) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Only coaches can access mentee details'
        }
      }, { status: 403 })
    }

    const supabase = await createAuthClient()

    // Verify this mentee has sessions with this coach
    const { data: sessionCheck, error: sessionError } = await supabase
      .from('Session')
      .select('ulid')
      .eq('coachUlid', userUlid)
      .eq('menteeUlid', id)
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

    // Get mentee details
    const { data: menteeData, error: menteeError } = await supabase
      .from('User')
      .select(`
        ulid,
        firstName,
        lastName,
        email,
        profileImageUrl,
        RealtorProfile!userUlid (
          ulid,
          companyName,
          licenseNumber,
          phoneNumber
        )
      `)
      .eq('ulid', id)
      .single()

    if (menteeError || !menteeData) {
      console.error('[MENTEE_DETAILS_ERROR] Mentee lookup:', menteeError)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch mentee details'
        }
      }, { status: 500 })
    }

    // Get mentee's goals (from notes marked as goals)
    const { data: goals } = await supabase
      .from('Note')
      .select('ulid, content, createdAt, updatedAt')
      .eq('relatedUserUlid', id)
      .eq('visibility', 'goal')
      .order('createdAt', { ascending: false })

    // Get mentee's sessions
    const { data: sessions, error: sessionQueryError } = await supabase
      .from('Session')
      .select(`
        ulid,
        durationMinutes,
        status,
        createdAt,
        notes:Note (
          ulid,
          content,
          createdAt
        )
      `)
      .eq('menteeUlid', id)
      .eq('coachUlid', userUlid)
      .order('createdAt', { ascending: false })

    if (sessionQueryError) {
      console.error('[MENTEE_DETAILS_ERROR] Session lookup:', sessionQueryError)
    }

    // Get mentee's notes
    const { data: notes, error: notesError } = await supabase
      .from('Note')
      .select('ulid, content, createdAt, updatedAt')
      .eq('relatedUserUlid', id)
      .eq('authorUlid', userUlid)
      .neq('visibility', 'goal')
      .order('createdAt', { ascending: false })

    const response: MenteeDetails = {
      ...menteeData,
      realtorProfile: menteeData.RealtorProfile ? menteeData.RealtorProfile[0] || null : null,
      goals: goals || [],
      sessions: sessions || [],
      notes: notes || []
    }

    return NextResponse.json<ApiResponse<MenteeDetails>>({
      data: response,
      error: null
    })
  } catch (error) {
    console.error('[MENTEE_DETAILS_ERROR]', error)
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