'use server'

import { createAuthClient } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { ApiResponse } from '@/utils/types/api'
import { z } from 'zod'
import { ulidSchema } from '@/utils/types/auth'
import { SessionStatus, SessionType, TransformedSession, User } from '@/utils/types/session'

// Database types
interface DbSessionWithUsers {
  ulid: string
  menteeUlid: string
  coachUlid: string
  startTime: string
  endTime: string
  status: SessionStatus
  sessionType: SessionType | null
  zoomMeetingUrl: string | null
  paymentStatus: string | null
  createdAt: string
  coach: User
  mentee: User
}

interface DbSessionWithMentee {
  ulid: string
  menteeUlid: string
  coachUlid: string
  startTime: string
  endTime: string
  status: SessionStatus
  sessionType: SessionType | null
  zoomMeetingUrl: string | null
  paymentStatus: string | null
  createdAt: string
  mentee: User
}

// Validation schemas
const UserSchema = z.object({
  ulid: ulidSchema,
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().nullable(),
  profileImageUrl: z.string().nullable()
})

const TransformedSessionSchema = z.object({
  ulid: ulidSchema,
  durationMinutes: z.number(),
  status: z.nativeEnum(SessionStatus),
  startTime: z.string(),
  endTime: z.string(),
  createdAt: z.string(),
  userRole: z.enum(['coach', 'mentee']),
  otherParty: UserSchema,
  sessionType: z.nativeEnum(SessionType).nullable(),
  zoomMeetingUrl: z.string().nullable(),
  paymentStatus: z.string().nullable()
})

// Actions
export const fetchUserSessions = withServerAction<TransformedSession[]>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // Fetch sessions where user is either coach or mentee
      const { data: sessions, error: sessionsError } = await supabase
        .from('Session')
        .select(`
          ulid,
          menteeUlid,
          coachUlid,
          startTime,
          endTime,
          status,
          sessionType,
          zoomMeetingUrl,
          paymentStatus,
          createdAt,
          coach:User!Session_coachUlid_fkey (
            ulid,
            firstName,
            lastName,
            email,
            profileImageUrl
          ),
          mentee:User!Session_menteeUlid_fkey (
            ulid,
            firstName,
            lastName,
            email,
            profileImageUrl
          )
        `)
        .or(`coachUlid.eq.${userUlid},menteeUlid.eq.${userUlid}`)
        .order('startTime', { ascending: false })

      if (sessionsError) {
        console.error('[FETCH_SESSIONS_ERROR]', { userUlid, error: sessionsError })
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch sessions'
          }
        }
      }

      // Transform and validate the data
      const transformedSessions = (sessions as unknown as DbSessionWithUsers[]).map((session): TransformedSession => ({
        ulid: session.ulid,
        durationMinutes: Math.round(
          (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60)
        ),
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        createdAt: session.createdAt,
        userRole: session.coachUlid === userUlid ? 'coach' : 'mentee',
        otherParty: session.coachUlid === userUlid ? session.mentee : session.coach,
        sessionType: session.sessionType,
        zoomMeetingUrl: session.zoomMeetingUrl,
        paymentStatus: session.paymentStatus
      }))

      // Validate transformed sessions
      const validatedSessions = z.array(TransformedSessionSchema).parse(transformedSessions)

      return {
        data: validatedSessions,
        error: null
      }
    } catch (error) {
      console.error('[FETCH_SESSIONS_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)

export const fetchCoachSessions = withServerAction<TransformedSession[]>(
  async (_, { userUlid, roleContext }) => {
    try {
      if (!roleContext.capabilities?.includes('COACH')) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only coaches can access this endpoint'
          }
        }
      }

      const supabase = await createAuthClient()

      const { data: sessions, error: sessionsError } = await supabase
        .from('Session')
        .select(`
          ulid,
          menteeUlid,
          coachUlid,
          startTime,
          endTime,
          status,
          sessionType,
          zoomMeetingUrl,
          paymentStatus,
          createdAt,
          mentee:User!Session_menteeUlid_fkey (
            ulid,
            firstName,
            lastName,
            email,
            profileImageUrl
          )
        `)
        .eq('coachUlid', userUlid)
        .order('startTime', { ascending: false })

      if (sessionsError) {
        console.error('[FETCH_COACH_SESSIONS_ERROR]', { userUlid, error: sessionsError })
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch coach sessions'
          }
        }
      }

      // Transform and validate the data
      const transformedSessions = (sessions as unknown as DbSessionWithMentee[]).map((session): TransformedSession => ({
        ulid: session.ulid,
        durationMinutes: Math.round(
          (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60)
        ),
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        createdAt: session.createdAt,
        userRole: 'coach',
        otherParty: session.mentee,
        sessionType: session.sessionType,
        zoomMeetingUrl: session.zoomMeetingUrl,
        paymentStatus: session.paymentStatus
      }))

      // Validate transformed sessions
      const validatedSessions = z.array(TransformedSessionSchema).parse(transformedSessions)

      return {
        data: validatedSessions,
        error: null
      }
    } catch (error) {
      console.error('[FETCH_COACH_SESSIONS_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
) 