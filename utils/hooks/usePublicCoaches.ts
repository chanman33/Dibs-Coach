import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { PublicCoach } from '@/utils/types/coach'

export function usePublicCoaches() {
  const [coaches, setCoaches] = useState<PublicCoach[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    async function fetchCoaches() {
      try {
        const { data, error } = await supabase
          .from('CoachProfile')
          .select(`
            ulid,
            coachingSpecialties,
            hourlyRate,
            isActive,
            averageRating,
            totalSessions,
            user:userUlid (
              firstName,
              lastName,
              displayName,
              profileImageUrl,
              bio
            )
          `)
          .eq('isActive', true)
          .order('createdAt', { ascending: false })

        if (error) throw error
        if (isMounted && data) {
          setCoaches(data.map(coach => ({
            ulid: coach.ulid,
            firstName: coach.user.firstName,
            lastName: coach.user.lastName,
            displayName: coach.user.displayName,
            profileImageUrl: coach.user.profileImageUrl,
            bio: coach.user.bio,
            coachingSpecialties: coach.coachingSpecialties || [],
            hourlyRate: coach.hourlyRate,
            averageRating: coach.averageRating,
            totalSessions: coach.totalSessions || 0
          })))
        }
      } catch (error) {
        console.error('Error fetching coaches:', error)
        if (isMounted) {
          setError('Failed to load coaches. Please try again later.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchCoaches()

    return () => {
      isMounted = false
    }
  }, [supabase])

  return { coaches, isLoading, error }
} 