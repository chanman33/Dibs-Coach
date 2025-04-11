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
  const [calendarConnectionState, setCalendarConnectionState] = useState<'loading' | 'connected' | 'not_connected' | 'error'>('loading')
  const [initialCalendarLoad, setInitialCalendarLoad] = useState(true)

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
  const { data: calendarData, isLoading: isLoadingCalendars, error: calendarError } = useQuery({
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
    enabled: !!coachDbId,
    retry: 2
  })

  // Handle query errors
  useEffect(() => {
    if (calendarError) {
      setCalendarConnectionState('error')
      setInitialCalendarLoad(false)
    }
  }, [calendarError])

  // Update selectedCalendars when calendarData changes
  useEffect(() => {
    if (calendarData?.calendars?.length > 0) {
      setSelectedCalendars(calendarData.calendars)
      setCalendarConnectionState('connected')
      
      // Also fetch the token for API calls
      fetchToken()
    } else if (calendarData && (!calendarData.calendars || calendarData.calendars.length === 0)) {
      // We have data but no calendars
      setCalendarConnectionState('not_connected')
      setInitialCalendarLoad(false)
    } else if (!isLoadingCalendars && calendarError) {
      setCalendarConnectionState('error')
      setInitialCalendarLoad(false)
    }
  }, [calendarData, isLoadingCalendars, calendarError])

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
      } else {
        setCalendarConnectionState('not_connected')
        setInitialCalendarLoad(false)
      }
    } catch (error) {
      console.error('[FETCH_CAL_TOKEN_ERROR]', error)
      setCalendarConnectionState('error')
      setInitialCalendarLoad(false)
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
      setInitialCalendarLoad(false)
      return
    }
    
    setIsLoadingBusyTimes(true)
    
    try {
      // Get the first calendar as an example (you might want to fetch for all calendars)
      const calendar = selectedCalendars[0]
      
      if (!calendar.credentialId || !calendar.externalId) {
        console.error('[FETCH_BUSY_TIMES_ERROR] Missing calendar data', calendar)
        setCalendarConnectionState('error')
        setInitialCalendarLoad(false)
        return
      }
      
      // Get user's timezone
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
      
      const queryParams = new URLSearchParams({
        'loggedInUsersTz': timeZone,
        'coachUlid': coachDbId || '',
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
        setCalendarConnectionState('connected')
      }
    } catch (error) {
      console.error('[FETCH_BUSY_TIMES_ERROR]', error)
      toast.error('Failed to fetch calendar busy times')
      setCalendarConnectionState('error')
    } finally {
      setIsLoadingBusyTimes(false)
      setInitialCalendarLoad(false)
    }
  }

  // Handle manual refresh of busy times or connect calendar
  const handleCalendarAction = () => {
    if (calendarConnectionState === 'connected' || (selectedCalendars.length > 0 && calendarToken)) {
      setInitialCalendarLoad(true)
      fetchBusyTimes()
    } else {
      // Redirect to calendar connection page or open modal
      window.location.href = '/settings/calendar'
    }
  }

  // Include sessions loading in the overall loading state, but handle busyTimes separately
  const isSessionsLoading = isLoadingSessions || isLoadingDbId
  
  // Include busy times loading in the overall loading state
  const isCalendarLoading = isSessionsLoading || isLoadingBusyTimes || initialCalendarLoad

  // Get the button text based on calendar connection state
  const getCalendarActionText = () => {
    if (isLoadingBusyTimes) return 'Loading...'
    
    switch (calendarConnectionState) {
      case 'connected': return 'Refresh Calendar'
      case 'not_connected': return 'Connect Calendar'
      case 'error': return 'Retry Connection'
      default: return 'Calendar'
    }
  }

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

  // Determine if we need to show calendar connection notice
  const showCalendarConnectionNotice = 
    !isLoadingCalendars && !initialCalendarLoad && (calendarConnectionState === 'not_connected' || calendarConnectionState === 'error')

  return (
    <div className="container mx-auto py-6 px-4 h-full min-h-screen">
      <style jsx global>{calendarStyles}</style>
      
      {showCalendarConnectionNotice && (
        <div className="mb-4 p-3 border rounded-md bg-amber-50 border-amber-200 text-amber-800">
          {calendarConnectionState === 'not_connected' ? (
            <p>No calendar connected. Connect your calendar to see your busy times.</p>
          ) : (
            <p>There was an issue connecting to your calendar. Please try refreshing or check your settings.</p>
          )}
        </div>
      )}
      
      <CoachingCalendar
        sessions={transformedSessions}
        isLoading={isCalendarLoading}
        title="My Coaching Calendar"
        busyTimes={busyTimes}
        userRole="coach"
        coachDbId={coachDbId || undefined}
        isCalendlyLoading={isLoadingBusyTimes || isLoadingCalendars}
        isCalendlyConnected={calendarConnectionState === 'connected'}
        showCalendlyButton={true}
        onRefreshCalendly={handleCalendarAction}
        calendarActionText={getCalendarActionText()}
        calendarConnectionState={calendarConnectionState}
      />
    </div>
  )
} 