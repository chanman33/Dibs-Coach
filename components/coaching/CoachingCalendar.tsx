import { useState, useEffect, useCallback } from 'react'
import { Calendar, momentLocalizer, View, ToolbarProps } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '@/styles/calendar.css'
import { Loader2, RefreshCw, ChevronLeft, ChevronRight, XCircle, CheckCircle2 } from "lucide-react"
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  CalendlyAvailabilitySchedule,
  CalendarEvent,
  CalendlyBusyTime,
  ExtendedSession,
  AvailabilityEventResource
} from '@/utils/types/calendly'
import Link from 'next/link'
import { fetchCoachAvailability as fetchCoachAvailabilityForCalendar } from '@/utils/actions/availability'
import { useQuery } from '@tanstack/react-query'
import { WeekDay, TimeSlot } from '@/utils/types/coaching'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { VirtualizedList } from '../ui/virtualized-list'
import { cn } from '@/lib/utils'

const localizer = momentLocalizer(moment)

// Helper functions for time conversion and validation
const convertAvailabilityScheduleToEvents = (
  schedule: CalendlyAvailabilitySchedule,
  startDate: Date,
  endDate: Date,
): CalendarEvent[] => {
  const events: CalendarEvent[] = []
  
  // Convert rules to events
  schedule.rules.forEach((rule) => {
    if (rule.type === 'wday') {
      rule.intervals.forEach((interval) => {
        events.push({
          id: `avail-${schedule.id}-${rule.wday}-${interval.from}`,
          title: 'Available',
          start: new Date(interval.from),
          end: new Date(interval.to),
          type: 'availability',
          resource: {
            type: 'availability',
            timezone: schedule.timezone
          } as AvailabilityEventResource
        })
      })
    }
  })

  return events
}

const convertWeeklyScheduleToEvents = (
  startDate: Date,
  endDate: Date,
  weeklySchedule?: Partial<Record<WeekDay, TimeSlot[]>>,
  timezone?: string
): CalendarEvent[] => {
  if (!weeklySchedule) return []
  const events: CalendarEvent[] = []
  
  const start = moment(startDate).startOf('day')
  const end = moment(endDate).endOf('day')
  let current = start.clone()

  while (current.isSameOrBefore(end)) {
    const dayOfWeek = current.format('dddd').toUpperCase() as WeekDay
    const slots = weeklySchedule[dayOfWeek] || []

    slots.forEach((slot) => {
      const [startHour, startMinute] = slot.from.split(':').map(Number)
      const [endHour, endMinute] = slot.to.split(':').map(Number)

      const eventStart = current.clone()
        .hour(startHour)
        .minute(startMinute)
      const eventEnd = current.clone()
        .hour(endHour)
        .minute(endMinute)

      events.push({
        id: `weekly-${current.format('YYYY-MM-DD')}-${slot.from}-${slot.to}`,
        title: 'Available',
        start: eventStart.toDate(),
        end: eventEnd.toDate(),
        type: 'availability',
        resource: {
          type: 'availability',
          timezone: timezone || 'UTC'
        } as AvailabilityEventResource
      })
    })

    current = current.add(1, 'day')
  }

  return events
}

const doTimesOverlap = (start1: Date, end1: Date, start2: Date, end2: Date): boolean => {
  return moment(start1).isBefore(end2) && moment(end1).isAfter(start2)
}

// Custom components
const EventComponent: React.FC<{ event: CalendarEvent }> = ({ event }) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="w-full h-full cursor-default">
          {event.title}
        </div>
      </TooltipTrigger>
      <TooltipContent sideOffset={5} className="animate-in fade-in-0 zoom-in-95">
        <EventTooltip event={event} />
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

