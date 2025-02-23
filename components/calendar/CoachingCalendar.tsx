import { useState } from 'react'
import { Calendar, momentLocalizer, View, ToolbarProps } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
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

const localizer = momentLocalizer(moment)

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
  coachDbId?: number
}

interface AvailabilitySlot {
  from: string
  to: string
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

// Helper to convert availability schedule to events
const convertAvailabilityScheduleToEvents = (
  schedule: CalendlyAvailabilitySchedule,
  startDate: Date,
  endDate: Date,
): CalendarEvent[] => {
  const events: CalendarEvent[] = []
  const start = moment(startDate).startOf('week')
  const end = moment(endDate).endOf('week')
  const SLOT_DURATION = 30 // minutes

  // For each day in the range
  for (let day = moment(start); day.isSameOrBefore(end); day.add(1, 'day')) {
    // Find matching rule for this weekday
    const rule = schedule.rules.find(r => r.wday === day.day())
    if (!rule) continue

    // For each interval in the rule
    rule.intervals.forEach(interval => {
      const [fromHour, fromMinute] = interval.from.split(':').map(Number)
      const [toHour, toMinute] = interval.to.split(':').map(Number)

      const intervalStart = moment(day).hour(fromHour).minute(fromMinute).second(0)
      const intervalEnd = moment(day).hour(toHour).minute(toMinute).second(0)

      // Split interval into 30-minute slots
      for (let slotStart = moment(intervalStart);
        slotStart.isBefore(intervalEnd);
        slotStart.add(SLOT_DURATION, 'minutes')) {

        const slotEnd = moment(slotStart).add(SLOT_DURATION, 'minutes')
        if (slotEnd.isAfter(intervalEnd)) continue

        events.push({
          id: `availability-${schedule.uri || 'default'}-${slotStart.toISOString()}`,
          title: 'Available for Coaching',
          start: slotStart.toDate(),
          end: slotEnd.toDate(),
          type: 'availability',
          resource: schedule
        })
      }
    })
  }

  return events
}

// Helper to convert weekly schedule to calendar events
const convertWeeklyScheduleToEvents = (
  startDate: Date,
  endDate: Date,
  weeklySchedule?: Partial<Record<WeekDay, TimeSlot[]>>,
  timezone?: string
): CalendarEvent[] => {
  if (!weeklySchedule) return []

  const events: CalendarEvent[] = []
  const start = moment(startDate).startOf('week')
  const end = moment(endDate).endOf('week')

  // For each day in the range
  for (let day = moment(start); day.isSameOrBefore(end); day.add(1, 'day')) {
    const weekday = day.format('dddd').toUpperCase() as WeekDay
    const daySchedule = weeklySchedule[weekday] || []

    // For each time slot in the day's schedule
    daySchedule.forEach((slot: TimeSlot) => {
      const [fromHour, fromMinute] = slot.from.split(':').map(Number)
      const [toHour, toMinute] = slot.to.split(':').map(Number)

      const slotStart = moment(day).hour(fromHour).minute(fromMinute).second(0)
      const slotEnd = moment(day).hour(toHour).minute(toMinute).second(0)

      events.push({
        id: `availability-${weekday}-${slot.from}-${slot.to}-${slotStart.toISOString()}`,
        title: 'Available for Coaching',
        start: slotStart.toDate(),
        end: slotEnd.toDate(),
        type: 'availability',
        resource: { type: 'availability' as const, timezone: timezone || 'UTC' }
      })
    })
  }

  return events
}

// Helper to check if two time ranges overlap
const doTimesOverlap = (start1: Date, end1: Date, start2: Date, end2: Date) => {
  return moment(start1).isBefore(end2) && moment(end1).isAfter(start2)
}

// Add new EventTooltip component
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
    return (
      <div className="p-2 max-w-xs">
        <p className="font-medium text-emerald-700">{event.title}</p>
        <p className="text-sm text-muted-foreground">
          {moment(event.start).format('MMM D, YYYY')}
        </p>
        <p className="text-sm text-muted-foreground">
          {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
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

// Add new SessionCard component
const SessionCard = ({ session, userRole }: { session: ExtendedSession; userRole: 'coach' | 'mentee' }) => {
  return (
    <div className="p-2 border rounded-lg">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <p className="font-medium">
            {session.otherParty.firstName} {session.otherParty.lastName}
          </p>
          <Badge className={getStatusColor(session.status)}>
            {formatStatusText(session.status)}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{moment(session.startTime).format('MMM D, h:mm A')}</span>
          <span>·</span>
          <span>{session.durationMinutes}m</span>
        </div>
      </div>
    </div>
  )
}

// Add this component after the existing SessionCard component
const NoSessionsPrompt = ({ userRole }: { userRole: 'coach' | 'mentee' }) => {
  if (userRole === 'coach') {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-3 py-6">
        <h3 className="text-base font-semibold text-muted-foreground">No Sessions Found</h3>
        <p className="text-sm text-muted-foreground max-w-[250px]">
          Booked sessions will display here. Make sure your Calendly is connected and coaching availability is up to date.
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
      return fetchCoachAvailabilityForCalendar(coachDbId)
    },
    enabled: !!coachDbId // Only run query if coachDbId is provided
  })

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

  // Custom event styles
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
          className: '!bg-emerald-100 !text-emerald-800 !border !border-emerald-200 hover:!bg-emerald-200',
          style: {
            borderRadius: '4px',
          }
        }
      default:
        return {}
    }
  }

  // Custom event component with tooltip
  const EventComponent = ({ event }: { event: CalendarEvent }) => (
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
    <div className="p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr,320px] gap-4">
        <div className="space-y-4 min-w-0">
          <Card className="p-2 sm:p-4 overflow-hidden">
            <div className="h-[500px] sm:h-[600px] w-full overflow-hidden">
              <div className="rbc-calendar-container w-full h-full">
                <Calendar
                  localizer={localizer}
                  events={allEvents}
                  startAccessor="start"
                  endAccessor="end"
                  view={view}
                  date={date}
                  onView={setView}
                  onNavigate={setDate}
                  views={['month', 'week', 'day']}
                  step={30}
                  timeslots={1}
                  min={new Date(2020, 1, 1, 6, 30, 0)}
                  max={new Date(2020, 1, 1, 20, 0, 0)}
                  eventPropGetter={eventStyleGetter}
                  tooltipAccessor={null}
                  selectable={userRole === 'mentee'}
                  onSelectSlot={(slotInfo) => {
                    if (userRole === 'mentee') {
                      console.log('Selected slot:', slotInfo)
                    }
                  }}
                  components={{
                    toolbar: CustomToolbar,
                    event: EventComponent
                  }}
                  className="max-w-full overflow-hidden"
                  style={{
                    height: '100%',
                    width: '100%',
                    minWidth: 0
                  }}
                />
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-2 sm:p-4">
          <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">All Sessions</h2>
          <div className="h-[calc(500px-3rem)] sm:h-[calc(600px-4rem)] overflow-hidden">
            <ScrollArea>
              {paginatedSessions.length > 0 ? (
                <>
                  <VirtualizedList
                    items={paginatedSessions}
                    height={500}
                    itemHeight={80}
                    renderItem={(session) => (
                      <div key={session.id}>
                        <SessionCard session={session} userRole={userRole} />
                      </div>
                    )}
                  />
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4 pb-4">
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
                </>
              ) : (
                <NoSessionsPrompt userRole={userRole} />
              )}
            </ScrollArea>
          </div>
        </Card>
      </div>

      {(showCalendlyButton || userRole === 'coach') && (
        <div className="mt-4 flex flex-wrap gap-2">
          {showCalendlyButton && (
            <Button
              onClick={(e) => {
                e.preventDefault()
                onRefreshCalendly?.()
              }}
              disabled={isLoading || isCalendlyLoading}
              variant="outline"
              className="gap-2"
            >
              {isLoading || isCalendlyLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {!isCalendlyConnected ? 'Connect Calendly' : 'Refresh Schedule'}
            </Button>
          )}
          
          {userRole === 'coach' && (
            <Link href="/dashboard/coach/availability">
              <Button variant="outline" className="gap-2">
                Manage Availability
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// Update the CustomToolbar interface
interface CustomToolbarProps extends ToolbarProps<CalendarEvent, object> { }

function CustomToolbar({
  onNavigate,
  onView,
  view,
  views,
  label
}: CustomToolbarProps) {
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