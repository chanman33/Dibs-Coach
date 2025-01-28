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
import { startOfWeek, endOfWeek } from 'date-fns'

export default function CalendarPage() {
  const { user } = useUser()
  const [userRole, setUserRole] = useState<'coach' | 'realtor' | null>(null)
  const { status, isLoading: isCalendlyLoading, handleConnect } = useCalendly()
  const [isLoadingBusyTimes, setIsLoadingBusyTimes] = useState(false)
  const [busyTimes, setBusyTimes] = useState<any[]>([])

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
      const startDate = startOfWeek(new Date())
      const endDate = endOfWeek(new Date())

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
        />
      </div>
    </div>
  )
} 