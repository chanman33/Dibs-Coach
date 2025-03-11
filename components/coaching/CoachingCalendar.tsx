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
  title?: string
  isLoading?: boolean
  sessions?: any[]
  busyTimes?: any[]
  coachDbId?: string
}

const ConnectCalendarSection: React.FC<{
  userRole: string
}> = ({ userRole }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar Integration Coming Soon</CardTitle>
        <CardDescription>
          A new booking and calendar system will be implemented soon. Stay tuned for updates!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-muted rounded-md">
          <p className="text-sm text-muted-foreground">
            This feature is currently under development.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

const CalendarStatus: React.FC<{
  isLoading?: boolean
}> = ({ isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <LoadingSpinner size="sm" />
        <span>Loading calendar...</span>
      </div>
    )
  }

  return (
    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
      <CalendarIcon className="h-3 w-3 mr-1" />
      <span className="text-sm font-medium">Calendar Integration Coming Soon</span>
    </Badge>
  )
}

export function CoachingCalendar({
  userRole,
  title = "Calendar",
  isLoading = false,
  sessions = [],
  busyTimes = [],
  coachDbId
}: CoachingCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <CalendarStatus isLoading={isLoading} />
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