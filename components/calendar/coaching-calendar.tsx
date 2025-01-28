import { useState } from 'react'
import { Calendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Loader2, RefreshCw } from "lucide-react"
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { CalendlyAvailabilitySchedule, CalendarEvent, CalendarEventType, CalendlyBusyTime, ExtendedSession } from '@/utils/types/calendly'
import { cn } from '@/utils/cn'

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

// Helper to convert availability schedule to events
const getAvailabilityEvents = (schedule: CalendlyAvailabilitySchedule, startDate: Date, endDate: Date): CalendarEvent[] => {
  const events: CalendarEvent[] = []
  const start = moment(startDate).startOf('week')
  const end = moment(endDate).endOf('week')

  // For each day in the range
  for (let day = moment(start); day.isSameOrBefore(end); day.add(1, 'day')) {
    // Find matching rule for this weekday
    const rule = schedule.rules.find(r => r.wday === day.day())
    if (!rule) continue

    // For each interval in the rule
    rule.intervals.forEach(interval => {
      const [fromHour, fromMinute] = interval.from.split(':').map(Number)
      const [toHour, toMinute] = interval.to.split(':').map(Number)

      const eventStart = moment(day)
        .hour(fromHour)
        .minute(fromMinute)
        .second(0)
      const eventEnd = moment(day)
        .hour(toHour)
        .minute(toMinute)
        .second(0)

      events.push({
        id: `availability-${schedule.uri}-${eventStart.toISOString()}`,
        title: 'Available',
        start: eventStart.toDate(),
        end: eventEnd.toDate(),
        type: 'availability',
        resource: schedule
      })
    })
  }

  return events
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
  userRole
}: CoachingCalendarProps) {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="grid grid-cols-[1fr,300px] gap-4">
          <Card className="p-4">
            <div className="h-[600px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </Card>
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">All Sessions</h2>
            <div className="h-[600px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
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
  const availabilityEvents = availabilitySchedules.flatMap(schedule => 
    getAvailabilityEvents(
      schedule,
      moment(date).startOf('month').toDate(),
      moment(date).endOf('month').toDate()
    )
  )

  // For mentees, filter out availability slots that overlap with busy times or sessions
  const filteredAvailabilityEvents = userRole === 'mentee' 
    ? availabilityEvents.filter(availEvent => {
        const isOverlapping = [...busyTimeEvents, ...sessionEvents].some(event => {
          return moment(availEvent.start).isBetween(event.start, event.end, undefined, '[)') ||
                 moment(availEvent.end).isBetween(event.start, event.end, undefined, '(]') ||
                 moment(event.start).isBetween(availEvent.start, availEvent.end, undefined, '[)') ||
                 moment(event.end).isBetween(availEvent.start, availEvent.end, undefined, '(]')
        })
        return !isOverlapping
      })
    : availabilityEvents

  // Combine all events based on user role
  const allEvents = userRole === 'coach'
    ? [...sessionEvents, ...busyTimeEvents, ...availabilityEvents]
    : [...sessionEvents, ...filteredAvailabilityEvents]

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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      
      <div className="grid grid-cols-[1fr,300px] gap-4">
        <div>
          <Card className="p-4">
            <div className="h-[600px]">
              <Calendar
                localizer={localizer}
                events={allEvents}
                startAccessor="start"
                endAccessor="end"
                view={view}
                date={date}
                onView={(newView) => setView(newView)}
                onNavigate={(newDate) => setDate(newDate)}
                views={['month', 'week', 'day']}
                step={30}
                timeslots={1}
                min={new Date(2020, 1, 1, 6, 30, 0)}
                max={new Date(2020, 1, 1, 20, 0, 0)}
                eventPropGetter={eventStyleGetter}
                selectable={userRole === 'mentee'}
                onSelectSlot={(slotInfo) => {
                  // Handle slot selection for booking (mentee only)
                  if (userRole === 'mentee') {
                    // TODO: Implement booking flow
                    console.log('Selected slot:', slotInfo)
                  }
                }}
              />
            </div>
          </Card>
          {showCalendlyButton && (
            <div className="mt-4">
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
            </div>
          )}
        </div>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">All Sessions</h2>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {sessions?.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                .map(session => (
                  <div key={session.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          {session.otherParty.firstName} {session.otherParty.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {session.userRole === 'coach' ? 'You are coaching' : 'Your coach'}
                        </p>
                      </div>
                      <Badge className={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {moment(session.startTime).format('MMM D, YYYY h:mm A')} - {moment(session.endTime).format('h:mm A')}
                    </p>
                    <p className="text-sm text-gray-500">
                      Duration: {session.durationMinutes} minutes
                    </p>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  )
} 