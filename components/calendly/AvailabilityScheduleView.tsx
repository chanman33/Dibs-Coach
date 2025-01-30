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
import { Button } from '@/components/ui/button'
import { Trash, Pencil } from 'lucide-react'

export interface AvailabilityScheduleViewProps {
  schedule: CalendlyAvailabilitySchedule
  onDelete?: () => Promise<void>
  onEdit?: () => void
}

interface ScheduleRule {
  type: 'wday' | 'date'
  intervals: Array<{ from: string; to: string }>
  wday?: number
  date?: string
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
]

export function AvailabilityScheduleView({ 
  schedule,
  onDelete,
  onEdit
}: AvailabilityScheduleViewProps) {
  // Get weekday name from number (0-6)
  const getWeekdayName = (wday: number) => {
    return WEEKDAYS[wday] || 'Invalid Day'
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
    .filter(rule => rule.type === 'wday' && typeof rule.wday === 'number')
    .sort((a, b) => (a.wday || 0) - (b.wday || 0))

  const dateRules = (schedule.rules as ScheduleRule[])
    .filter(rule => rule.type === 'date' && rule.date)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{schedule.name}</h3>
          <p className="text-sm text-muted-foreground">
            {schedule.timezone} {schedule.default && '(Default)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
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
                  {getWeekdayName(rule.wday || 0)}
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
                      {rule.date && format(parseISO(rule.date), 'MMM d, yyyy')}
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