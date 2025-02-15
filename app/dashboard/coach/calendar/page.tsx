'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchCoachSessions } from '@/utils/actions/sessions'
import { fetchUserDbId } from '@/utils/actions/profile-actions'
import { CoachingCalendar } from '@/components/calendar/CoachingCalendar'
import { useEffect, useState } from 'react'
import { useCalendlyConnection } from '@/utils/hooks/useCalendly'
import { Loader2, RefreshCw } from 'lucide-react'
import { startOfWeek, endOfWeek, addMonths } from 'date-fns'
import { toast } from 'sonner'
import { useUser } from '@clerk/nextjs'

export default function CoachCalendarPage() {
  const { user } = useUser()
  const { status, isLoading: isCalendlyLoading, handleConnect } = useCalendlyConnection()
  const [isLoadingBusyTimes, setIsLoadingBusyTimes] = useState(false)
  const [busyTimes, setBusyTimes] = useState<any[]>([])
  const [coachDbId, setCoachDbId] = useState<number | null>(null)

  // Fetch coach's database ID using server action
  const { data: dbId, isLoading: isLoadingDbId } = useQuery({
    queryKey: ['coach-db-id', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      try {
        return await fetchUserDbId()
      } catch (error) {
        console.error('[FETCH_COACH_ID_ERROR]', error)
        toast.error('Failed to fetch coach information')
        return null
      }
    },
    enabled: !!user?.id
  })

  // Update coachDbId when dbId changes
  useEffect(() => {
    if (dbId) {
      setCoachDbId(dbId)
    }
  }, [dbId])

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

  const isPageLoading = isLoadingBusyTimes || isLoadingSessions || isLoadingDbId

  return (
    <div className="p-6 space-y-6">
      <CoachingCalendar
        sessions={sessions?.filter(s => s.calendlyEventId !== null)}
        isLoading={isPageLoading}
        title="My Coaching Schedule"
        busyTimes={busyTimes}
        onRefreshCalendly={handleCalendlyAction}
        isCalendlyConnected={status?.connected}
        isCalendlyLoading={isCalendlyLoading || isLoadingBusyTimes}
        showCalendlyButton={true}
        userRole="coach"
        coachDbId={coachDbId || undefined}
      />
    </div>
  )
} 