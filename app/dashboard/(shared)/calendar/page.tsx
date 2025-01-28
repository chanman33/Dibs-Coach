'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchUserSessions, fetchCoachSessions } from '@/utils/actions/sessions'
import { CoachingCalendar } from '@/components/calendar/coaching-calendar'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { useCalendly } from '@/utils/hooks/useCalendly'
import { Button } from '@/components/ui/button'
import { ROLES } from '@/utils/roles/roles'
import { Loader2, RefreshCw } from 'lucide-react'
import { startOfWeek, endOfWeek, addMonths } from 'date-fns'
import { CalendlyAvailabilitySchedule } from '@/utils/types/calendly'

// Mock data for testing
const mockAvailabilitySchedules: CalendlyAvailabilitySchedule[] = [{
  uri: 'mock-schedule-1',
  name: 'Regular Hours',
  default: true,
  timezone: 'America/Denver', // MST timezone
  active: true,
  rules: [
    {
      type: 'wday',
      wday: 3, // Wednesday
      intervals: [{ from: '09:00', to: '12:00' }]
    },
    {
      type: 'wday',
      wday: 4, // Thursday
      intervals: [{ from: '09:00', to: '12:00' }]
    },
    {
      type: 'wday',
      wday: 5, // Friday
      intervals: [{ from: '09:00', to: '12:00' }]
    }
  ]
}]

// Mock sessions for testing
const mockSessions = [
  {
    id: 1,
    durationMinutes: 60,
    status: 'scheduled',
    calendlyEventId: 'mock-1',
    startTime: '2025-01-30T16:00:00.000Z', // 9:00 AM MST = 16:00 UTC
    endTime: '2025-01-30T17:00:00.000Z',   // 10:00 AM MST = 17:00 UTC
    createdAt: '2025-01-25T00:00:00.000Z',
    userRole: 'coach' as const,
    otherParty: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    }
  },
  {
    id: 2,
    durationMinutes: 60,
    status: 'scheduled',
    calendlyEventId: 'mock-2',
    startTime: '2025-01-30T17:30:00.000Z', // 10:30 AM MST = 17:30 UTC
    endTime: '2025-01-30T18:30:00.000Z',   // 11:30 AM MST = 18:30 UTC
    createdAt: '2025-01-25T00:00:00.000Z',
    userRole: 'coach' as const,
    otherParty: {
      id: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com'
    }
  }
]

// Mock busy times for testing
const mockBusyTimes = [
  {
    uri: 'mock-busy-1',
    start_time: '2025-01-31T15:00:00.000Z', // 8:00 AM MST = 15:00 UTC
    end_time: '2025-01-31T15:30:00.000Z',   // 8:30 AM MST = 15:30 UTC
    type: 'busy_period'
  },
  {
    uri: 'mock-busy-2',
    start_time: '2025-01-31T15:30:00.000Z', // 8:30 AM MST = 15:30 UTC
    end_time: '2025-01-31T01:00:00.000Z',   // 6:00 PM MST = 01:00 UTC next day
    type: 'busy_period'
  }
]

export default function CalendarPage() {
  const { user } = useUser()
  const [userRole, setUserRole] = useState<'coach' | 'realtor' | null>(null)
  const { status, isLoading: isCalendlyLoading, handleConnect } = useCalendly()
  const [isLoadingBusyTimes, setIsLoadingBusyTimes] = useState(false)
  const [busyTimes, setBusyTimes] = useState<any[]>(mockBusyTimes)

  useEffect(() => {
    const fetchRole = async () => {
      if (!user?.id) return

      const response = await fetch(`/api/user/role?userId=${user.id}`)
      const data = await response.json()

      setUserRole(
        data.role === ROLES.REALTOR_COACH || data.role === ROLES.LOAN_OFFICER_COACH
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

      // Return mock sessions for testing
      return mockSessions

      // Uncomment below when ready for real data
      /*
      const data = userRole === 'coach'
        ? await fetchCoachSessions()
        : await fetchUserSessions()

      if (!data) return []
      return data
      */
    },
    enabled: !!userRole
  })

  const fetchBusyTimes = async () => {
    if (!status?.schedulingUrl) return

    try {
      setIsLoadingBusyTimes(true)
      // Fetch 3 months of data
      const startDate = startOfWeek(new Date())
      const endDate = endOfWeek(addMonths(new Date(), 3))

      const queryParams = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })

      const response = await fetch(`/api/calendly/availability/schedules?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch availability data')
      }

      const { data } = await response.json()
      setBusyTimes(data.busyTimes || [])
    } catch (error) {
      console.error('Error fetching busy times:', error)
    } finally {
      setIsLoadingBusyTimes(false)
    }
  }

  // Fetch busy times when Calendly is connected
  useEffect(() => {
    if (status?.connected && userRole === 'coach') {
      fetchBusyTimes()
    }
  }, [status?.connected, userRole])

  const handleCalendlyAction = async () => {
    if (!status?.connected) {
      handleConnect()
    } else {
      fetchBusyTimes()
    }
  }

  return (
    <div>
      <div className="p-6">
        <CoachingCalendar
          sessions={sessions}
          isLoading={isLoading}
          title={userRole === 'coach' ? "My Coaching Schedule" : "My Coaching Calendar"}
          busyTimes={busyTimes}
          onRefreshCalendly={handleCalendlyAction}
          isCalendlyConnected={status?.connected}
          isCalendlyLoading={isCalendlyLoading || isLoadingBusyTimes}
          showCalendlyButton={userRole === 'coach'}
          userRole={userRole === 'coach' ? 'coach' : 'mentee'}
          availabilitySchedules={mockAvailabilitySchedules}
        />
      </div>
    </div>
  )
} 