'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface RealtorCoachProfile {
  specialty: string
  imageUrl: string
  rating: number
  reviewCount: number
  bio: string
  experience: string
  certifications: string[]
  availability: string
  sessionLength: string
  specialties: string
  calendlyUrl: string
  eventTypeUrl: string
  hourlyRate: number
}

interface CoachData {
  id: number
  userId: string
  firstName: string
  lastName: string
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

    if (error) throw error
    return { data: coachesData, error: null }
  } catch (error) {
    console.error('[FETCH_COACHES_ERROR]', error)
    return { data: null, error }
  }
} 