const SessionCard: React.FC<{ session: ExtendedSession; userRole: 'coach' | 'mentee' }> = ({ session, userRole }) => {
  return (
    <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="font-medium">
              {session.otherParty.firstName} {session.otherParty.lastName}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{moment(session.startTime).format('ddd, MMM D')}</span>
              <span>·</span>
              <span>{moment(session.startTime).format('h:mm A')}</span>
              <span>·</span>
              <span>{session.durationMinutes}m</span>
            </div>
          </div>
          <Badge 
            variant="outline"
            className={cn(
              "capitalize font-medium",
              session.status.toLowerCase() === 'scheduled' && "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
              session.status.toLowerCase() === 'completed' && "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
              session.status.toLowerCase() === 'cancelled' && "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
              session.status.toLowerCase() === 'no_show' && "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            )}
          >
            {formatStatusText(session.status)}
          </Badge>
        </div>
        {session.status.toLowerCase() === 'scheduled' && (
          <div className="flex items-center gap-2 text-sm">
            <Button variant="outline" size="sm" className="w-full h-7">
              Join Meeting
            </Button>
            <Button variant="outline" size="sm" className="w-full h-7">
              Reschedule
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

const NoSessionsPrompt: React.FC<{ 
  userRole: 'coach' | 'mentee'; 
  isCalendlyConnected?: boolean;
  onConnect?: () => void;
}> = ({ userRole, isCalendlyConnected, onConnect }) => {
  if (userRole === 'coach') {
    if (!isCalendlyConnected) {
      return (
        <div className="flex flex-col items-center justify-center text-center space-y-3 py-6">
          <h3 className="text-base font-semibold text-muted-foreground">Connect Your Calendly</h3>
          <p className="text-sm text-muted-foreground max-w-[300px]">
            To start accepting coaching sessions, please connect your Calendly account. This will sync your availability and allow mentees to book sessions with you.
          </p>
          <div className="flex flex-col gap-2 w-full max-w-[200px]">
            <Button 
              variant="default" 
              size="sm" 
              className="w-full"
              onClick={onConnect}
            >
              Connect Calendly
            </Button>
            <Link href="/dashboard/coach/availability">
              <Button variant="outline" size="sm" className="w-full">
                Manage Availability
              </Button>
            </Link>
          </div>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-3 py-6">
        <h3 className="text-base font-semibold text-muted-foreground">No Sessions Found</h3>
        <p className="text-sm text-muted-foreground max-w-[250px]">
          Booked sessions will display here. Make sure your coaching availability is up to date.
        </p>
        <Link href="/dashboard/coach/availability">
          <Button variant="outline" size="sm" className="mt-2">
            Manage Availability
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-3 py-6">
      <h3 className="text-base font-semibold text-muted-foreground">No Sessions Found</h3>
      <p className="text-sm text-muted-foreground max-w-[250px]">
        Your booked coaching sessions will appear here once you schedule them.
      </p>
      <Link href="/dashboard/mentee/browse-coaches">
        <Button variant="outline" size="sm" className="mt-2">
          Find a Coach
        </Button>
      </Link>
    </div>
  )
}

const CalendlyStatus: React.FC<{
  isConnected?: boolean;
  isLoading?: boolean;
  onConnect?: () => void;
}> = ({ isConnected, isLoading, onConnect }) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Checking Calendly...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 w-full justify-between bg-background rounded-md border px-3 py-2">
      <div className="flex items-center gap-2">
        {!isConnected ? (
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Calendly Not Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Calendly Connected</span>
          </div>
        )}
      </div>
      {!isConnected && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onConnect}
          className="h-7 hover:bg-destructive/10 hover:text-destructive"
        >
          Connect
        </Button>
      )}
    </div>
  )
}

const AvailabilityStatus: React.FC<{
  hasAvailability?: boolean;
  isLoading?: boolean;
  onManage?: () => void;
}> = ({ hasAvailability, isLoading, onManage }) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Checking availability...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 w-full justify-between bg-background rounded-md border px-3 py-2">
      <div className="flex items-center gap-2">
        {!hasAvailability ? (
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Availability Not Set</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Availability Set</span>
          </div>
        )}
      </div>
      {!hasAvailability && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onManage}
          className="h-7 hover:bg-destructive/10 hover:text-destructive"
        >
          Update
        </Button>
      )}
    </div>
  )
}

