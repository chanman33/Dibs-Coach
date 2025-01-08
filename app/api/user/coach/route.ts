'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

interface RealtorCoachProfile {
  specialty: string | null
  imageUrl: string | null
  rating: number | null
  reviewCount: number | null
  bio: string | null
  experience: string | null
  certifications: string[] | null
  availability: string | null
  sessionLength: string | null
  specialties: string | null
  calendlyUrl: string | null
  eventTypeUrl: string | null
  hourlyRate: number | null
}

interface CoachData {
  id: number
  userId: string
  firstName: string | null
  lastName: string | null
  RealtorCoachProfile: RealtorCoachProfile
}

export async function fetchCoaches() {
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

  try {
    const { data: coachesData, error } = await supabase
      .from('User')
      .select<string, CoachData>(`
        id,
        userId,
        firstName,
        lastName,
        RealtorCoachProfile (
          specialty,
          imageUrl,
          rating,
          reviewCount,
          bio,
          experience,
          certifications,
          availability,
          sessionLength,
          specialties,
          calendlyUrl,
          eventTypeUrl,
          hourlyRate
        )
      `)
      .eq('role', 'realtor_coach')
      .not('RealtorCoachProfile', 'is', null)

    if (error) {
      console.error('[FETCH_COACHES_ERROR]', error)
      throw error
    }

    if (!coachesData?.length) {
      console.log('[FETCH_COACHES_INFO] No coaches found')
      return { data: [], error: null }
    }

    return { data: coachesData, error: null }
  } catch (error) {
    console.error('[FETCH_COACHES_ERROR]', error)
    return { data: null, error }
  }
}

export async function fetchCoachByClerkId(clerkId: string): Promise<{ data: CoachData | null, error: any }> {
  if (!clerkId) {
    console.error('[FETCH_COACH_ERROR] No clerk ID provided')
    return { data: null, error: new Error('No clerk ID provided') }
  }

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
  
  try {
    const { data, error } = await supabase
      .from('User')
      .select<string, CoachData>(`
        id,
        userId,
        firstName,
        lastName,
        RealtorCoachProfile (
          specialty,
          imageUrl,
          rating,
          reviewCount,
          bio,
          experience,
          certifications,
          availability,
          sessionLength,
          specialties,
          calendlyUrl,
          eventTypeUrl,
          hourlyRate
        )
      `)
      .eq('userId', clerkId)
      .eq('role', 'realtor_coach')
      .not('RealtorCoachProfile', 'is', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`[FETCH_COACH_INFO] No coach found for clerk ID: ${clerkId}`)
        return { data: null, error: null }
      }
      console.error('[FETCH_COACH_ERROR]', error)
      throw error
    }

    if (!data) {
      console.log(`[FETCH_COACH_INFO] No coach found for clerk ID: ${clerkId}`)
      return { data: null, error: null }
    }

    return { data, error: null }
  } catch (error) {
    console.error('[FETCH_COACH_ERROR]', error)
    return { data: null, error }
  }
} 