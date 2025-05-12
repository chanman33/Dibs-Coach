import { useState } from 'react'
import { momentLocalizer, View, ToolbarProps } from 'react-big-calendar'
import * as RBC from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '@/styles/calendar.css'
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { VirtualizedList } from '../ui/virtualized-list'
import { MenteeSessions } from './MenteeSessions'

const localizer = momentLocalizer(moment)
// Type assertion to fix the Calendar component type issue
const Calendar = RBC.Calendar as any

interface ExtendedSession {
  ulid: string
  startTime: string
  endTime: string
  durationMinutes: number
  status: string
  userRole: string
  otherParty: {
    ulid: string
    firstName: string | null
    lastName: string | null
    email: string | null
    imageUrl: string | null
  }
}

interface MenteeCalendarProps {
  sessions: ExtendedSession[] | undefined
  isLoading?: boolean
  title?: string
}

interface LastCoachInfo {
  firstName: string | null
  lastName: string | null
  ulid: string
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

// Add NoUpcomingSessionsPrompt component
const NoUpcomingSessionsPrompt = ({ lastCoach }: { lastCoach?: { 
  ulid: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  imageUrl: string | null;
  id?: number;
} }) => {
  if (!lastCoach?.firstName) return null;

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-3 py-6">
      <h3 className="text-base font-semibold text-muted-foreground">No Upcoming Sessions</h3>
      <p className="text-sm text-muted-foreground max-w-[250px]">
        {lastCoach ? (
          <>
            Ready for another coaching session with {lastCoach.firstName}? Book your next session now.
          </>
        ) : (
          'Ready to accelerate your real estate career? Book your first coaching session with one of our expert coaches.'
        )}
      </p>
      <Link href={lastCoach ? `/dashboard/mentee/coaches/${lastCoach.ulid}` : "/dashboard/mentee/browse-coaches"}>
        <Button variant="outline" size="sm" className="mt-2">
          {lastCoach ? 'Book Another Session' : 'Find a Coach'}
        </Button>
      </Link>
    </div>
  )
}

// Add new EventTooltip component
const EventTooltip = ({ event }: { event: any }) => {
  const session = event.resource
  if (!session) return null

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
    </div>
  )
}

// Add new SessionCard component
const SessionCard = ({ session }: { session: ExtendedSession }) => {
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

// CustomToolbar component
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

export function MenteeCalendar({
  sessions,
  isLoading,
  title = "My Coaching Calendar"
}: MenteeCalendarProps) {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())

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
  const events = sessions?.map(session => ({
    id: session.ulid,
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

  // Custom event component with tooltip
  const EventComponent = ({ event }: { event: any }) => (
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

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr,320px] gap-4">
        <Card className="p-2 sm:p-4 overflow-hidden">
          <div className="h-[500px] sm:h-[600px] w-full overflow-hidden">
            <div className="rbc-calendar-container w-full h-full">
              <Calendar
                localizer={localizer}
                events={events}
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
                components={{
                  event: EventComponent,
                  toolbar: CustomToolbar
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

        <MenteeSessions sessions={sessions} isLoading={isLoading} />
      </div>
    </div>
  )
} 