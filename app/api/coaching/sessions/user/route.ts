import { NextResponse } from 'next/server'
import { ApiResponse } from '@/utils/types/api'
import { withApiAuth } from '@/utils/middleware/withApiAuth'
import { createAuthClient } from '@/utils/auth'
import { z } from 'zod'

// Validation schema for query parameters
const QuerySchema = z.object({
  role: z.enum(['coach', 'mentee']).optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

interface SessionResponse {
  ulid: string
  startTime: string
  endTime: string
  status: string
  durationMinutes: number
  coach: {
    ulid: string
    firstName: string | null
    lastName: string | null
    email: string | null
    profileImageUrl: string | null
  }
  mentee: {
    ulid: string
    firstName: string | null
    lastName: string | null
    email: string | null
    profileImageUrl: string | null
  }
}

export const GET = withApiAuth<SessionResponse[]>(async (req, { userUlid }) => {
  try {
    // Validate query parameters
    const { searchParams } = new URL(req.url)
    const validationResult = QuerySchema.safeParse({
      role: searchParams.get('role'),
      status: searchParams.get('status')?.toUpperCase(),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate')
    })

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Invalid query parameters',
          details: validationResult.error.flatten()
        }
      }, { status: 400 })
    }

    const supabase = await createAuthClient()

    // Build query
    let query = supabase
      .from('Session')
      .select(`
        ulid,
        startTime,
        endTime,
        status,
        durationMinutes,
        coach:coachUlid!inner (
          ulid,
          firstName,
          lastName,
          email,
          profileImageUrl
        ),
        mentee:menteeUlid!inner (
          ulid,
          firstName,
          lastName,
          email,
          profileImageUrl
        )
      `)

    // Apply role filter
    if (validationResult.data.role === 'coach') {
      query = query.eq('coachUlid', userUlid)
    } else if (validationResult.data.role === 'mentee') {
      query = query.eq('menteeUlid', userUlid)
    } else {
      // If no role specified, show all sessions where user is either coach or mentee
      query = query.or(`coachUlid.eq.${userUlid},menteeUlid.eq.${userUlid}`)
    }

    // Apply status filter
    if (validationResult.data.status) {
      query = query.eq('status', validationResult.data.status)
    }

    // Apply date range filter
    if (validationResult.data.startDate) {
      query = query.gte('startTime', validationResult.data.startDate)
    }
    if (validationResult.data.endDate) {
      query = query.lte('endTime', validationResult.data.endDate)
    }

    // Execute query
    const { data: sessions, error: sessionsError } = await query
      .order('startTime', { ascending: true })

    if (sessionsError) {
      console.error('[FETCH_SESSIONS_ERROR]', { 
        userUlid,
        error: sessionsError,
        filters: validationResult.data
      })
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch sessions'
        }
      }, { status: 500 })
    }

    // Transform the response to match our interface
    const transformedSessions: SessionResponse[] = sessions.map(session => ({
      ulid: session.ulid,
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status,
      durationMinutes: session.durationMinutes,
      coach: {
        ulid: session.coach[0].ulid,
        firstName: session.coach[0].firstName,
        lastName: session.coach[0].lastName,
        email: session.coach[0].email,
        profileImageUrl: session.coach[0].profileImageUrl
      },
      mentee: {
        ulid: session.mentee[0].ulid,
        firstName: session.mentee[0].firstName,
        lastName: session.mentee[0].lastName,
        email: session.mentee[0].email,
        profileImageUrl: session.mentee[0].profileImageUrl
      }
    }))

    return NextResponse.json<ApiResponse<SessionResponse[]>>({
      data: transformedSessions,
      error: null
    })
  } catch (error) {
    console.error('[FETCH_SESSIONS_ERROR]', error)
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
}) 