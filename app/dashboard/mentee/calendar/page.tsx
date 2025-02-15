'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchUserSessions } from '@/utils/actions/sessions'
import { CoachingCalendar } from '@/components/calendar/CoachingCalendar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const NoSessionsPrompt = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-muted/30 rounded-lg">
      <h3 className="text-xl font-semibold">No Coaching Sessions Booked</h3>
      <p className="text-muted-foreground max-w-md">
        Ready to accelerate your real estate career? Book your first coaching session with one of our expert coaches.
      </p>
      <Link href="/dashboard/mentee/browse-coaches">
        <Button size="lg" className="mt-2">
          Find a Coach
        </Button>
      </Link>
    </div>
  )
}

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
      {!isLoading && sessions?.length === 0 && <NoSessionsPrompt />}
    </div>
  )
} 