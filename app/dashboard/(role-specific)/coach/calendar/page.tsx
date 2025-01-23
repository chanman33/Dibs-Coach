'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchCoachSessions } from '@/utils/actions/sessions'
import { CoachingCalendar } from '@/components/calendar/coaching-calendar'

export default function CoachCalendarPage() {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['coach-sessions'],
    queryFn: async () => {
      const data = await fetchCoachSessions()
      if (!data) return []
      return data
    },
  })

  return (
    <CoachingCalendar 
      sessions={sessions}
      isLoading={isLoading}
      title="My Coaching Schedule"
    />
  )
}