const CustomToolbar = ({
  onNavigate,
  onView,
  view,
  label
}: ToolbarProps<any, object>) => {
  const viewNames = {
    month: 'Month',
    week: 'Week',
    day: 'Day'
  }

  // Full wide screen layout (1024px and up)
  const FullWideLayout = (
    <div className="hidden lg:grid lg:grid-cols-3 lg:items-center lg:gap-4">
      {/* Left Section - Navigation */}
      <div className="flex items-center gap-2 justify-start">
        <Button
          onClick={() => onNavigate('TODAY')}
          variant="outline"
          size="sm"
          className="text-sm px-4"
        >
          Today
        </Button>
        <div className="flex items-center gap-1">
          <Button
            onClick={() => onNavigate('PREV')}
            variant="outline"
            size="sm"
            className="px-3"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => onNavigate('NEXT')}
            variant="outline"
            size="sm"
            className="px-3"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Center Section - Title */}
      <span className="rbc-toolbar-label text-lg font-semibold text-center">
        {label}
      </span>

      {/* Right Section - View Selection */}
      <div className="flex items-center gap-1 justify-end">
        {Object.entries(viewNames).map(([viewKey, viewLabel]) => (
          <Button
            key={viewKey}
            onClick={() => onView(viewKey as View)}
            variant={view === viewKey ? "default" : "outline"}
            size="sm"
            className="min-w-[70px] text-sm px-4"
          >
            {viewLabel}
          </Button>
        ))}
      </div>
    </div>
  )

  // Compact layout for screens below 1024px
  const CompactLayout = (
    <div className="lg:hidden space-y-3">
      <span className="rbc-toolbar-label text-lg font-semibold block text-center">
        {label}
      </span>
      
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onNavigate('TODAY')}
            variant="outline"
            size="sm"
            className="text-sm px-3"
          >
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => onNavigate('PREV')}
              variant="outline"
              size="sm"
              className="px-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onNavigate('NEXT')}
              variant="outline"
              size="sm"
              className="px-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {Object.entries(viewNames).map(([viewKey, viewLabel]) => (
            <Button
              key={viewKey}
              onClick={() => onView(viewKey as View)}
              variant={view === viewKey ? "default" : "outline"}
              size="sm"
              className="text-sm px-3"
            >
              {viewLabel}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="rbc-toolbar w-full p-2 sm:p-3 lg:p-4">
      {FullWideLayout}
      {CompactLayout}
    </div>
  )
}

// Helper to get badge color based on session status
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'bg-blue-500'
    case 'completed':
      return 'bg-green-500'
    case 'cancelled':
      return 'bg-red-500'
    case 'no_show':
      return 'bg-yellow-500'
    default:
      return 'bg-gray-500'
  }
}

// Helper to format status text
const formatStatusText = (status: string) => {
  switch (status.toLowerCase()) {
    case 'no_show':
      return 'No Show'
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }
}

