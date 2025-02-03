'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchCoachSessions } from '@/utils/actions/sessions'
import { CoachingCalendar } from '@/components/calendar/coaching-calendar'
import { useEffect, useState } from 'react'
import { useCalendlyConnection } from '@/utils/hooks/useCalendly'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw } from 'lucide-react'
import { startOfWeek, endOfWeek, addMonths } from 'date-fns'
import { CalendlyAvailabilitySchedule } from '@/utils/types/calendly'
import { CoachingAvailabilityEditor } from '@/components/calendly/CoachingAvailabilityEditor'
import { AvailabilityScheduleView } from '@/components/calendly/AvailabilityScheduleView'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export default function CoachCalendarPage() {
  const { status, isLoading: isCalendlyLoading, handleConnect } = useCalendlyConnection()
  const [isLoadingBusyTimes, setIsLoadingBusyTimes] = useState(false)
  const [busyTimes, setBusyTimes] = useState<any[]>([])
  const [coachingSchedules, setCoachingSchedules] = useState<CalendlyAvailabilitySchedule[]>([])
  const [isLoadingCoachingSchedules, setIsLoadingCoachingSchedules] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<CalendlyAvailabilitySchedule | null>(null)

  // Fetch coaching availability schedules
  const fetchCoachingSchedules = async () => {
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

  // Fetch coaching schedules on mount
  useEffect(() => {
    fetchCoachingSchedules()
  }, [])

  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['coach-sessions'],
    queryFn: async () => {
      const data = await fetchCoachSessions()
      if (!data) return []
      return data
    },
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
    if (status?.connected) {
      fetchBusyTimes()
    }
  }, [status?.connected])

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
          title="My Coaching Schedule"
          busyTimes={busyTimes}
          onRefreshCalendly={handleCalendlyAction}
          isCalendlyConnected={status?.connected}
          isCalendlyLoading={isCalendlyLoading || isLoadingBusyTimes}
          showCalendlyButton={true}
          userRole="coach"
          availabilitySchedules={coachingSchedules}
        />

        {/* Availability management for coaches */}
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
      </div>
    </div>
  )
} 