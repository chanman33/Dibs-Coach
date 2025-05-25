'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCoachSessions } from '@/utils/actions/sessions'
import { fetchUserDbId } from '@/utils/actions/user-profile-actions'
import { refreshUserCalTokens } from '@/utils/actions/cal/cal-tokens'
import { CoachingCalendar } from '@/components/coaching/CoachingCalendar'
import { useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@clerk/nextjs'

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
  const { user, isLoaded: isUserLoaded } = useUser()
  const queryClient = useQueryClient()
  const [coachDbId, setCoachDbId] = useState<string | null>(null)
  const [busyTimes, setBusyTimes] = useState<BusyTime[]>([])
  const [isLoadingBusyTimes, setIsLoadingBusyTimes] = useState(false)
  const [selectedCalendars, setSelectedCalendars] = useState<Calendar[]>([])
  const [calendarConnectionState, setCalendarConnectionState] = useState<'loading' | 'connected' | 'not_connected' | 'error' | 'auth_error'>('loading')
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
    enabled: !!user?.id && isUserLoaded
  })

  // Update coachDbId when dbId changes
  useEffect(() => {
    if (dbId) {
      console.log('[CoachCalendarPage] Setting coachDbId:', dbId);
      setCoachDbId(dbId)
    }
  }, [dbId])

  // Fetch coach sessions
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['coach-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const response = await fetchCoachSessions({})
      return response.data || []
    },
    enabled: !!user?.id && isUserLoaded
  })

  // Fetch coach's calendars
  const { data: calendarData, isLoading: isLoadingCalendars, error: calendarError } = useQuery({
    queryKey: ['coach-calendars', coachDbId, user?.id],
    queryFn: async () => {
      console.log('[CoachCalendarPage] Running fetch for coach-calendars with coachDbId:', coachDbId);
      if (!coachDbId || !user?.id) return null
      
      try {
        const response = await fetch('/api/cal/calendars/get-all-calendars')
        
        if (response.status === 401 || response.status === 498) {
          setCalendarConnectionState('auth_error')
          return null
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          // Check for specific token errors in response
          if (errorData?.data?.tokenError || errorData?.data?.tokenRefreshFailed) {
            console.log('[CoachCalendarPage] Token error detected in response:', errorData);
            setCalendarConnectionState('auth_error');
            return null;
          }
          throw new Error('Failed to fetch calendars')
        }
        
        const data = await response.json()
        return data.success ? data.data : null
      } catch (error) {
        console.error('[FETCH_CALENDARS_ERROR]', error)
        setCalendarConnectionState('error')
        setInitialCalendarLoad(false)
        throw error
      }
    },
    enabled: !!coachDbId && !!user?.id && isUserLoaded,
    retry: (failureCount, error: any) => {
      if (calendarConnectionState === 'auth_error') return false
      if (error?.message?.includes('401') || error?.status === 401 || error?.status === 498) return false
      return failureCount < 2
    },
    staleTime: 1000 * 60 * 5 // 5 minutes - consider data fresh for this long
  })

  // Handle query errors
  useEffect(() => {
    if (calendarError && calendarConnectionState !== 'auth_error') {
      setCalendarConnectionState('error')
      setInitialCalendarLoad(false)
    }
  }, [calendarError, calendarConnectionState])

  // Update selectedCalendars when calendarData changes
  useEffect(() => {
    if (!isLoadingCalendars && !calendarError && calendarData?.calendars?.length > 0) {
      setSelectedCalendars(calendarData.calendars)
      // Calendars loaded, mark as connected and trigger busy time fetch
      setCalendarConnectionState('connected')
      // Call fetchBusyTimes directly now that calendars are loaded
      fetchBusyTimes(calendarData.calendars)
    } else if (!isLoadingCalendars && !calendarError && calendarData && (!calendarData.calendars || calendarData.calendars.length === 0)) {
      setCalendarConnectionState('not_connected')
      setInitialCalendarLoad(false)
    } else if (!isLoadingCalendars && calendarError && calendarConnectionState !== 'auth_error') {
      setCalendarConnectionState('error')
      setInitialCalendarLoad(false)
    }
  }, [calendarData, isLoadingCalendars, calendarError, user?.id])

  // Function to fetch busy times - takes calendars as argument now
  const fetchBusyTimes = async (calendarsToFetch: Calendar[]) => {
    // Use the passed calendars, or the state if called by refresh
    const currentCalendars = calendarsToFetch.length > 0 ? calendarsToFetch : selectedCalendars;

    if (currentCalendars.length === 0 || !user?.id || calendarConnectionState === 'auth_error') {
      setInitialCalendarLoad(false)
      if (calendarConnectionState === 'auth_error') {
        toast.error("Calendar connection needs refresh. Please try refreshing or check settings.")
      }
      return
    }
    
    setIsLoadingBusyTimes(true)
    
    try {
      // Use the first available calendar for the query
      // TODO: Potentially handle multiple calendars if API supports it
      const calendar = currentCalendars[0];
      
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
        'coachUlid': coachDbId || '', // Backend needs coachUlid to get the token
        'calendarsToLoad[0][credentialId]': calendar.credentialId.toString(),
        'calendarsToLoad[0][externalId]': calendar.externalId.toString()
      })
      
      // Call the busy times API - No Authorization header needed from frontend
      const response = await fetch(`/api/cal/calendars/get-busy-times?${queryParams.toString()}`);
      
      // Backend handles 401 by trying to refresh token
      // If it still fails, it will return a non-ok status
      if (response.status === 401 || response.status === 498) {
        // This case might indicate a deeper auth issue not resolvable by token refresh
        console.error('[FETCH_BUSY_TIMES_ERROR] Authentication failed with status:', response.status)
        setCalendarConnectionState('auth_error') 
        setInitialCalendarLoad(false)
        setIsLoadingBusyTimes(false)
        
        // Try to get more detailed error info
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error || "Calendar authentication failed. Please check settings.";
        
        toast.error(errorMessage)
        return
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error || `Failed to fetch busy times: ${response.status}`;
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      
      if (data.status === 'success' && Array.isArray(data.data)) {
        console.log('[FETCH_BUSY_TIMES] Got busy times:', data.data)
        setBusyTimes(data.data)
        setCalendarConnectionState('connected')
      } else {
        console.warn('[FETCH_BUSY_TIMES] API returned non-success status or invalid data:', data)
        throw new Error('Failed to get valid busy times data')
      }
      
      // Manually trigger fetching calendars again, which will then trigger busy times
      queryClient.invalidateQueries({ queryKey: ['coach-calendars', coachDbId, user?.id] });
    } catch (error) {
      console.error('[FETCH_BUSY_TIMES_ERROR]', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch calendar busy times')
      setCalendarConnectionState('error')
    } finally {
      setIsLoadingBusyTimes(false)
      setInitialCalendarLoad(false)
    }
  }

  // Handle manual refresh of busy times or connect calendar
  const handleCalendarAction = async () => {
    if (calendarConnectionState === 'auth_error') {
      toast.info("Authentication with calendar provider may have expired. Trying to refresh...")
      setInitialCalendarLoad(true)
      
      if (coachDbId) {
        // First try to refresh Cal.com tokens before fetching data
        try {
          const refreshResult = await refreshUserCalTokens(coachDbId, true);
          if (refreshResult.success) {
            toast.success("Calendar tokens refreshed successfully");
            // Invalidate existing queries
            queryClient.invalidateQueries({ queryKey: ['coach-calendars', coachDbId, user?.id] });
            // Reset the calendar connection state
            setCalendarConnectionState('loading');
          } else {
            // If token refresh fails, still try to fetch data normally
            toast.warning("Token refresh failed, trying direct connection");
          }
        } catch (error) {
          console.error('[CAL_TOKEN_REFRESH_ERROR]', error);
          toast.error("Token refresh failed, trying direct connection");
        }
      }
      
      fetchBusyTimes(selectedCalendars)
    } else if (calendarConnectionState === 'connected' || calendarConnectionState === 'error') {
      setInitialCalendarLoad(true)
      fetchBusyTimes(selectedCalendars)
    } else if (calendarConnectionState === 'not_connected') {
      window.location.href = '/dashboard/settings?tab=integrations'
    } else {
      console.log("Calendar action called while in state:", calendarConnectionState)
    }
  }

  // Include sessions loading in the overall loading state, but handle busyTimes separately
  const isSessionsLoading = isLoadingSessions || isLoadingDbId || !isUserLoaded
  
  // Include busy times loading in the overall loading state
  const isCalendarLoading = isSessionsLoading || isLoadingBusyTimes || initialCalendarLoad

  // Get the button text based on calendar connection state
  const getCalendarActionText = () => {
    if (isLoadingBusyTimes || initialCalendarLoad) return 'Loading...'
    
    switch (calendarConnectionState) {
      case 'connected': return 'Refresh Calendar'
      case 'not_connected': return 'Connect Calendar'
      case 'error': return 'Retry Connection'
      case 'auth_error': return 'Refresh Connection'
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
    },
    sessionType: (s as any).sessionType,
    zoomJoinUrl: (s as any).zoomJoinUrl,
    paymentStatus: (s as any).paymentStatus,
    price: (s as any).price,
    calBookingUid: (s as any).calBookingUid
  }))

  // Determine if we need to show calendar connection notice
  const showCalendarConnectionNotice = 
    !isLoadingCalendars && !initialCalendarLoad && 
    (calendarConnectionState === 'not_connected' || 
     calendarConnectionState === 'error' || 
     calendarConnectionState === 'auth_error')

  return (
    <div className="container mx-auto py-6 px-4 h-full min-h-screen">
      <style jsx global>{calendarStyles}</style>
      
      {showCalendarConnectionNotice && (
        <div className="mb-4 p-3 border rounded-md bg-amber-50 border-amber-200 text-amber-800">
          {calendarConnectionState === 'not_connected' ? (
            <p>No calendar connected. Connect your calendar to see your busy times.</p>
          ) : calendarConnectionState === 'auth_error' ? (
            <p>Calendar connection requires refresh. Please click 'Refresh Connection' or check settings.</p>
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
