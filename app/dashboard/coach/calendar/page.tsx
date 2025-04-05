'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchCoachSessions } from '@/utils/actions/sessions'
import { fetchUserDbId } from '@/utils/actions/user-profile-actions'
import { CoachingCalendar } from '@/components/coaching/CoachingCalendar'
import { useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { startOfWeek, endOfWeek, addMonths } from 'date-fns'
import { toast } from 'sonner'
import { useUser } from '@clerk/nextjs'
import { TransformedSession } from '@/utils/types/session'

import { Button } from '@/components/ui/button'

// Minimal styles to fix calendar issues without causing scrollbar problems
const calendarStyles = `
  /* Remove transitions to prevent layout shifts */
  .rbc-calendar, .rbc-view-container {
    transition: none !important;
  }
  
  /* Ensure toolbar is properly spaced */
  .rbc-toolbar {
    margin-bottom: 10px !important;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  /* Improve month view cell appearance */
  .rbc-month-view .rbc-date-cell {
    text-align: center;
    padding: 4px;
  }
  
  /* Fix time view scrolling */
  .rbc-time-view {
    height: calc(100% - 50px) !important;
    border: none;
  }
  
  .rbc-time-content {
    overflow-y: auto !important;
    max-height: calc(100% - 80px) !important;
    border-top: 1px solid hsl(var(--border));
  }
  
  /* Ensure consistent time slot heights for predictable scrolling */
  .rbc-timeslot-group {
    min-height: 50px !important;
    height: 50px !important;
  }
  
  .rbc-time-header {
    border-bottom: none;
  }
  
  /* Ensure month view fits properly */
  .rbc-month-view {
    height: calc(100% - 50px) !important;
    min-height: auto !important;
  }
  
  /* Calendar wrapper */
  .calendar-wrapper {
    height: 100% !important;
    min-height: 600px;
    overflow: hidden;
  }
  
  /* Ensure events are visible */
  .rbc-event {
    z-index: 3;
  }
  
  /* Responsive toolbar */
  @media (max-width: 640px) {
    .rbc-toolbar {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .calendar-wrapper {
      min-height: 500px;
    }
  }
`;

// Interface for the busy times response
interface BusyTime {
  start: string;
  end: string;
  source: string;
}

// Interface for the calendar response
interface Calendar {
  id: number | string;
  name: string;
  primary: boolean;
  externalId: string;
  integration: string;
  email: string | null;
  credentialId: number | string;
  isSelected: boolean;
}

export default function CoachCalendarPage() {
  const { user } = useUser()
  const [coachDbId, setCoachDbId] = useState<string | null>(null)
  const [busyTimes, setBusyTimes] = useState<BusyTime[]>([])
  const [isLoadingBusyTimes, setIsLoadingBusyTimes] = useState(false)
  const [calendarToken, setCalendarToken] = useState<string | null>(null)
  const [selectedCalendars, setSelectedCalendars] = useState<Calendar[]>([])

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

  // Fetch coach sessions
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['coach-sessions'],
    queryFn: async () => {
      const response = await fetchCoachSessions({})
      return response.data || []
    },
  })

  // Fetch coach's calendars
  const { data: calendarData, isLoading: isLoadingCalendars } = useQuery({
    queryKey: ['coach-calendars', coachDbId],
    queryFn: async () => {
      if (!coachDbId) return null
      
      const response = await fetch('/api/cal/calendars/get-all-calendars')
      if (!response.ok) {
        throw new Error('Failed to fetch calendars')
      }
      const data = await response.json()
      return data.success ? data.data : null
    },
    enabled: !!coachDbId
  })

  // Update selectedCalendars when calendarData changes
  useEffect(() => {
    if (calendarData?.calendars?.length > 0) {
      setSelectedCalendars(calendarData.calendars)
      
      // Also fetch the token for API calls
      fetchToken()
    }
  }, [calendarData])

  // Fetch Cal.com access token
  const fetchToken = async () => {
    try {
      const response = await fetch('/api/cal/calendars/status')
      
      if (!response.ok) {
        throw new Error('Failed to fetch calendar status')
      }
      
      const data = await response.json()
      
      if (data.success && data.data?.accessToken) {
        setCalendarToken(data.data.accessToken)
      }
    } catch (error) {
      console.error('[FETCH_CAL_TOKEN_ERROR]', error)
    }
  }

  // Fetch busy times when calendars and token are available
  useEffect(() => {
    if (selectedCalendars.length > 0 && calendarToken) {
      fetchBusyTimes()
    }
  }, [selectedCalendars, calendarToken])

  // Function to fetch busy times
  const fetchBusyTimes = async () => {
    if (selectedCalendars.length === 0 || !calendarToken) {
      return
    }
    
    setIsLoadingBusyTimes(true)
    
    try {
      // Get the first calendar as an example (you might want to fetch for all calendars)
      const calendar = selectedCalendars[0]
      
      if (!calendar.credentialId || !calendar.externalId) {
        console.error('[FETCH_BUSY_TIMES_ERROR] Missing calendar data', calendar)
        return
      }
      
      // Get user's timezone
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
      
      const queryParams = new URLSearchParams({
        'loggedInUsersTz': timeZone,
        'calendarsToLoad[0][credentialId]': calendar.credentialId.toString(),
        'calendarsToLoad[0][externalId]': calendar.externalId.toString()
      })
      
      // Call the busy times API
      const response = await fetch(`/api/cal/calendars/get-busy-times?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${calendarToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch busy times: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.status === 'success' && Array.isArray(data.data)) {
        console.log('[FETCH_BUSY_TIMES] Got busy times:', data.data)
        setBusyTimes(data.data)
      }
    } catch (error) {
      console.error('[FETCH_BUSY_TIMES_ERROR]', error)
      toast.error('Failed to fetch calendar busy times')
    } finally {
      setIsLoadingBusyTimes(false)
    }
  }

  // Handle manual refresh of busy times
  const handleRefreshBusyTimes = () => {
    fetchBusyTimes()
  }

  // Include all loading states in the overall loading state
  const isPageLoading = isLoadingSessions || isLoadingDbId || isLoadingCalendars || isLoadingBusyTimes

  // Define Session interface to fix TypeScript error
  interface SessionData {
    ulid: string
    durationMinutes: number
    status: string
    startTime: string
    endTime: string
    createdAt: string
    otherParty: {
      ulid: string
      firstName: string | null
      lastName: string | null
      email: string | null
      profileImageUrl: string | null
    }
  }

  const transformedSessions = (sessions || []).map((s: SessionData) => ({
    ulid: s.ulid,
    durationMinutes: s.durationMinutes,
    status: s.status.toString(),
    startTime: s.startTime,
    endTime: s.endTime,
    createdAt: s.createdAt,
    userRole: 'coach' as const,
    otherParty: {
      ulid: s.otherParty.ulid,
      firstName: s.otherParty.firstName,
      lastName: s.otherParty.lastName,
      email: s.otherParty.email,
      imageUrl: s.otherParty.profileImageUrl
    }
  }))

  return (
    <div className="container mx-auto py-6 px-4 h-full min-h-screen">
      <style jsx global>{calendarStyles}</style>
      
      {/* Optional refresh button */}
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={handleRefreshBusyTimes}
          disabled={isLoadingBusyTimes || !calendarToken || selectedCalendars.length === 0}
        >
          {isLoadingBusyTimes ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh Calendar
        </Button>
      </div>
      
      <CoachingCalendar
        sessions={transformedSessions}
        isLoading={isPageLoading}
        title="My Coaching Calendar"
        busyTimes={busyTimes}
        userRole="coach"
        coachDbId={coachDbId || undefined}
      />
    </div>
  )
} 