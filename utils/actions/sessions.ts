'use server'

import { createAuthClient } from '@/utils/auth'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { SESSION_STATUS, SESSION_TYPE, TransformedSession } from '@/utils/types/session'
import { ApiResponse, ApiError } from '@/utils/types/api'

// Helper to safely check serialization
function isSerializable(obj: any): boolean {
  try {
    JSON.stringify(obj)
    return true
  } catch (error) {
    return false
  }
}

// Helper to debug non-serializable objects
function findNonSerializableData(obj: any, path = ''): string[] {
  const issues: string[] = []
  
  if (obj === null || obj === undefined) {
    return issues
  }
  
  if (typeof obj !== 'object') {
    return issues
  }
  
  if (!isSerializable(obj)) {
    issues.push(`Entire object at ${path || 'root'} is not serializable`)
    return issues
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const itemPath = `${path}[${index}]`
      if (typeof item === 'object' && item !== null) {
        if (!isSerializable(item)) {
          issues.push(`Array item at ${itemPath} is not serializable`)
        } else {
          issues.push(...findNonSerializableData(item, itemPath))
        }
      }
    })
  } else {
    Object.entries(obj).forEach(([key, value]) => {
      const valuePath = path ? `${path}.${key}` : key
      if (typeof value === 'object' && value !== null) {
        if (!isSerializable(value)) {
          issues.push(`Object property at ${valuePath} is not serializable`)
        } else {
          issues.push(...findNonSerializableData(value, valuePath))
        }
      }
    })
  }
  
  return issues
}

// Define the database session type
interface DbSession {
  ulid: string
  menteeUlid: string
  coachUlid: string
  startTime: string
  endTime: string
  status: string // Changed to string to avoid prototype issues
  sessionType: string | null
  zoomMeetingUrl: string | null
  paymentStatus: string | null
  createdAt: string
  mentee: {
    ulid: string
    firstName: string | null
    lastName: string | null
    email: string | null
    profileImageUrl: string | null
  }
}

/**
 * Fetches all sessions for a coach user
 */
