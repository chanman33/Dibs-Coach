'use server'

import { createAuthClient } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { ApiResponse } from '@/utils/types/api'
import { z } from 'zod'
import { ulidSchema } from '@/utils/types/auth'
import { SessionStatus, SessionType } from '@prisma/client'

// Types and Schemas
const UserSchema = z.object({
  ulid: ulidSchema,
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().nullable(),
  profileImageUrl: z.string().nullable()
})

const SessionSchema = z.object({
  ulid: ulidSchema,
  menteeUlid: ulidSchema,
  coachUlid: ulidSchema,
  startTime: z.string(),
  endTime: z.string(),
  status: z.nativeEnum(SessionStatus),
  sessionType: z.nativeEnum(SessionType).nullable(),
  sessionNotes: z.string().nullable(),
  zoomMeetingId: z.string().nullable(),
  zoomMeetingUrl: z.string().nullable(),
  priceAmount: z.number().nullable(),
  currency: z.string().nullable(),
  platformFeeAmount: z.number().nullable(),
  coachPayoutAmount: z.number().nullable(),
  stripePaymentIntentId: z.string().nullable(),
  paymentStatus: z.string().nullable(),
  payoutStatus: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
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

type User = z.infer<typeof UserSchema>
type Session = z.infer<typeof SessionSchema>
type TransformedSession = z.infer<typeof TransformedSessionSchema>

// Database types
interface DbUser {
  ulid: string
  firstName: string | null
  lastName: string | null
  email: string | null
  profileImageUrl: string | null
}

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
  coach: DbUser
  mentee: DbUser
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
  mentee: DbUser
}

// Actions
export const fetchUserSessions = withServerAction<TransformedSession[]>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // Get user's role
      const { data: user, error: userError } = await supabase
        .from('User')
        .select('ulid, role')
        .eq('ulid', userUlid)
        .single()

      if (userError || !user) {
        console.error('[FETCH_SESSIONS_ERROR] User not found:', { userUlid, error: userError })
        return {
          data: null,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        }
      }

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
  async (_, { userUlid, role }) => {
    try {
      if (role !== 'COACH') {
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