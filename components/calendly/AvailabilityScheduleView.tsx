import * as React from 'react'
import { CalendlyAvailabilitySchedule } from '@/utils/types/calendly'
import { format, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface AvailabilityScheduleViewProps {
  schedule: CalendlyAvailabilitySchedule
}

type WeekDay = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'

interface ScheduleRule {
  type: 'wday' | 'date'
  intervals: Array<{ from: string; to: string }>
  wday?: WeekDay
  date?: string
}

export function AvailabilityScheduleView({ schedule }: AvailabilityScheduleViewProps) {
  // Convert weekday string to name with proper capitalization
  const getWeekdayName = (wday: WeekDay) => {
    return wday.charAt(0).toUpperCase() + wday.slice(1).toLowerCase()
  }

  // Format time string (e.g., "09:00" to "9:00 AM")
  const formatTime = (time: string) => {
    try {
      // Handle "HH:mm" format (e.g., "09:00")
      if (time.length === 5) {
        const [hours, minutes] = time.split(':').map(Number)
        const date = new Date()
        date.setHours(hours, minutes, 0, 0)
        return format(date, 'h:mm a')
      }
      
      // Handle ISO format (e.g., "2020-01-02T20:00:00.000000Z")
      return format(parseISO(time), 'h:mm a')
    } catch (error) {
      console.error('Error formatting time:', error, time)
      return 'Invalid Time'
    }
  }

  const weekdayRules = (schedule.rules as ScheduleRule[])
    .filter(rule => rule.type === 'wday' && rule.wday)
    // Sort weekdays in correct order (Sunday to Saturday)
    .sort((a, b) => {
      const days: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      return days.indexOf(a.wday!) - days.indexOf(b.wday!)
    })
  const dateRules = (schedule.rules as ScheduleRule[]).filter(rule => rule.type === 'date')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{schedule.name}</h3>
          <p className="text-sm text-muted-foreground">Timezone: {schedule.timezone}</p>
        </div>
        <div className="flex gap-2">
          {schedule.default && <Badge>Default Schedule</Badge>}
          <Badge variant={schedule.active ? "default" : "secondary"}>
            {schedule.active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead>Available Hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weekdayRules.map((rule) => (
              <TableRow key={rule.wday}>
                <TableCell className="font-medium">
                  {getWeekdayName(rule.wday as WeekDay)}
                </TableCell>
                <TableCell>
                  {rule.intervals.length > 0 ? (
                    <div className="space-y-1">
                      {rule.intervals.map((interval, idx) => (
                        <div key={idx} className="text-sm">
                          {formatTime(interval.from)} - {formatTime(interval.to)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unavailable</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {dateRules.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Special Dates</h4>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Available Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dateRules.map((rule) => (
                  <TableRow key={rule.date}>
                    <TableCell className="font-medium">
                      {format(parseISO(rule.date!), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {rule.intervals.length > 0 ? (
                        <div className="space-y-1">
                          {rule.intervals.map((interval, idx) => (
                            <div key={idx} className="text-sm">
                              {formatTime(interval.from)} - {formatTime(interval.to)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unavailable</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
} 