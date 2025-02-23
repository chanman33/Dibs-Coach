'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WeekDay, TimeSlot } from '@/utils/types/coaching'
import { toast } from 'sonner'

const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const

const DEFAULT_TIME_SLOT: TimeSlot = {
  from: '09:00',
  to: '17:00',
}

// Helper function to convert 24h to 12h format
function to12Hour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
}

// Helper function to convert 12h to 24h format
function to24Hour(time12h: string): string {
  const [time, period] = time12h.split(' ')
  let [hours, minutes] = time.split(':').map(Number)
  
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

interface AvailabilityManagerProps {
  onSave: (schedule: Record<WeekDay, TimeSlot[]>) => Promise<{ success: boolean } | void>
  initialSchedule?: {
    schedule: Record<WeekDay, TimeSlot[]>
    timezone: string
  }
}

export function AvailabilityManager({ onSave, initialSchedule }: AvailabilityManagerProps) {
  const [schedule, setSchedule] = useState<Record<WeekDay, TimeSlot[]>>(() => {
    // Create a base schedule with empty arrays for all days
    const baseSchedule = DAYS_OF_WEEK.reduce((acc, day) => {
      acc[day] = []
      return acc
    }, {} as Record<WeekDay, TimeSlot[]>)

    // If we have an initial schedule with valid data, merge it with the base schedule
    if (initialSchedule?.schedule) {
      return {
        ...baseSchedule,
        ...Object.entries(initialSchedule.schedule).reduce((acc, [day, slots]) => {
          if (DAYS_OF_WEEK.includes(day as WeekDay)) {
            acc[day as WeekDay] = Array.isArray(slots) ? slots : []
          }
          return acc
        }, {} as Record<WeekDay, TimeSlot[]>)
      }
    }

    return baseSchedule
  })
  const [timezone, setTimezone] = useState(initialSchedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [isLoading, setIsLoading] = useState(false)

  const addTimeSlot = (day: WeekDay) => {
    setSchedule(prev => ({
      ...prev,
      [day]: [...prev[day], { ...DEFAULT_TIME_SLOT }]
    }))
  }

  const removeTimeSlot = (day: WeekDay, index: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }))
  }

  const updateTimeSlot = (day: WeekDay, index: number, field: keyof TimeSlot, value: string) => {
    // Convert 12h format to 24h format for storage
    const time24h = to24Hour(value)
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].map((slot, i) => {
        if (i === index) {
          return { ...slot, [field]: time24h }
        }
        return slot
      })
    }))
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      await onSave(schedule)
      toast.success('Availability schedule saved successfully')
    } catch (error) {
      console.error('[SAVE_SCHEDULE_ERROR]', error)
      toast.error('Failed to save availability schedule')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Weekly Availability Schedule</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Times shown in {timezone}
            </p>
          </div>
          <Button onClick={handleSave} disabled={isLoading}>
            Save Schedule
          </Button>
        </div>

        <div className="space-y-6">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">{day.charAt(0) + day.slice(1).toLowerCase()}</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTimeSlot(day)}
                >
                  Add Time Slot
                </Button>
              </div>

              {schedule[day].length === 0 ? (
                <p className="text-sm text-muted-foreground">No availability set for this day</p>
              ) : (
                <div className="space-y-2">
                  {schedule[day].map((slot, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Select
                        value={to12Hour(slot.from)}
                        onValueChange={(value) => updateTimeSlot(day, index, 'from', value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {generateTimeOptions().map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <span className="text-muted-foreground">to</span>

                      <Select
                        value={to12Hour(slot.to)}
                        onValueChange={(value) => updateTimeSlot(day, index, 'to', value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="End time" />
                        </SelectTrigger>
                        <SelectContent>
                          {generateTimeOptions().map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeSlot(day, index)}
                        className="text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

// Helper function to generate time options in 30-minute intervals with AM/PM format
function generateTimeOptions() {
  const times: string[] = []
  // Start at 5 AM and go through the day
  for (let hour = 5; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const period = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 || 12
      const formattedMinute = minute.toString().padStart(2, '0')
      times.push(`${hour12}:${formattedMinute} ${period}`)
    }
  }
  // Add times from midnight to 2 AM for potential late-night availability
  for (let hour = 0; hour < 2; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const hour12 = hour === 0 ? 12 : hour
      const formattedMinute = minute.toString().padStart(2, '0')
      times.push(`${hour12}:${formattedMinute} AM`)
    }
  }
  return times
} 