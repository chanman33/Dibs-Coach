import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/utils/cn'

interface CoachingCalendarProps {
  userRole: string
  onConnect?: () => void
  showCalendarButton?: boolean
}

const ConnectCalendarSection: React.FC<{
  userRole: string
  onConnect?: () => void
}> = ({ userRole, onConnect }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Your Calendar</CardTitle>
        <CardDescription>
          To start accepting coaching sessions, please connect your calendar. This will sync your availability and allow mentees to book sessions with you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onConnect} className="w-full">
          Connect Calendar
        </Button>
      </CardContent>
    </Card>
  )
}

const CalendarStatus: React.FC<{
  isConnected?: boolean
  isLoading?: boolean
  onConnect?: () => void
}> = ({ isConnected, isLoading, onConnect }) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <LoadingSpinner size="sm" />
        <span>Checking calendar...</span>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          <CalendarIcon className="h-3 w-3 mr-1" />
          <span className="text-sm font-medium">Calendar Not Connected</span>
        </Badge>
        <Button variant="ghost" size="sm" onClick={onConnect}>Connect</Button>
      </div>
    )
  }

  return (
    <Badge variant="outline" className="bg-green-100 text-green-800">
      <CalendarIcon className="h-3 w-3 mr-1" />
      <span className="text-sm font-medium">Calendar Connected</span>
    </Badge>
  )
}

export function CoachingCalendar({
  userRole,
  onConnect,
  showCalendarButton = true
}: CoachingCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Calendar</h2>
        {showCalendarButton && userRole === 'coach' && (
          <CalendarStatus
            onConnect={onConnect}
          />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Time Slots</CardTitle>
            <CardDescription>
              {date ? format(date, 'MMMM d, yyyy') : 'Select a date to view available times'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Time slots will be populated by Cal.com */}
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <p>Calendar integration coming soon...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 