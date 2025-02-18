import { useState } from 'react'
import { Calendar, momentLocalizer, View, ToolbarProps } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ExtendedSession } from '@/utils/types/calendly'

const localizer = momentLocalizer(moment)

interface MenteeCalendarProps {
  sessions: ExtendedSession[] | undefined
  isLoading?: boolean
  title?: string
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

export function MenteeCalendar({
  sessions,
  isLoading,
  title = "My Coaching Calendar"
}: MenteeCalendarProps) {
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
  const events = sessions?.map(session => ({
    id: session.id,
    title: `Session with ${session.otherParty.firstName} ${session.otherParty.lastName}`,
    start: new Date(session.startTime),
    end: new Date(session.endTime),
    resource: session
  })) || []

  // Custom event styles
  const eventStyleGetter = (event: any) => ({
    className: '!bg-blue-500 !text-white hover:!bg-blue-600',
    style: {
      borderRadius: '4px',
    }
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-4">
        <Card className="p-2 sm:p-4">
          <div className="h-[600px] overflow-x-auto">
            <Calendar
              localizer={localizer}
              events={events}
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
              className="responsive-calendar"
              components={{
                toolbar: CustomToolbar
              }}
            />
          </div>
        </Card>

        <Card className="p-2 sm:p-4">
          <h2 className="text-lg font-semibold mb-4">All Sessions</h2>
          <ScrollArea className="h-[calc(600px-2rem)]">
            <div className="space-y-4 pr-4">
              {sessions?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[500px] text-center text-muted-foreground">
                  <p>Coaching Sessions will display here once booked</p>
                </div>
              ) : (
                sessions?.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                  .map(session => (
                    <div key={session.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">
                            {session.otherParty.firstName} {session.otherParty.lastName}
                          </p>
                          <p className="text-sm text-gray-500">Your coach</p>
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
                  ))
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  )
}

// CustomToolbar component
interface CustomToolbarProps extends ToolbarProps<any, object> { }

function CustomToolbar({
  onNavigate,
  onView,
  view,
  label
}: CustomToolbarProps) {
  const viewNames = {
    month: 'Month',
    week: 'Week',
    day: 'Day'
  }

  return (
    <div className="rbc-toolbar w-full p-2 sm:p-3 [@media(min-width:1300px)]:p-4">
      <div className="space-y-3">
        <span className="rbc-toolbar-label text-lg font-semibold block text-center">
          {label}
        </span>
        <div className="flex items-center justify-center gap-1 border-b pb-2">
          {Object.entries(viewNames).map(([viewKey, viewLabel]) => (
            <Button
              key={viewKey}
              onClick={() => onView(viewKey as View)}
              variant={view === viewKey ? "default" : "outline"}
              size="sm"
              className="flex-1 text-sm px-2 max-w-[120px]"
            >
              {viewLabel}
            </Button>
          ))}
        </div>
        <div className="flex items-center justify-between px-1">
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
      </div>
    </div>
  )
} 