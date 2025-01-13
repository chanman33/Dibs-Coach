'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface User {
  id: number
  firstName: string | null
  lastName: string | null
  email: string | null
}

interface SessionResponse {
  id: number
  durationMinutes: number
  status: string
  calendlyEventId: string
  startTime: string
  endTime: string
  createdAt: string
  coachDbId: number
  menteeDbId: number
  coach: User
  mentee: User
}

interface TransformedSession {
  id: number
  durationMinutes: number
  status: string
  calendlyEventId: string
  startTime: string
  endTime: string
  createdAt: string
  userRole: 'coach' | 'mentee'
  otherParty: User
}

export async function fetchUserSessions(): Promise<TransformedSession[] | null> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // First get the user's database ID
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, role')
      .eq('userId', userId)
      .single()

    if (userError || !user) throw new Error('User not found')

    // Fetch sessions where user is either coach or mentee
    const { data: sessions, error } = await supabase
      .from('Session')
      .select(`
        id,
        durationMinutes,
        status,
        calendlyEventId,
        startTime,
        endTime,
        createdAt,
        coachDbId,
        menteeDbId,
        coach:User!Session_coachDbId_fkey (
          id,
          firstName,
          lastName,
          email
        ),
        mentee:User!Session_menteeDbId_fkey (
          id,
          firstName,
          lastName,
          email
        )
      `)
      .or(`coachDbId.eq.${user.id},menteeDbId.eq.${user.id}`)
      .order('startTime', { ascending: false })

    if (error) throw error

    // Transform the data to include role context
    const transformedSessions = (sessions as unknown as SessionResponse[]).map((session): TransformedSession => ({
      id: session.id,
      durationMinutes: session.durationMinutes,
      status: session.status,
      calendlyEventId: session.calendlyEventId,
      startTime: session.startTime,
      endTime: session.endTime,
      createdAt: session.createdAt,
      userRole: session.coachDbId === user.id ? 'coach' : 'mentee',
      otherParty: session.coachDbId === user.id ? session.mentee : session.coach
    }))

    return transformedSessions

  } catch (error) {
    console.error('[FETCH_SESSIONS_ERROR]', error)
    return null
  }
} 