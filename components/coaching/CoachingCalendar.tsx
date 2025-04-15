'use client'

import { useState } from 'react'
import { Calendar, momentLocalizer, View, ToolbarProps } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '@/styles/calendar.css'
import { Loader2, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CoachSessions } from './CoachSessions'

const localizer = momentLocalizer(moment)

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

interface CoachingCalendarProps {
  userRole: string
  title?: string
  isLoading?: boolean
  sessions?: ExtendedSession[]
  busyTimes?: any[]
  coachDbId?: string
  onRefreshCalendly?: () => void
  isCalendlyConnected?: boolean
  isCalendlyLoading?: boolean
  showCalendlyButton?: boolean
  calendarActionText?: string
  calendarConnectionState?: 'loading' | 'connected' | 'not_connected' | 'error'
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

// Add NoSessionsPrompt component
const NoSessionsPrompt = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-3 py-6">
      <h3 className="text-base font-semibold text-muted-foreground">No Upcoming Sessions</h3>
      <p className="text-sm text-muted-foreground max-w-[250px]">
        You don't have any upcoming coaching sessions scheduled.
      </p>
    </div>
  )
}

// Add EventTooltip component
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

export function CoachingCalendar({
  userRole,
  title = "My Coaching Calendar",
  isLoading = false,
  sessions = [],
  busyTimes = [],
  coachDbId,
  onRefreshCalendly,
  isCalendlyConnected = false,
  isCalendlyLoading = false,
  showCalendlyButton = false,
  calendarActionText = 'Refresh Calendar',
  calendarConnectionState = 'connected'
}: CoachingCalendarProps) {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())

  if (isLoading) {
    return (
      <div className="p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
          
          {showCalendlyButton && (
            <Button
              onClick={onRefreshCalendly}
              disabled={true}
              variant={calendarConnectionState === 'not_connected' || calendarConnectionState === 'error' ? 'default' : 'outline'}
              size="sm"
              className="flex items-center gap-2"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,320px] gap-4">
          <Card className="p-2 sm:p-4">
            <div className="h-[500px] sm:h-[600px] flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin mb-4" />
              <p className="text-muted-foreground text-sm">Loading calendar and busy times...</p>
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
  const events = [
    // Convert sessions to events
    ...(sessions || []).map((session: ExtendedSession) => ({
      id: session.ulid,
      title: `Session with ${session.otherParty.firstName || 'Client'} ${session.otherParty.lastName || ''}`,
      start: new Date(session.startTime),
      end: new Date(session.endTime),
      resource: session
    })),
    
    // Convert busyTimes to events if they exist
    ...(busyTimes || []).map((busyTime: any, index: number) => ({
      id: `busy-${index}`,
      title: 'Busy',
      start: new Date(busyTime.start || busyTime.startTime),
      end: new Date(busyTime.end || busyTime.endTime),
      resource: { type: 'busy', source: busyTime.source || 'External Calendar' }
    }))
  ]

  // Custom event styles
  const eventStyleGetter = (event: any) => {
    // Different styling for busy times vs sessions
    if (event.resource?.type === 'busy') {
      return {
        className: '!bg-gray-400 !text-white',
        style: {
          borderRadius: '4px',
          opacity: 0.8
        }
      }
    }
    
    return {
      className: '!bg-blue-500 !text-white hover:!bg-blue-600',
      style: {
        borderRadius: '4px',
      }
    }
  }

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
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>

        <div className="flex items-center gap-2">
          {showCalendlyButton && (
            <Button
              onClick={onRefreshCalendly}
              disabled={isCalendlyLoading}
              variant={calendarConnectionState === 'not_connected' || calendarConnectionState === 'error' ? 'default' : 'outline'}
              size="sm"
              className="flex items-center gap-2"
            >
              {isCalendlyLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {calendarActionText}
            </Button>
          )}
          <Link href="/dashboard/coach/availability">
            <Button variant="outline" size="sm">
              Manage Availability
            </Button>
          </Link>
        </div>
      </div>

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

        <CoachSessions sessions={sessions} isLoading={isLoading} />
      </div>
    </div>
  )
} 