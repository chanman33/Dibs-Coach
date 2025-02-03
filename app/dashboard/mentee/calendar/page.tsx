'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchUserSessions } from '@/utils/actions/sessions'
import { CoachingCalendar } from '@/components/calendar/coaching-calendar'

export default function RealtorCalendarPage() {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const data = await fetchUserSessions()
      if (!data) return []
      return data
    },
  })

  return (
    <CoachingCalendar 
      sessions={sessions} 
      isLoading={isLoading}
      title="My Coaching Calendar"
    />
  )
}
