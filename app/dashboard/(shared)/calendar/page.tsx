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
import { CoachingAvailabilityEditor } from '@/components/calendly/CoachingAvailabilityEditor'
import { AvailabilityScheduleView } from '@/components/calendly/AvailabilityScheduleView'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'


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
  const [busyTimes, setBusyTimes] = useState<any[]>([])
  const [coachingSchedules, setCoachingSchedules] = useState<CalendlyAvailabilitySchedule[]>([])
  const [isLoadingCoachingSchedules, setIsLoadingCoachingSchedules] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<CalendlyAvailabilitySchedule | null>(null)

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

  // Fetch coaching availability schedules
  const fetchCoachingSchedules = async () => {
    if (userRole !== 'coach') return

    try {
      setIsLoadingCoachingSchedules(true)
      const response = await fetch('/api/coaching/availability')
      if (!response.ok) {
        throw new Error('Failed to fetch coaching schedules')
      }
      const { data } = await response.json()
      setCoachingSchedules(data)
    } catch (error) {
      console.error('[FETCH_COACHING_SCHEDULES_ERROR]', error)
    } finally {
      setIsLoadingCoachingSchedules(false)
    }
  }

  // Fetch coaching schedules when role is determined
  useEffect(() => {
    if (userRole === 'coach') {
      fetchCoachingSchedules()
    }
  }, [userRole])

  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
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

  const isPageLoading = isLoadingBusyTimes || isLoadingCoachingSchedules || isLoadingSessions

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/coaching/availability?id=${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error('Failed to delete schedule')
      }
      toast.success('Schedule deleted successfully')
      fetchCoachingSchedules()
    } catch (error) {
      console.error('[DELETE_SCHEDULE_ERROR]', error)
      toast.error('Failed to delete schedule')
    }
  }

  const handleStartEdit = (schedule: CalendlyAvailabilitySchedule) => {
    setEditingSchedule(schedule)
    setShowEditor(true)
  }

  const handleCancelEdit = () => {
    setEditingSchedule(null)
    setShowEditor(false)
  }

  const handleSaveEdit = () => {
    setEditingSchedule(null)
    setShowEditor(false)
    fetchCoachingSchedules()
  }

  return (
    <div>
      <div className="p-6 space-y-6">
        <CoachingCalendar
          sessions={sessions}
          isLoading={isPageLoading}
          title={userRole === 'coach' ? "My Coaching Schedule" : "My Coaching Calendar"}
          busyTimes={busyTimes}
          onRefreshCalendly={handleCalendlyAction}
          isCalendlyConnected={status?.connected}
          isCalendlyLoading={isCalendlyLoading || isLoadingBusyTimes}
          showCalendlyButton={userRole === 'coach'}
          userRole={userRole === 'coach' ? 'coach' : 'mentee'}
          availabilitySchedules={coachingSchedules}
        />

        {/* Only show availability management for coaches */}
        {userRole === 'coach' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Coaching Availability</span>
                {!showEditor && (
                  <Button onClick={() => setShowEditor(true)}>
                    Add Schedule
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showEditor ? (
                <CoachingAvailabilityEditor
                  initialData={editingSchedule || undefined}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                />
              ) : coachingSchedules.length > 0 ? (
                <div className="space-y-8">
                  {coachingSchedules.map((schedule) => (
                    <AvailabilityScheduleView
                      key={schedule.id}
                      schedule={schedule}
                      onDelete={() => handleDelete(schedule.id)}
                      onEdit={() => handleStartEdit(schedule)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No coaching availability schedules found. Add a schedule to set your coaching hours.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 