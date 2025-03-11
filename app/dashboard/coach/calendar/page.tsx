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
import { TransformedSession, SessionType } from '@/utils/types/session'

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
    border-top: 1px solid #ddd;
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
    height: 600px !important;
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
      height: 500px !important;
    }
  }
`;

export default function CoachCalendarPage() {
  const { user } = useUser()
  const { handleConnect } = useCalendlyConnection()
  const [isLoadingBusyTimes, setIsLoadingBusyTimes] = useState(false)
  const [busyTimes, setBusyTimes] = useState<any[]>([])
  const [coachDbId, setCoachDbId] = useState<string | null>(null)
  const [hasCalendlyConnection, setHasCalendlyConnection] = useState<boolean | null>(null)
  const [schedulingUrl, setSchedulingUrl] = useState<string | null>(null)

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

  // Fetch Calendly connection status from database
  const { 
    data: calendlyDbStatus, 
    isLoading: isLoadingCalendlyDbStatus,
    refetch: refetchCalendlyStatus
  } = useQuery({
    queryKey: ['coach-calendly-status', dbId],
    queryFn: async () => {
      if (!dbId) return { hasConnection: false }
      try {
        const result = await fetchCoachCalendlyStatus()
        console.log('[CALENDLY_DB_STATUS]', {
          result,
          timestamp: new Date().toISOString()
        })
        return { 
          hasConnection: !!result.data?.connected,
          schedulingUrl: result.data?.schedulingUrl
        }
      } catch (error) {
        console.error('[FETCH_CALENDLY_STATUS_ERROR]', error)
        return { hasConnection: false }
      }
    },
    enabled: !!dbId
  })

  // Update connection status when data is available
  useEffect(() => {
    if (calendlyDbStatus) {
      setHasCalendlyConnection(calendlyDbStatus.hasConnection)
      setSchedulingUrl(calendlyDbStatus.schedulingUrl || null)
    }
  }, [calendlyDbStatus])

  // Update coachDbId when dbId changes
  useEffect(() => {
    if (dbId) {
      setCoachDbId(dbId)
    }
  }, [dbId])

  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['coach-sessions'],
    queryFn: async () => {
      const response = await fetchCoachSessions({})
      return response.data || []
    },
  })

  const fetchBusyTimes = async () => {
    // Early return if not connected or missing scheduling URL
    if (!hasCalendlyConnection || !schedulingUrl) {
      setBusyTimes([])
      setIsLoadingBusyTimes(false)
      return
    }

    try {
      setIsLoadingBusyTimes(true)
      // Fetch 3 months of data
      const startDate = startOfWeek(new Date())
      const endDate = endOfWeek(addMonths(new Date(), 3))

      console.log('[FETCH_BUSY_TIMES]', {
        hasCalendlyConnection,
        schedulingUrl,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timestamp: new Date().toISOString()
      })

      // First try to get availability schedules
      const schedulesParams = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })

      const schedulesResponse = await fetch(`/api/calendly/availability/schedules?${schedulesParams}`)
      
      if (!schedulesResponse.ok) {
        console.error('[FETCH_SCHEDULES_ERROR]', {
          status: schedulesResponse.status,
          statusText: schedulesResponse.statusText,
          timestamp: new Date().toISOString()
        })
        
        // If schedules fail, try busy times directly
        const busyTimesParams = new URLSearchParams({
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString()
        })
        
        const busyTimesResponse = await fetch(`/api/calendly/busy-times?${busyTimesParams}`)
        
        if (!busyTimesResponse.ok) {
          throw new Error(`Failed to fetch busy times: ${busyTimesResponse.status}`)
        }
        
        const busyTimesData = await busyTimesResponse.json()
        setBusyTimes(busyTimesData.busyTimes || [])
        return
      }

      const schedulesData = await schedulesResponse.json()
      setBusyTimes(schedulesData.data?.busyTimes || [])
      
      console.log('[BUSY_TIMES_FETCHED]', {
        count: (schedulesData.data?.busyTimes || []).length,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('[FETCH_BUSY_TIMES_ERROR]', error)
      toast.error('Failed to load calendar data')
      setBusyTimes([])
    } finally {
      setIsLoadingBusyTimes(false)
    }
  }

  // Fetch busy times when Calendly is connected
  useEffect(() => {
    // Only fetch busy times if we have confirmed connection from the database
    if (hasCalendlyConnection === true && schedulingUrl) {
      fetchBusyTimes();
    } else {
      // Clear busy times if not connected
      setBusyTimes([]);
    }
  }, [hasCalendlyConnection, schedulingUrl]);

  const handleCalendlyAction = async () => {
    try {
      // Use database status for determining connection state
      if (hasCalendlyConnection !== true) {
        // If not connected, initiate connection flow
        handleConnect();
        
        // Note: After connection, the page will reload due to the OAuth redirect,
        // so we don't need to manually refresh the status here
      } else {
        // If already connected, refresh data
        await fetchBusyTimes();
        toast.success('Calendar data refreshed');
      }
    } catch (error) {
      console.error('[CALENDLY_ACTION_ERROR]', error);
      toast.error('Failed to perform Calendly action');
    }
  }

  // Include the new loading state in the overall loading state
  const isPageLoading = isLoadingBusyTimes || isLoadingSessions || isLoadingDbId || isLoadingCalendlyDbStatus;

  const transformedSessions = (sessions || []).map(s => ({
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
    calendlyEventId: s.sessionType === SessionType.PEER_TO_PEER ? s.ulid : undefined
  }))

  // Check for Calendly OAuth callback parameters
  useEffect(() => {
    const url = new URL(window.location.href);
    const calendlyStatus = url.searchParams.get('calendly');
    
    if (calendlyStatus === 'success') {
      // If we just completed a successful OAuth flow, refetch the status
      toast.success('Calendly connected successfully!');
      refetchCalendlyStatus();
      
      // Remove the query parameters to avoid duplicate toasts on refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [refetchCalendlyStatus]);

  return (
    <div className="container mx-auto py-6 px-4">
      <style jsx global>{calendarStyles}</style>
      <CoachingCalendar
        sessions={transformedSessions}
        isLoading={isPageLoading}
        title="My Coaching Calendar"
        busyTimes={busyTimes}
        onRefreshCalendly={handleCalendlyAction}
        isCalendlyConnected={hasCalendlyConnection === true}
        isCalendlyLoading={isLoadingCalendlyDbStatus || isLoadingBusyTimes}
        showCalendlyButton={true}
        userRole="coach"
        coachDbId={coachDbId || undefined}
      />
      
      {hasCalendlyConnection && (
        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBusyTimes}
            disabled={isLoadingBusyTimes}
            className="flex items-center gap-2"
          >
            {isLoadingBusyTimes ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isLoadingBusyTimes ? 'Refreshing...' : 'Refresh Calendar'}
          </Button>
        </div>
      )}
    </div>
  )
} 