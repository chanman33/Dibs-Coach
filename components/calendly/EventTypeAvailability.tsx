'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { CalendlyEventType, CalendlyAvailableTime } from '@/lib/calendly-api'
import { format, addDays, isBefore } from 'date-fns'
import { DatePicker } from '@/components/ui/date-picker'
import { PopupButton } from 'react-calendly'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

interface EventTypeAvailabilityProps {
  eventTypeUri: string
  eventType: CalendlyEventType
}

interface DailyAvailability {
  date: string
  availableSlots: CalendlyAvailableTime[]
  totalScheduled: number
  totalAvailable: number
}

export function EventTypeAvailability({ eventTypeUri, eventType }: EventTypeAvailabilityProps) {
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState<string>('')
  const [weeklyAvailability, setWeeklyAvailability] = useState<DailyAvailability[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const fetchAvailability = async (startDate: Date) => {
    try {
      setIsLoading(true)
      setError(undefined)

      const endDate = addDays(startDate, 7)
      const params = new URLSearchParams({
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString()
      })

      const response = await fetch(`/api/calendly/availability?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch availability')
      }

      const data = await response.json()
      
      // Find slots for the specific event type
      const eventTypeData = data.data.find(
        (item: any) => item.eventType.uri === eventTypeUri
      )

      if (!eventTypeData) {
        setWeeklyAvailability([])
        return
      }

      // Process availability data by day
      const dailyAvailability: DailyAvailability[] = []
      let currentDate = startDate
      
      while (isBefore(currentDate, endDate)) {
        const daySlots = eventTypeData.availableTimes.filter((slot: CalendlyAvailableTime) => 
          format(new Date(slot.start_time), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
        )
        
        dailyAvailability.push({
          date: format(currentDate, 'yyyy-MM-dd'),
          availableSlots: daySlots,
          totalScheduled: eventType.duration * daySlots.filter((slot: CalendlyAvailableTime) => slot.invitee_count > 0).length,
          totalAvailable: eventType.duration * daySlots.length
        })
        
        currentDate = addDays(currentDate, 1)
      }

      setWeeklyAvailability(dailyAvailability)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability')
      setWeeklyAvailability([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate)
    if (newDate) {
      // If time is selected, combine date and time
      if (time) {
        const [hours, minutes] = time.split(':')
        newDate.setHours(parseInt(hours), parseInt(minutes))
      }
      fetchAvailability(newDate)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTime(newTime)
    
    if (date && newTime) {
      const [hours, minutes] = newTime.split(':')
      const newDate = new Date(date)
      newDate.setHours(parseInt(hours), parseInt(minutes))
      fetchAvailability(newDate)
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">{eventType.name}</h2>
          <p className="text-gray-600">{eventType.description_plain}</p>
          <Badge className="mt-2">{formatDuration(eventType.duration)} duration</Badge>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <DatePicker
              date={date}
              onSelect={handleDateChange}
              disabled={(date) => date < new Date()}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <Input
              type="time"
              value={time}
              onChange={handleTimeChange}
              step="900" // 15-minute intervals
              className="w-full"
              disabled={!date}
            />
          </div>
        </div>

        {error && (
          <div className="text-red-500 mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : weeklyAvailability.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Available Slots</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeklyAvailability.map((day) => (
                <TableRow key={day.date}>
                  <TableCell>
                    {format(new Date(day.date), 'EEE, MMM d')}
                  </TableCell>
                  <TableCell>
                    {day.availableSlots.length > 0 ? (
                      <div className="space-y-1">
                        {day.availableSlots.map((slot, idx) => (
                          <div key={idx} className="text-sm">
                            {format(new Date(slot.start_time), 'h:mm a')}
                            {slot.invitee_count > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                {slot.invitee_count} booked
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No slots available</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        Scheduled: {formatDuration(day.totalScheduled)}
                      </div>
                      <div className="text-sm">
                        Available: {formatDuration(day.totalAvailable)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {day.availableSlots.length === 0 ? (
                      <Badge variant="secondary">Unavailable</Badge>
                    ) : day.totalScheduled === day.totalAvailable ? (
                      <Badge variant="destructive">Fully Booked</Badge>
                    ) : (
                      <Badge variant="default">Available</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {day.availableSlots.length > 0 && (
                      <PopupButton
                        url={eventType.scheduling_url}
                        rootElement={document.getElementById('root')!}
                        text="Book"
                        className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : date ? (
          <div className="text-center py-8 text-gray-500">
            No available slots found for the selected week
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
} 