'use server'

import { createAuthClient } from '@/utils/supabase/server'
import { z } from 'zod'

// Types for coaching sessions
export type CoachingSession = {
  id: string
  memberId: string
  memberName: string
  memberAvatar: string
  topic: string
  date: string
  time: string
  duration: number
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
  notes: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
}

// Define ZoomSession response type for better type safety
type ZoomSessionData = {
  id: string
  topic: string
  startTime: string
  duration: number
  status: string
  notes: string | null
  organizationId: string
  User: {
    id: string
    firstName: string | null
    lastName: string | null
    profileImageUrl: string | null
  } | null
  createdAt: string
  updatedAt: string
}

// Response type
type CoachingSessionsResponse = {
  data: {
    sessions: CoachingSession[]
    stats: {
      totalSessions: number
      completedSessions: number
      upcomingSessions: number
      totalHours: number
      completionRate: number
    }
  } | null
  error: {
    code: string
    message: string
    details?: any
  } | null
}

// Function to fetch coaching sessions for an organization
export async function fetchOrganizationCoachingSessions(organizationId: string): Promise<CoachingSessionsResponse> {
  try {
    const supabase = createAuthClient()
    
    // Validate organization ID
    if (!organizationId) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Organization ID is required'
        }
      }
    }

    // Get current date for filtering
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString()
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString()
    
    // Query sessions for the organization from ZoomSession table
    const { data: sessionsData, error } = await supabase
      .from('ZoomSession')
      .select(`
        ulid,
        sessionName,
        status,
        createdAt,
        updatedAt,
        session:sessionUlid(
          ulid,
          startTime,
          endTime,
          status,
          sessionNotes,
          mentee:menteeUlid(
            ulid,
            firstName,
            lastName,
            profileImageUrl
          )
        )
      `)
    
    if (error) {
      console.error('[COACHING_SESSIONS_ERROR]', error)
      return {
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch coaching sessions',
          details: error
        }
      }
    }
    
    // If no sessions found, return empty data
    if (!sessionsData || sessionsData.length === 0) {
      return {
        data: {
          sessions: [],
          stats: {
            totalSessions: 0,
            completedSessions: 0,
            upcomingSessions: 0,
            totalHours: 0,
            completionRate: 0
          }
        },
        error: null
      }
    }
    
    // Check if the organizationId exists in the current user's context
    const { data: orgData } = await supabase
      .from('Organization')
      .select('ulid')
      .eq('ulid', organizationId)
      .single();
      
    if (!orgData) {
      return {
        data: {
          sessions: [],
          stats: {
            totalSessions: 0,
            completedSessions: 0,
            upcomingSessions: 0,
            totalHours: 0,
            completionRate: 0
          }
        },
        error: null
      }
    }
    
    // Transform data to the expected format with careful type handling
    const sessions = sessionsData
      .filter((zoomSession: any) => {
        // For new accounts, they won't have sessions yet, so we need to handle this case
        if (!zoomSession.session) return false;
        
        // Filter for sessions by date range
        return new Date(zoomSession.session.startTime) >= new Date(firstDayOfMonth) &&
               new Date(zoomSession.session.startTime) <= new Date(lastDayOfMonth);
      })
      .map((zoomSession: any) => {
        // Handle potential missing data
        if (!zoomSession || typeof zoomSession !== 'object') {
          console.warn('[COACHING_SESSIONS_WARNING] Invalid session data found', zoomSession);
          return null;
        }
        
        try {
          // Access the session nested object to get required data
          const session = zoomSession.session || {};
          const mentee = session.mentee || {};
          
          // For startTime, use session.startTime if available, otherwise fallback
          const startTime = new Date(session.startTime || zoomSession.createdAt || new Date());
          
          // Calculate duration from start and end time if available
          const duration = session.startTime && session.endTime
            ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)
            : 60; // Default to 60 minutes
          
          return {
            id: zoomSession.ulid || '',
            memberId: mentee.ulid || '',
            memberName: `${mentee.firstName || ''} ${mentee.lastName || ''}`.trim() || 'Unknown User',
            memberAvatar: mentee.profileImageUrl || '',
            topic: zoomSession.sessionName || 'Untitled Session',
            date: startTime.toISOString().split('T')[0],
            time: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            duration: duration,
            status: session.status === 'COMPLETED' ? 'COMPLETED' : 
                    session.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED',
            notes: session.sessionNotes || null,
            organizationId: organizationId,
            createdAt: zoomSession.createdAt || new Date().toISOString(),
            updatedAt: zoomSession.updatedAt || new Date().toISOString()
          }
        } catch (err) {
          console.error('[COACHING_SESSION_MAPPING_ERROR]', err, zoomSession);
          return null;
        }
      }).filter(Boolean) as CoachingSession[];
    
    // Calculate stats
    const completedSessions = sessions.filter(session => session.status === 'COMPLETED')
    const upcomingSessions = sessions.filter(session => 
      session.status === 'SCHEDULED' && new Date(`${session.date}T${session.time}`) >= new Date()
    )
    const totalHours = sessions.reduce((total, session) => total + session.duration, 0) / 60
    const completionRate = sessions.length > 0 
      ? Math.round((completedSessions.length / sessions.length) * 100) 
      : 0
    
    return {
      data: {
        sessions,
        stats: {
          totalSessions: sessions.length,
          completedSessions: completedSessions.length,
          upcomingSessions: upcomingSessions.length,
          totalHours,
          completionRate
        }
      },
      error: null
    }
  } catch (error) {
    console.error('[COACHING_SESSIONS_ERROR]', {
      error,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  }
} 