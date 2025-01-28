import { useState } from 'react'
import { Calendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Loader2, RefreshCw } from "lucide-react"
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

const localizer = momentLocalizer(moment)

interface User {
  id: number
  firstName: string | null
  lastName: string | null
  email: string | null
}

interface Session {
  id: number
  durationMinutes: number
  status: string
  calendlyEventId: string
  startTime: string
  endTime: string
  createdAt: string
  userRole: 'coach' | 'mentee'
  otherParty: User
}

interface BusyTime {
  type: string
  start_time: string
  end_time: string
  buffered_start_time?: string
  buffered_end_time?: string
  event?: {
    uri: string
  }
}

interface CoachingCalendarProps {
  sessions: Session[] | undefined
  isLoading?: boolean
  title?: string
  busyTimes?: BusyTime[]
  onRefreshCalendly?: () => void
  isCalendlyConnected?: boolean
  isCalendlyLoading?: boolean
  showCalendlyButton?: boolean
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

export function CoachingCalendar({
  sessions,
  busyTimes = [],
  isLoading,
  title = "My Coaching Calendar",
  onRefreshCalendly,
  isCalendlyConnected,
  isCalendlyLoading,
  showCalendlyButton
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

  const sessionEvents = sessions?.map(session => ({
    title: `${session.userRole === 'coach' ? 'Coaching' : 'Session with'} ${session.otherParty.firstName} ${session.otherParty.lastName}`,
    start: new Date(session.startTime),
    end: new Date(session.endTime),
    resource: session
  })) || []

  const busyTimeEvents = busyTimes.map(busyTime => ({
    title: 'Busy',
    start: new Date(busyTime.start_time),
    end: new Date(busyTime.end_time)
  }))

  const allEvents = [...sessionEvents, ...busyTimeEvents]

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