// Update the EventTooltip component
const EventTooltip = ({ event }: { event: CalendarEvent }) => {
  if (event.type === 'session') {
    const session = event.resource as ExtendedSession
    return (
      <div className="p-2 max-w-xs">
        <p className="font-medium">{event.title}</p>
        <p className="text-sm text-muted-foreground">
          {moment(event.start).format('MMM D, YYYY')}
        </p>
        <p className="text-sm text-muted-foreground">
          {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Duration: {session.durationMinutes} minutes
        </p>
        <Badge className={`mt-2 ${getStatusColor(session.status)}`}>
          {formatStatusText(session.status)}
        </Badge>
      </div>
    )
  }

  if (event.type === 'availability') {
    const resource = event.resource as AvailabilityEventResource
    return (
      <div className="p-2 max-w-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <p className="font-medium text-emerald-700">Available for Coaching</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {moment(event.start).format('MMM D, YYYY')}
        </p>
        <p className="text-sm text-muted-foreground">
          {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Timezone: {resource.timezone}
        </p>
      </div>
    )
  }

  if (event.type === 'busy') {
    return (
      <div className="p-2 max-w-xs">
        <p className="font-medium text-blue-700">Busy</p>
        <p className="text-sm text-muted-foreground">
          {moment(event.start).format('MMM D, YYYY')}
        </p>
        <p className="text-sm text-muted-foreground">
          {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
        </p>
      </div>
    )
  }

  return null
}

// Update the eventStyleGetter function
const eventStyleGetter = (event: CalendarEvent) => {
  switch (event.type) {
    case 'session':
      return {
        className: '!bg-blue-500 !text-white hover:!bg-blue-600',
        style: {
          borderRadius: '4px',
        }
      }
    case 'busy':
      return {
        className: '!bg-blue-500 !text-white hover:!bg-blue-600',
        style: {
          borderRadius: '4px',
          opacity: 0.7
        }
      }
    case 'availability':
      return {
        className: '!bg-emerald-50 !text-emerald-800 !border !border-emerald-200 hover:!bg-emerald-100 transition-colors',
        style: {
          borderRadius: '4px',
          padding: '2px 4px',
          fontSize: '0.875rem',
          cursor: 'default',
          boxShadow: 'inset 0 1px 0 0 rgb(167 243 208 / 0.1)'
        }
      }
    default:
      return {}
  }
}

interface CoachingCalendarProps {
  sessions: ExtendedSession[] | undefined
  isLoading?: boolean
  title?: string
  busyTimes?: CalendlyBusyTime[]
  availabilitySchedules?: CalendlyAvailabilitySchedule[]
  onRefreshCalendly?: () => void
  isCalendlyConnected?: boolean
  isCalendlyLoading?: boolean
  showCalendlyButton?: boolean
  userRole: 'coach' | 'mentee'
  coachDbId?: string
}

export function CoachingCalendar({
  sessions,
  busyTimes = [],
  availabilitySchedules = [],
  isLoading,
  title = "My Coaching Calendar",
  onRefreshCalendly,
  isCalendlyConnected,
  isCalendlyLoading,
  showCalendlyButton,
  userRole,
  coachDbId
}: CoachingCalendarProps) {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  // Fetch coach's availability if coachDbId is provided
  const { data: availabilityData } = useQuery({
    queryKey: ['coach-availability', coachDbId],
    queryFn: async () => {
      if (!coachDbId) return null
      return fetchCoachAvailabilityForCalendar({ coachDbId })
    },
    enabled: !!coachDbId
  })

  // Function to scroll to 7:00 AM
  const scrollToMorning = useCallback(() => {
    if (view === 'week' || view === 'day') {
      setTimeout(() => {
        const timeContent = document.querySelector('.rbc-time-content');
        if (timeContent) {
          // Calculate scroll position for 7:00 AM (7 hours from midnight)
          const scrollPosition = 14 * 50; // Approximate height per hour
          timeContent.scrollTop = scrollPosition;
        }
      }, 100);
    }
  }, [view]);

  // Set initial scroll position when view changes or component mounts
  useEffect(() => {
    scrollToMorning();
  }, [view, scrollToMorning]);

  // Handle view changes
  const handleViewChange = (newView: View) => {
    setView(newView);
    // The useEffect will handle scrolling when view changes
  };

  if (isLoading) {
    return (
      <div className="p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,320px] gap-4">
          <Card className="p-2 sm:p-4">
            <div className="h-[500px] sm:h-[600px] flex items-center justify-center">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
            </div>
          </Card>
          <Card className="p-2 sm:p-4">
            <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">All Sessions</h2>
            <div className="h-[calc(500px-3rem)] sm:h-[calc(600px-4rem)] flex items-center justify-center">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Convert sessions to calendar events
  const sessionEvents: CalendarEvent[] = sessions?.map(session => ({
    id: `session-${session.id}`,
    title: `${session.userRole === 'coach' ? 'Coaching' : 'Session with'} ${session.otherParty.firstName} ${session.otherParty.lastName}`,
    start: new Date(session.startTime),
    end: new Date(session.endTime),
    type: 'session',
    resource: session
  })) || []

  // Convert busy times to calendar events
  const busyTimeEvents: CalendarEvent[] = busyTimes.map((busyTime, index) => ({
    id: `busy-${busyTime.uri || `${busyTime.start_time}-${busyTime.end_time}-${index}`}`,
    title: 'Busy',
    start: new Date(busyTime.start_time),
    end: new Date(busyTime.end_time),
    type: 'busy',
    resource: busyTime
  }))

  // Get availability events for the current view's date range
  const monthStart = moment(date).startOf('month').toDate()
  const monthEnd = moment(date).endOf('month').toDate()
  
  const availabilityEvents = availabilitySchedules.length > 0
    ? convertAvailabilityScheduleToEvents(
        availabilitySchedules[0],
        monthStart,
        monthEnd
      )
    : convertWeeklyScheduleToEvents(
        monthStart,
        monthEnd,
        availabilityData?.data?.schedule,
        availabilityData?.data?.timezone
      )

  // Filter out availability slots that overlap with busy times or sessions
  const filteredAvailabilityEvents = availabilityEvents.filter(availEvent => {
    return ![...busyTimeEvents, ...sessionEvents].some(event =>
      doTimesOverlap(availEvent.start, availEvent.end, event.start, event.end)
    )
  })

  // Combine all events
  const allEvents = [...sessionEvents, ...busyTimeEvents, ...filteredAvailabilityEvents]

  // Sort and paginate sessions
  const sortedSessions = sessions?.sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  ) || []
  
  const totalPages = Math.ceil((sortedSessions.length || 0) / itemsPerPage)
  const paginatedSessions = sortedSessions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">
              Manage your coaching sessions and availability
            </p>
          </div>
          {showCalendlyButton && userRole === 'coach' && (
            <div className="flex flex-col gap-2 min-w-[280px]">
              <CalendlyStatus
                isConnected={isCalendlyConnected}
                isLoading={isCalendlyLoading}
                onConnect={onRefreshCalendly}
              />
              <AvailabilityStatus
                hasAvailability={availabilitySchedules.length > 0}
                isLoading={isLoading}
                onManage={() => window.location.href = '/dashboard/coach/availability'}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr,340px] gap-6">
        <Card className="shadow-sm">
          <div className="calendar-wrapper" style={{ height: '600px', overflow: 'hidden' }}>
            <Calendar
              localizer={localizer}
              events={allEvents}
              startAccessor="start"
              endAccessor="end"
              view={view}
              date={date}
              onView={handleViewChange}
              onNavigate={setDate}
              views={['month', 'week', 'day']}
              step={30}
              timeslots={1}
              min={new Date(2020, 1, 1, 0, 0, 0)} // Start at midnight
              max={new Date(2020, 1, 1, 23, 59, 59)} // End at midnight
              eventPropGetter={eventStyleGetter}
              tooltipAccessor={null}
              components={{
                toolbar: CustomToolbar,
                event: EventComponent
              }}
              style={{ 
                height: '100%',
                width: '100%'
              }}
            />
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <h2 className="text-lg font-semibold tracking-tight mb-4">All Sessions</h2>
            {paginatedSessions.length > 0 ? (
              <div className="space-y-4">
                {paginatedSessions.map((session) => (
                  <div key={session.id} className="pb-2">
                    <SessionCard session={session} userRole={userRole} />
                  </div>
                ))}
                
                {totalPages > 1 && (
                  <div className="flex justify-between items-center gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <NoSessionsPrompt 
                userRole={userRole} 
                isCalendlyConnected={isCalendlyConnected} 
                onConnect={onRefreshCalendly}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  )
} 