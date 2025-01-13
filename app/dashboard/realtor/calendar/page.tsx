'use client'

import { useState } from 'react'
import { Calendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useQuery } from '@tanstack/react-query'
import { fetchUserSessions } from '@/utils/actions/sessions'
import { Loader2 } from "lucide-react"
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from "@/components/ui/scroll-area"

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

export default function RealtorCalendarPage() {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())

  const { data: sessions, isLoading } = useQuery<Session[], Error>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const data = await fetchUserSessions()
      if (!data) return []
      return data
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">My Coaching Calendar</h1>
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

  const events = sessions?.map(session => ({
    title: `${session.userRole === 'coach' ? 'Coaching' : 'Session with'} ${session.otherParty.firstName} ${session.otherParty.lastName}`,
    start: new Date(session.startTime),
    end: new Date(session.endTime),
    resource: session
  })) || []

  const EventComponent = ({ event }: any) => (
    <div className="flex flex-col gap-1 p-1">
      <div>{event.title}</div>
      <Badge className={getStatusColor(event.resource.status)}>
        {event.resource.status}
      </Badge>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Coaching Calendar</h1>
      
      <div className="grid grid-cols-[1fr,300px] gap-4">
        <Card className="p-4">
          <div className="h-[600px]">
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
              components={{
                event: EventComponent
              }}
              popup
              selectable
            />
          </div>
        </Card>

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
