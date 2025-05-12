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
    
    // Query sessions for the organization from Session table
    // First, get the organization member IDs
    const { data: orgMembers, error: orgMembersError } = await supabase
      .from('OrganizationMember')
      .select('userUlid')
      .eq('organizationUlid', organizationId)
      .eq('status', 'ACTIVE')
    
    if (orgMembersError) {
      console.error('[COACHING_SESSIONS_ERROR] Failed to fetch organization members', orgMembersError)
      return {
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch organization members',
          details: orgMembersError
        }
      }
    }
    
    if (!orgMembers || orgMembers.length === 0) {
      // No members in this organization
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
    
    // Get the member ULIDs
    const memberUlids = orgMembers.map(member => member.userUlid)
    
    // Get sessions for these members
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('Session')
      .select(`
        ulid,
        startTime,
        endTime,
        status,
        sessionType,
        sessionNotes,
        mentee:menteeUlid(
          ulid,
          firstName,
          lastName,
          profileImageUrl
        ),
        createdAt,
        updatedAt
      `)
      .in('menteeUlid', memberUlids)
      .gte('startTime', firstDayOfMonth)
      .lte('startTime', lastDayOfMonth)
    
    if (sessionsError) {
      console.error('[COACHING_SESSIONS_ERROR]', sessionsError)
      return {
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch coaching sessions',
          details: sessionsError
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
      .map((session: any) => {
        // Handle potential missing data
        if (!session || typeof session !== 'object') {
          console.warn('[COACHING_SESSIONS_WARNING] Invalid session data found', session);
          return null;
        }
        
        try {
          const mentee = session.mentee || {};
          
          // For startTime, use session.startTime if available, otherwise fallback
          const startTime = new Date(session.startTime || session.createdAt || new Date());
          
          // Calculate duration from start and end time if available
          const duration = session.startTime && session.endTime
            ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)
            : 60; // Default to 60 minutes
          
          // Map session status to expected format
          let mappedStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
          
          switch (session.status) {
            case 'COMPLETED':
              mappedStatus = 'COMPLETED';
              break;
            case 'CANCELLED':
              mappedStatus = 'CANCELLED';
              break;
            default:
              mappedStatus = 'SCHEDULED';
          }
          
          // Create a formatted session topic
          const sessionType = session.sessionType || 'MANAGED';
          const topic = sessionType === 'GROUP_SESSION' 
            ? 'Group Coaching Session' 
            : sessionType === 'OFFICE_HOURS' 
              ? 'Office Hours' 
              : 'Coaching Session';
          
          return {
            id: session.ulid || '',
            memberId: mentee.ulid || '',
            memberName: `${mentee.firstName || ''} ${mentee.lastName || ''}`.trim() || 'Unknown User',
            memberAvatar: mentee.profileImageUrl || '',
            topic: topic,
            date: startTime.toISOString().split('T')[0],
            time: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            duration: duration,
            status: mappedStatus,
            notes: session.sessionNotes || null,
            organizationId: organizationId,
            createdAt: session.createdAt || new Date().toISOString(),
            updatedAt: session.updatedAt || new Date().toISOString()
          }
        } catch (err) {
          console.error('[COACHING_SESSION_MAPPING_ERROR]', err, session);
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