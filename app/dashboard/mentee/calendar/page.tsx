'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchUserSessions } from '@/utils/actions/sessions'
import { MenteeCalendar } from '@/components/mentee/MenteeCalendar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { generateMockSessions, mockConfig, MockDataScenario } from '@/utils/mock/calendar-data'

interface ExtendedSession {
  ulid: string
  startTime: string
  endTime: string
  durationMinutes: number
  status: string
  userRole: string
  otherParty: {
    ulid: string
    firstName: string | null
    lastName: string | null
    email: string | null
    imageUrl: string | null
  }
}

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
  const { data: sessions, isLoading } = useQuery<ExtendedSession[]>({
    queryKey: ['mentee-sessions'],
    queryFn: async () => {
      if (mockConfig.enabled) {
        // Use mock data in development
        return generateMockSessions(mockConfig.scenario)
      }
      
      // Use real API in production
      const response = await fetchUserSessions(null)
      if (!response?.data) return []
      
      return response.data.map(session => ({
        ulid: session.ulid,
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes: session.durationMinutes,
        status: session.status,
        userRole: session.userRole,
        otherParty: {
          ulid: session.otherParty.ulid,
          firstName: session.otherParty.firstName,
          lastName: session.otherParty.lastName,
          email: session.otherParty.email,
          imageUrl: session.otherParty.profileImageUrl
        }
      }))
    },
  })

  return (
    <div className="h-[calc(100vh-4rem)]">
      <MenteeCalendar 
        sessions={sessions}
        isLoading={isLoading}
        title="My Coaching Calendar"
      />
    </div>
  )
} 