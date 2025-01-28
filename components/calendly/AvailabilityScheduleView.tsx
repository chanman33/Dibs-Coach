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

export function AvailabilityScheduleView({ schedule }: AvailabilityScheduleViewProps) {
  // Convert weekday number to name (0 = Sunday, 1 = Monday, etc.)
  const getWeekdayName = (wday: number) => {
    const date = new Date(2024, 0, 7 + wday) // Jan 7, 2024 is a Sunday
    return format(date, 'EEEE')
  }

  // Format time string (e.g., "09:00" to "9:00 AM")
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return format(date, 'h:mm a')
  }

  const weekdayRules = schedule.rules.filter(rule => rule.type === 'wday')
  const dateRules = schedule.rules.filter(rule => rule.type === 'date')

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
                  {getWeekdayName(rule.wday!)}
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