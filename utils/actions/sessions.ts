'use server'

import { createAuthClient } from '@/utils/auth'
import { withServerAction, ServerActionContext } from '@/utils/middleware/withServerAction'
import { SessionStatus, SessionType, TransformedSession, SESSION_STATUS as TypeSessionStatus, SESSION_TYPE as TypeSessionType } from '@/utils/types/session'
import { ApiErrorCode, ApiResponse } from '@/utils/types/api'
import { Database } from "@/types/supabase";

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
  zoomJoinUrl: string | null
  paymentStatus: string | null
  price?: number | string | null // Make price optional
  createdAt: string
  calBookingUlid: string | null
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
      
      if (!userUlid) {
        return {
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
        };
      }
      
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
          zoomJoinUrl,
          paymentStatus,
          price,
          createdAt,
          calBookingUlid,
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
            zoomJoinUrl: session.zoomJoinUrl ? String(session.zoomJoinUrl) : null,
            paymentStatus: session.paymentStatus ? String(session.paymentStatus) : null,
            price: session.price ? parseFloat(String(session.price)) : 0,
            calBookingUid: session.calBookingUlid ? String(session.calBookingUlid) : null
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
      if (!userUlid) {
        return {
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
        };
      }

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
          zoomJoinUrl,
          paymentStatus,
          price,
          createdAt,
          calBookingUlid,
          mentee:User!Session_menteeUlid_fkey (
            ulid,
            firstName,
            lastName,
            email,
            profileImageUrl
          )
        `)
        .eq('coachUlid', userUlid)
        .eq('status', TypeSessionStatus.SCHEDULED)
        .gt('startTime', now)
        .order('startTime', { ascending: true })

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
          zoomJoinUrl: session.zoomJoinUrl ? String(session.zoomJoinUrl) : null,
          paymentStatus: session.paymentStatus ? String(session.paymentStatus) : null,
          price: session.price ? parseFloat(String(session.price)) : 0,
          calBookingUid: session.calBookingUlid ? String(session.calBookingUlid) : null
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

/**
 * Fetches sessions for any user (mentee or coach)
 */
export const fetchUserSessions = withServerAction<any>(
  async (params, { userUlid, roleContext }) => {
    try {
      if (!userUlid) {
        return {
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
        };
      }

      console.log('[DEBUG_USER_SESSIONS] Starting fetchUserSessions', { userUlid, capabilities: roleContext?.capabilities })
      
      const supabase = await createAuthClient()
      
      // Fetch sessions where the user is either a mentee or a coach
      // Also fetch the related CalBooking.calBookingUid
      const { data: sessions, error: sessionsError } = await supabase
        .from('Session')
        .select(`
          *,
          mentee:User!Session_menteeUlid_fkey (*),
          coach:User!Session_coachUlid_fkey (*),
          calBooking:CalBooking!Session_calBookingUlid_fkey (calBookingUid)
        `)
        .or(`menteeUlid.eq.${userUlid},coachUlid.eq.${userUlid}`)
        .order('startTime', { ascending: false });

      if (sessionsError) {
        console.error('[DEBUG_USER_SESSIONS] Supabase error', { error: sessionsError })
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch user sessions'
          }
        }
      }

      // Handle empty sessions case
      if (!sessions || sessions.length === 0) {
        console.log('[DEBUG_USER_SESSIONS] No sessions found')
        return { data: [], error: null }
      }

      // Transform sessions into client-friendly format
      const transformedSessions = sessions.map((session: any) => {
        // Determine if the user is the coach or mentee in this session
        const userRole = session.coachUlid === userUlid ? 'coach' : 'mentee'
        const otherParty = userRole === 'coach' ? session.mentee : session.coach

        return {
          ulid: String(session.ulid),
          durationMinutes: Math.round(
            (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60)
          ),
          status: String(session.status || 'SCHEDULED'),
          startTime: String(session.startTime),
          endTime: String(session.endTime),
          createdAt: String(session.createdAt),
          userRole,
          otherParty: {
            ulid: String(otherParty.ulid),
            firstName: otherParty.firstName ? String(otherParty.firstName) : null,
            lastName: otherParty.lastName ? String(otherParty.lastName) : null,
            email: otherParty.email ? String(otherParty.email) : null,
            profileImageUrl: otherParty.profileImageUrl ? String(otherParty.profileImageUrl) : null
          },
          sessionType: session.sessionType ? String(session.sessionType) : null,
          zoomJoinUrl: session.zoomJoinUrl ? String(session.zoomJoinUrl) : null,
          paymentStatus: session.paymentStatus ? String(session.paymentStatus) : null,
          // Populate calBookingUid from the related CalBooking table
          calBookingUid: session.calBooking ? String(session.calBooking.calBookingUid) : null
        }
      })

      return {
        data: transformedSessions,
        error: null
      }
    } catch (error) {
      console.error('[DEBUG_USER_SESSIONS] Unexpected error', { 
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
 * Fetches sessions for a specific mentee
 */
export const fetchSessionsByMenteeId = withServerAction<any>(
  async (menteeId: string, { userUlid, roleContext }) => {
    try {
      if (!userUlid) {
        return {
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
        };
      }
      
      if (!menteeId) {
        return {
          data: null,
          error: { code: 'INTERNAL_ERROR', message: 'Mentee ID is required' }
        };
      }

      console.log('[DEBUG_MENTEE_SESSIONS] Starting fetchSessionsByMenteeId', { menteeId, userUlid })
      
      const supabase = await createAuthClient()
      
      // Only coaches should be able to view mentee sessions, 
      // OR a mentee should be able to view their own sessions.
      // For this function, assuming it can be called by a mentee for their own sessions, 
      // or by a coach. The original check was for COACH only.
      // If this is strictly for coaches viewing a mentee, the original check is fine.
      // If mentees use this for their own sessions, userUlid should match menteeId.
      if (!roleContext.capabilities?.includes('COACH') && userUlid !== menteeId) {
        return {
          data: null,
          error: {
            code: 'FORBIDDEN',
            // Adjusted message depending on who might call this
            message: 'User does not have permission to access these sessions' 
          }
        }
      }

      // Query sessions for the specific mentee
      // Also fetch the related CalBooking.calBookingUid
      let query = supabase
        .from('Session')
        .select(`
          *,
          mentee:User!Session_menteeUlid_fkey (*),
          coach:User!Session_coachUlid_fkey (*),
          calBooking:CalBooking!Session_calBookingUlid_fkey (calBookingUid)
        `)
        .eq('menteeUlid', menteeId)
        .order('startTime', { ascending: false })

      // If the user is a coach (and not the mentee themselves), they can see all sessions for this mentee with them.
      // If the user is the mentee, this coachUlid filter is not strictly needed but doesn't hurt.
      if (roleContext.capabilities?.includes('COACH') && userUlid !== menteeId) {
         query = query.eq('coachUlid', userUlid) // Coach can only see sessions they coached for this mentee
      }

      const { data: sessions, error: sessionsError } = await query;

      if (sessionsError) {
        console.error('[DEBUG_MENTEE_SESSIONS] Supabase error', { error: sessionsError })
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch mentee sessions'
          }
        }
      }

      // Handle empty sessions case
      if (!sessions || sessions.length === 0) {
        console.log('[DEBUG_MENTEE_SESSIONS] No sessions found')
        return { data: [], error: null }
      }

      // Transform sessions into client-friendly format
      const transformedSessions = sessions.map((session: any) => {
        return {
          ulid: String(session.ulid),
          durationMinutes: Math.round(
            (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60)
          ),
          status: String(session.status || 'SCHEDULED'),
          startTime: String(session.startTime),
          endTime: String(session.endTime),
          createdAt: String(session.createdAt),
          // userRole should be determined based on the perspective of the caller (userUlid)
          userRole: session.coachUlid === userUlid ? 'coach' : 'mentee',
          otherParty: {
            // If current user is coach, otherParty is mentee. If current user is mentee, otherParty is coach.
            ulid: String(session.coachUlid === userUlid ? session.mentee.ulid : session.coach.ulid),
            firstName: String(session.coachUlid === userUlid ? session.mentee.firstName : session.coach.firstName) || null,
            lastName: String(session.coachUlid === userUlid ? session.mentee.lastName : session.coach.lastName) || null,
            email: String(session.coachUlid === userUlid ? session.mentee.email : session.coach.email) || null,
            profileImageUrl: String(session.coachUlid === userUlid ? session.mentee.profileImageUrl : session.coach.profileImageUrl) || null
          },
          sessionType: session.sessionType ? String(session.sessionType) : null,
          zoomJoinUrl: session.zoomJoinUrl ? String(session.zoomJoinUrl) : null,
          paymentStatus: session.paymentStatus ? String(session.paymentStatus) : null,
          price: session.price || 0,
          // Populate calBookingUid from the related CalBooking table
          calBookingUid: session.calBooking ? String(session.calBooking.calBookingUid) : null
        }
      })

      return {
        data: transformedSessions,
        error: null
      }
    } catch (error) {
      console.error('[DEBUG_MENTEE_SESSIONS] Unexpected error', { 
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

// Define the actual action function with explicit parameter and return types
async function fetchSessionDetailsByIdAction(
  params: { sessionId: string; requestingUserRole: 'mentee' | 'coach' }, 
  context: ServerActionContext 
): Promise<ApiResponse<TransformedSession & { sessionId: string; requestingUserRole: 'mentee' | 'coach' }>> {
  const { userUlid } = context;
  const { sessionId, requestingUserRole } = params;

  if (!userUlid) {
    return {
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
    };
  }
  if (!sessionId) {
    return {
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Session ID is required' },
    };
  }
  if (!requestingUserRole || !['mentee', 'coach'].includes(requestingUserRole)) {
    return {
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Valid requestingUserRole (mentee or coach) is required' },
    };
  }

  try {
    const supabase = await createAuthClient();
    const { data: session, error: sessionError } = await supabase
      .from('Session')
      .select(`
        *,
        mentee:User!Session_menteeUlid_fkey (*),
        coach:User!Session_coachUlid_fkey (*),
        calBooking:CalBooking!Session_calBookingUlid_fkey (calBookingUid)
      `)
      .eq('ulid', sessionId)
      .or(`menteeUlid.eq.${userUlid},coachUlid.eq.${userUlid}`)
      .single();

    if (sessionError) {
      console.error('[FETCH_SESSION_DETAILS_ERROR] Supabase error', { sessionId, userUlid, error: sessionError });
      return {
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: sessionError.message || 'Failed to fetch session details.',
        },
      };
    }

    if (!session) {
      return {
        data: null,
        error: { code: 'NOT_FOUND', message: 'Session not found or user not authorized.' },
      };
    }
    
    const coachData = session.coach as any;
    const menteeData = session.mentee as any;
    const calBookingData = session.calBooking as any;

    const otherParty = requestingUserRole === 'coach' ? menteeData : coachData;
    
    // Ensure transformedSessionData includes non-optional sessionId and requestingUserRole
    const transformedSessionData: TransformedSession & { sessionId: string; requestingUserRole: 'mentee' | 'coach' } = {
      ulid: String(session.ulid),
      durationMinutes: Math.round(
        (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60)
      ),
      status: String(session.status || 'SCHEDULED') as SessionStatus,
      startTime: String(session.startTime),
      endTime: String(session.endTime),
      createdAt: String(session.createdAt),
      userRole: requestingUserRole,
      otherParty: {
        ulid: String(otherParty.ulid),
        firstName: otherParty.firstName ? String(otherParty.firstName) : null,
        lastName: otherParty.lastName ? String(otherParty.lastName) : null,
        email: otherParty.email ? String(otherParty.email) : null,
        profileImageUrl: otherParty.profileImageUrl ? String(otherParty.profileImageUrl) : null,
      },
      sessionType: session.sessionType ? String(session.sessionType) as SessionType : null,
      zoomJoinUrl: session.zoomJoinUrl ? String(session.zoomJoinUrl) : null,
      paymentStatus: session.paymentStatus ? String(session.paymentStatus) : null,
      price: session.price ? parseFloat(String(session.price)) : 0,
      calBookingUid: calBookingData?.calBookingUid ? String(calBookingData.calBookingUid) : null,
      sessionId: sessionId,
      requestingUserRole: requestingUserRole,
    };

    return { data: transformedSessionData, error: null };
  } catch (error: any) {
    console.error('[FETCH_SESSION_DETAILS_ERROR] Unexpected error', { sessionId, userUlid, error });
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred while fetching session details.',
      },
    };
  }
}

export const fetchSessionDetailsById = withServerAction<
  { sessionId: string; requestingUserRole: 'mentee' | 'coach' }, 
  { sessionId: string; requestingUserRole: 'mentee' | 'coach' } 
>(fetchSessionDetailsByIdAction); 