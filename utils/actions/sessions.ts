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
          data: [],
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
          data: [],
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch coach sessions'
          }
        }
      }

      // Handle empty sessions case explicitly
      if (!sessions || sessions.length === 0) {
        console.log('[FETCH_COACH_SESSIONS] No sessions found for coach', userUlid);
        return {
          data: [],
          error: null
        };
      }

      // Ensure we're returning serializable data by creating completely new objects with primitive values
      const safelySerializedSessions = [];
      
      for (const session of sessions) {
        // Calculate duration as a number
        let durationMinutes = 0;
        try {
          const startMs = new Date(session.startTime).getTime();
          const endMs = new Date(session.endTime).getTime();
          durationMinutes = Math.round((endMs - startMs) / (1000 * 60));
        } catch (e) {
          console.error('Error calculating duration:', e);
        }

        // Ensure mentee object is valid
        const mentee = session.mentee || {};
        
        // Ensure status is a valid SessionStatus enum value - normalize to uppercase
        let status = (session.status || 'SCHEDULED').toUpperCase();
        
        // Map to known enum values
        let statusEnum: SessionStatus;
        switch (status) {
          case 'SCHEDULED':
            statusEnum = SessionStatus.SCHEDULED;
            break;
          case 'COMPLETED':
            statusEnum = SessionStatus.COMPLETED;
            break;
          case 'CANCELLED':
            statusEnum = SessionStatus.CANCELLED;
            break;
          case 'NO_SHOW':
            statusEnum = SessionStatus.NO_SHOW;
            break;
          default:
            statusEnum = SessionStatus.SCHEDULED;
        }

        // Create a plain object with string and number fields only
        const plainSessionObject = {
          ulid: String(session.ulid || ''),
          durationMinutes: Number(durationMinutes),
          status: statusEnum,
          startTime: String(session.startTime || ''),
          endTime: String(session.endTime || ''),
          createdAt: String(session.createdAt || ''),
          userRole: 'coach',
          otherParty: {
            ulid: String(mentee.ulid || ''),
            firstName: mentee.firstName ? String(mentee.firstName) : null,
            lastName: mentee.lastName ? String(mentee.lastName) : null,
            email: mentee.email ? String(mentee.email) : null,
            profileImageUrl: mentee.profileImageUrl ? String(mentee.profileImageUrl) : null
          },
          sessionType: session.sessionType ? String(session.sessionType) : null,
          zoomMeetingUrl: session.zoomMeetingUrl ? String(session.zoomMeetingUrl) : null,
          paymentStatus: session.paymentStatus ? String(session.paymentStatus) : null
        };
        
        safelySerializedSessions.push(plainSessionObject);
      }

      try {
        // Double-check validation using schema
        const validatedSessions = z.array(TransformedSessionSchema).parse(safelySerializedSessions);
        
        // Return the serialized data
        return {
          data: validatedSessions,
          error: null
        };
      } catch (validationError) {
        console.error('[FETCH_COACH_SESSIONS_VALIDATION_ERROR]', validationError);
        // If validation fails, return an empty array instead of throwing
        return {
          data: [],
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Failed to validate session data'
          }
        };
      }
    } catch (error) {
      console.error('[FETCH_COACH_SESSIONS_ERROR]', error)
      return {
        data: [],  // Return empty array instead of null on error
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)

export const fetchUpcomingSessions = withServerAction<TransformedSession[]>(
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

      // Calculate date range for next 7 days
      const now = new Date()
      const sevenDaysLater = new Date(now)
      sevenDaysLater.setDate(now.getDate() + 7)

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
        .eq('status', 'SCHEDULED')
        .gte('startTime', now.toISOString())
        .lte('startTime', sevenDaysLater.toISOString())
        .order('startTime', { ascending: true })
        .limit(5) // Limit to 5 upcoming sessions

      if (sessionsError) {
        console.error('[FETCH_UPCOMING_SESSIONS_ERROR]', { userUlid, error: sessionsError })
        return {
          data: [],
          error: null
        }
      }

      if (!sessions || sessions.length === 0) {
        return {
          data: [],
          error: null
        }
      }

      // Ensure we're returning serializable data by creating completely new objects with primitive values
      const safelySerializedSessions = [];
      
      for (const session of sessions) {
        // Calculate duration as a number
        let durationMinutes = 0;
        try {
          const startMs = new Date(session.startTime).getTime();
          const endMs = new Date(session.endTime).getTime();
          durationMinutes = Math.round((endMs - startMs) / (1000 * 60));
        } catch (e) {
          console.error('Error calculating duration:', e);
        }

        // Ensure mentee object is valid
        const mentee = session.mentee || {};
        
        // Ensure status is a valid SessionStatus enum value - normalize to uppercase
        let status = (session.status || 'SCHEDULED').toUpperCase();
        
        // Map to known enum values
        let statusEnum: SessionStatus;
        switch (status) {
          case 'SCHEDULED':
            statusEnum = SessionStatus.SCHEDULED;
            break;
          case 'COMPLETED':
            statusEnum = SessionStatus.COMPLETED;
            break;
          case 'CANCELLED':
            statusEnum = SessionStatus.CANCELLED;
            break;
          case 'NO_SHOW':
            statusEnum = SessionStatus.NO_SHOW;
            break;
          default:
            statusEnum = SessionStatus.SCHEDULED;
        }

        // Create a plain object with primitive values
        const plainSessionObject = {
          ulid: String(session.ulid || ''),
          durationMinutes: Number(durationMinutes),
          status: statusEnum,
          startTime: String(session.startTime || ''),
          endTime: String(session.endTime || ''),
          createdAt: String(session.createdAt || ''),
          userRole: 'coach',
          otherParty: {
            ulid: String(mentee.ulid || ''),
            firstName: mentee.firstName ? String(mentee.firstName) : null,
            lastName: mentee.lastName ? String(mentee.lastName) : null,
            email: mentee.email ? String(mentee.email) : null,
            profileImageUrl: mentee.profileImageUrl ? String(mentee.profileImageUrl) : null
          },
          sessionType: session.sessionType ? String(session.sessionType) : null,
          zoomMeetingUrl: session.zoomMeetingUrl ? String(session.zoomMeetingUrl) : null,
          paymentStatus: session.paymentStatus ? String(session.paymentStatus) : null
        };
        
        safelySerializedSessions.push(plainSessionObject);
      }

      try {
        // Double-check validation using schema
        const validatedSessions = z.array(TransformedSessionSchema).parse(safelySerializedSessions);
        
        // Return the serialized data
        return {
          data: validatedSessions,
          error: null
        };
      } catch (validationError) {
        console.error('[FETCH_UPCOMING_SESSIONS_VALIDATION_ERROR]', validationError);
        return {
          data: [],
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Failed to validate session data'
          }
        };
      }
    } catch (error) {
      console.error('[FETCH_UPCOMING_SESSIONS_ERROR]', error)
      return {
        data: [],
        error: null
      }
    }
  }
) 