export const fetchCoachSessions = withServerAction<any>(
  async (params, { userUlid, roleContext }) => {
    try {
      // Add debugging logs at the start
      console.log('[DEBUG_SERVER_ACTION_START] fetchCoachSessions called', {
        userUlid,
        hasRoleContext: !!roleContext,
        capabilities: roleContext?.capabilities || []
      });
      
      console.log('[DEBUG_COACH_SESSIONS] Starting fetchCoachSessions', { userUlid })
      
      // Verify the user has coach capability
      if (!roleContext.capabilities?.includes('COACH')) {
        console.log('[DEBUG_COACH_SESSIONS] User lacks COACH capability', { capabilities: roleContext.capabilities })
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only coaches can access this endpoint'
          }
        }
      }

      const supabase = await createAuthClient()

      // Query sessions where the user is the coach
      console.log('[DEBUG_COACH_SESSIONS] Fetching sessions from Supabase')
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
        console.error('[DEBUG_COACH_SESSIONS] Supabase error', { error: sessionsError })
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch coach sessions'
          }
        }
      }

      // Handle empty sessions case
      if (!sessions || sessions.length === 0) {
        console.log('[DEBUG_COACH_SESSIONS] No sessions found')
        return { data: [], error: null }
      }

      console.log('[DEBUG_COACH_SESSIONS] Checking if raw sessions are serializable')
      if (!isSerializable(sessions)) {
        const issues = findNonSerializableData(sessions)
        console.error('[DEBUG_COACH_SESSIONS] Raw sessions are not serializable', { issues })
      } else {
        console.log('[DEBUG_COACH_SESSIONS] Raw sessions are serializable')
      }

      // Transform sessions into client-friendly format with plain objects
      console.log('[DEBUG_COACH_SESSIONS] Transforming sessions')
      const transformedSessions = sessions.map((session: DbSession, index: number) => {
        try {
          // Debug the session from Supabase
          console.log(`[DEBUG_COACH_SESSIONS] Processing session ${index}`, { 
            ulid: session.ulid,
            status: session.status,
            statusType: typeof session.status
          })
          
          // Extract everything as plain values to avoid any prototype issues
          const status = String(session.status || 'SCHEDULED')
          const sessionType = session.sessionType ? String(session.sessionType) : null
          
          // Ensure all properties are primitives
          const transformedSession = {
            ulid: String(session.ulid),
            durationMinutes: Math.round(
              (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60)
            ),
            status,
            startTime: String(session.startTime),
            endTime: String(session.endTime),
            createdAt: String(session.createdAt),
            userRole: 'coach' as const,
            otherParty: {
              ulid: String(session.mentee.ulid),
              firstName: session.mentee.firstName ? String(session.mentee.firstName) : null,
              lastName: session.mentee.lastName ? String(session.mentee.lastName) : null,
              email: session.mentee.email ? String(session.mentee.email) : null,
              profileImageUrl: session.mentee.profileImageUrl ? String(session.mentee.profileImageUrl) : null
            },
            sessionType,
            zoomMeetingUrl: session.zoomMeetingUrl ? String(session.zoomMeetingUrl) : null,
            paymentStatus: session.paymentStatus ? String(session.paymentStatus) : null
          }
          
          // Check if transformed session is serializable
          if (!isSerializable(transformedSession)) {
            const issues = findNonSerializableData(transformedSession)
            console.error(`[DEBUG_COACH_SESSIONS] Transformed session ${index} is not serializable`, { issues })
          }
          
          return transformedSession
        } catch (error) {
          console.error(`[DEBUG_COACH_SESSIONS] Error transforming session ${index}`, { error })
          // Provide a safe fallback to avoid breaking the entire response
          return null
        }
      }).filter(Boolean) // Remove any null entries (from errors)

      // Check if entire transformed array is serializable
      console.log('[DEBUG_COACH_SESSIONS] Checking if transformed sessions are serializable')
      if (!isSerializable(transformedSessions)) {
        const issues = findNonSerializableData(transformedSessions)
        console.error('[DEBUG_COACH_SESSIONS] Transformed sessions array is not serializable', { issues })
      } else {
        console.log('[DEBUG_COACH_SESSIONS] Transformed sessions are serializable')
      }

      // Final response object
      const response = {
        data: transformedSessions,
        error: null
      }
      
      // Check if final response is serializable
      console.log('[DEBUG_COACH_SESSIONS] Checking if final response is serializable')
      if (!isSerializable(response)) {
        const issues = findNonSerializableData(response)
        console.error('[DEBUG_COACH_SESSIONS] Final response is not serializable', { issues })
      } else {
        console.log('[DEBUG_COACH_SESSIONS] Final response is serializable, returning data')
      }

      return response
    } catch (error) {
      console.error('[DEBUG_COACH_SESSIONS] Unexpected error', { 
        error,
        errorType: error?.constructor?.name,
        errorJSON: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        timestamp: new Date().toISOString()
      })
      
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

/**
 * Fetches upcoming sessions for a coach user (for the dashboard)
 */
export const fetchUpcomingSessions = withServerAction<any>(
  async (_, { userUlid, roleContext }) => {
    try {
      // Verify the user has coach capability
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
      const now = new Date().toISOString()

      // Query upcoming sessions where the user is the coach
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
        .gt('startTime', now)
        .order('startTime', { ascending: true })
        .limit(5)

      if (sessionsError) {
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch upcoming sessions'
          }
        }
      }

      // Handle empty sessions case
      if (!sessions || sessions.length === 0) {
        return { data: [], error: null }
      }

      // Transform sessions into client-friendly format with plain objects
      const transformedSessions = sessions.map((session: DbSession) => {
        // Extract everything as plain values to avoid any prototype issues
        const status = String(session.status || 'SCHEDULED')
        const sessionType = session.sessionType ? String(session.sessionType) : null
        
        // Ensure all properties are primitives
        return {
          ulid: String(session.ulid),
          durationMinutes: Math.round(
            (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60)
          ),
          status,
          startTime: String(session.startTime),
          endTime: String(session.endTime),
          createdAt: String(session.createdAt),
          userRole: 'coach' as const,
          otherParty: {
            ulid: String(session.mentee.ulid),
            firstName: session.mentee.firstName ? String(session.mentee.firstName) : null,
            lastName: session.mentee.lastName ? String(session.mentee.lastName) : null,
            email: session.mentee.email ? String(session.mentee.email) : null,
            profileImageUrl: session.mentee.profileImageUrl ? String(session.mentee.profileImageUrl) : null
          },
          sessionType,
          zoomMeetingUrl: session.zoomMeetingUrl ? String(session.zoomMeetingUrl) : null,
          paymentStatus: session.paymentStatus ? String(session.paymentStatus) : null
        }
      })

      return {
        data: transformedSessions,
        error: null
      }
    } catch (error) {
      console.error('[FETCH_UPCOMING_SESSIONS_ERROR]', { 
        error,
        timestamp: new Date().toISOString()
      })
      
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