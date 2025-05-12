'use server'

import { createAuthClient } from '@/utils/supabase'
import { generateUlid } from '@/utils/ulid'
import { Database } from '@/types/supabase'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { SessionStatus } from '@prisma/client'
import { ApiResponse } from '@/utils/types/api'

type DbTables = Database['public']['Tables']
type SessionRow = DbTables['Session']['Row']
type UserRow = DbTables['User']['Row']

type SessionWithCoach = {
  ulid: string
  startTime: string
  endTime: string
  status: SessionStatus
  sessionNotes: string | null
  coach: {
    ulid: string
    displayName: string | null
  }
}

export type TrainingSession = {
  ulid: string
  startTime: string
  duration: number
  status: SessionStatus
  notes?: string
  rating?: number
  topics?: string[]
  coach: {
    name: string
    ulid: string
  }
}

export type TrainingHistoryResponse = {
  sessions: TrainingSession[]
}

export const fetchTrainingHistory = withServerAction<TrainingHistoryResponse>(
  async (_, { userUlid }) => {
    try {
      // Validate that userUlid is defined
      if (!userUlid) {
        return {
          data: { sessions: [] },
          error: {
            code: 'AUTH_ERROR',
            message: 'User ID is required'
          }
        };
      }
      
      // Log the userUlid for debugging
      console.log('[TRAINING_HISTORY] Fetching sessions for user:', userUlid)

      const supabase = createAuthClient()

      // First verify the user exists
      const { data: user, error: userError } = await supabase
        .from('User')
        .select('ulid')
        .eq('ulid', userUlid)
        .single()

      if (userError) {
        console.error('[TRAINING_HISTORY_ERROR] Failed to verify user:', {
          error: userError,
          userUlid,
          timestamp: new Date().toISOString()
        })
        return {
          data: { sessions: [] },
          error: null
        }
      }

      if (!user) {
        console.log('[TRAINING_HISTORY] User not found:', userUlid)
        return {
          data: { sessions: [] },
          error: null
        }
      }

      // Now fetch sessions with only existing fields
      const { data: sessions, error: sessionsError } = await supabase
        .from('Session')
        .select(`
          ulid,
          startTime,
          endTime,
          status,
          sessionNotes,
          coach:coachUlid!inner (
            ulid,
            displayName
          )
        `)
        .eq('menteeUlid', userUlid)
        .order('startTime', { ascending: false })

      // Handle database errors
      if (sessionsError) {
        console.log('[TRAINING_HISTORY] Database error:', {
          error: sessionsError,
          userUlid,
          timestamp: new Date().toISOString()
        })
        return {
          data: { sessions: [] },
          error: null
        }
      }

      // Handle no sessions found
      if (!sessions || sessions.length === 0) {
        console.log('[TRAINING_HISTORY] No sessions found for user:', userUlid)
        return {
          data: { sessions: [] },
          error: null
        }
      }

      console.log('[TRAINING_HISTORY] Found sessions:', sessions.length)

      // Transform the response to match the expected format
      const transformedSessions = (sessions as unknown as SessionWithCoach[]).map(session => {
        const startTime = new Date(session.startTime)
        const endTime = new Date(session.endTime)
        const durationInMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))

        return {
          ulid: session.ulid,
          startTime: session.startTime,
          duration: durationInMinutes,
          status: session.status as SessionStatus,
          notes: session.sessionNotes || undefined,
          // These fields don't exist in DB yet, so default them
          rating: undefined,
          topics: undefined,
          coach: {
            ulid: session.coach.ulid,
            name: session.coach.displayName || 'Unknown Coach'
          }
        }
      })

      return {
        data: { sessions: transformedSessions },
        error: null
      }

    } catch (error) {
      // Log unexpected errors
      console.log('[TRAINING_HISTORY] Unexpected error:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        userUlid,
        timestamp: new Date().toISOString()
      })

      // Return empty sessions array instead of null on error
      return {
        data: { sessions: [] },
        error: null
      }
    }
  }
) 