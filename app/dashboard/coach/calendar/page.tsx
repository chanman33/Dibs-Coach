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

export default function CoachCalendarPage() {
  const { user } = useUser()
  const [coachDbId, setCoachDbId] = useState<string | null>(null)
  const [busyTimes, setBusyTimes] = useState<any[]>([])

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
      const response = await fetchCoachSessions({})
      return response.data || []
    },
  })

  // Include the new loading state in the overall loading state
  const isPageLoading = isLoadingSessions || isLoadingDbId;

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
    }
  }))

  return (
    <div className="container mx-auto py-6 px-4 h-full min-h-screen">
      <style jsx global>{calendarStyles}</style>
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