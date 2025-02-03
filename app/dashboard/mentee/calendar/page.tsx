'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchUserSessions } from '@/utils/actions/sessions'
import { CoachingCalendar } from '@/components/calendar/coaching-calendar'

export default function MenteeCalendarPage() {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['mentee-sessions'],
    queryFn: async () => {
      const data = await fetchUserSessions()
      if (!data) return []
      return data
    },
  })

  return (
    <div className="p-6 space-y-6">
      <CoachingCalendar 
        sessions={sessions}
        isLoading={isLoading}
        title="My Coaching Calendar"
        userRole="mentee"
        showCalendlyButton={false}
      />
    </div>
  )
} 