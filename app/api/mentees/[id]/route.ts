import { NextResponse } from 'next/server'
import { ApiResponse } from '@/utils/types/api'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { type AuthContext } from '@/utils/types/auth'
import { z } from 'zod'
import { ulidSchema } from '@/utils/types/auth'

export const dynamic = 'force-dynamic';

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
  phoneNumber: string | null
  totalYearsRE: number
  realEstateDomains: string[] | null
  goals: Array<{
    ulid: string
    content: string
    createdAt: string
    updatedAt: string
  }>
  sessions: Array<{
    ulid: string
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

type SupabaseUserResponse = {
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
  }[] | null
}

export const GET = withApiAuth<MenteeDetails>(async (request: Request, ctx: AuthContext) => {
  const { userUlid } = ctx
  const id = request.url.split('/').slice(-1)[0]

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
    const { data: rawMenteeData, error: menteeError } = await supabase
      .from('User')
      .select(`
        ulid,
        firstName,
        lastName,
        email,
        profileImageUrl,
        phoneNumber,
        totalYearsRE,
        realEstateDomains
      `)
      .eq('ulid', id)
      .single()

    if (menteeError || !rawMenteeData) {
      console.error('[MENTEE_DETAILS_ERROR] Mentee lookup:', menteeError)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch mentee details'
        }
      }, { status: 500 })
    }

    const menteeData = {
      ...rawMenteeData,
      goals: [],
      sessions: [],
      notes: []
    } as MenteeDetails

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
}, { requiredCapabilities: [USER_CAPABILITIES.COACH] }) 