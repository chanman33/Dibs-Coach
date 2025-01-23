'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchUserSessions, fetchCoachSessions } from '@/utils/actions/sessions'
import { CoachingCalendar } from '@/components/calendar/coaching-calendar'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export default function CalendarPage() {
  const { user } = useUser()
  const [userRole, setUserRole] = useState<'coach' | 'realtor' | null>(null)

  useEffect(() => {
    const fetchRole = async () => {
      if (!user?.id) return
      
      const response = await fetch(`/api/user/role?userId=${user.id}`)
      const data = await response.json()
      
      setUserRole(
        data.role === 'REALTOR_COACH' || data.role === 'LOAN_OFFICER_COACH' 
          ? 'coach' 
          : 'realtor'
      )
    }

    fetchRole()
  }, [user?.id])

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions', userRole],
    queryFn: async () => {
      if (!userRole) return []
      
      const data = userRole === 'coach' 
        ? await fetchCoachSessions()
        : await fetchUserSessions()
      
      if (!data) return []
      return data
    },
    enabled: !!userRole
  })

  return (
    <CoachingCalendar 
      sessions={sessions} 
      isLoading={isLoading}
      title={userRole === 'coach' ? "My Coaching Schedule" : "My Coaching Calendar"}
    />
  )
} 