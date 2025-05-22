'use client'

import { useState, useEffect } from 'react'
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
import { 
  WeekDay, 
  TimeSlot, 
  WeeklySchedule,
  DAYS_OF_WEEK,
  SaveAvailabilityParams,
  WeeklySchedule as WeeklyScheduleType
} from '@/utils/types/availability'
import { ApiResponse } from '@/utils/types/api'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Loader2, Info, AlertCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const DEFAULT_TIME_SLOT: TimeSlot = {
  from: '09:00',
  to: '17:00',
}

// Create a base schedule with empty arrays for all days
const createBaseSchedule = (): WeeklyScheduleType => 
  DAYS_OF_WEEK.reduce((acc, day) => ({
    ...acc,
    [day]: []
  }), {} as WeeklyScheduleType)

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

// Create a display order array that moves Sunday to the end
const DISPLAY_ORDER: WeekDay[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
]

interface AvailabilityManagerProps {
  onSave: (params: SaveAvailabilityParams) => Promise<ApiResponse<{ success: true }>>
  initialSchedule?: WeeklyScheduleType
  timezone?: string | null
  disabled?: boolean
}

export function AvailabilityManager({ 
  onSave, 
  initialSchedule, 
  timezone: propTimezone,
  disabled = false
}: AvailabilityManagerProps) {
  const [schedule, setSchedule] = useState<WeeklyScheduleType>(() => {
    const baseSchedule = createBaseSchedule()

    // If we have an initial schedule with valid data, merge it with the base schedule
    if (initialSchedule) {
      const mergedSchedule = { ...baseSchedule }
      
      Object.entries(initialSchedule).forEach(([day, slots]) => {
        if (DAYS_OF_WEEK.includes(day as WeekDay) && Array.isArray(slots)) {
          mergedSchedule[day as WeekDay] = slots
        }
      })

      return mergedSchedule
    }

    return baseSchedule
  })
  const [timezone, setTimezone] = useState(propTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [isLoading, setIsLoading] = useState(false)

  // Update timezone state if the prop changes
  useEffect(() => {
    // Always use Cal.com timezone (passed via propTimezone) as the source of truth
    // Only fall back to browser-detected timezone if no Cal.com timezone is available
    setTimezone(propTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [propTimezone])

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

  const validateTimeSlot = (from: string, to: string): boolean => {
    const [fromHours, fromMinutes] = from.split(':').map(Number)
    const [toHours, toMinutes] = to.split(':').map(Number)
    
    const fromTime = fromHours * 60 + fromMinutes
    const toTime = toHours * 60 + toMinutes
    
    return toTime > fromTime
  }

  const updateTimeSlot = (day: WeekDay, index: number, field: keyof TimeSlot, value: string) => {
    // Convert 12h format to 24h format for storage
    const time24h = to24Hour(value)
    setSchedule(prev => {
      const newSchedule = { ...prev }
      const slots = newSchedule[day]
      const slot = slots[index]
      if (!slot) return prev

      const updatedSlot = { ...slot }
      updatedSlot[field] = time24h

      // Validate the time slot
      if (field === 'from' && !validateTimeSlot(time24h, updatedSlot.to)) {
        // If start time is after end time, adjust end time
        const [hours, minutes] = time24h.split(':').map(Number)
        updatedSlot.to = `${String(hours + 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
        toast.info('End time adjusted to maintain valid time range')
      } else if (field === 'to' && !validateTimeSlot(updatedSlot.from, time24h)) {
        // If end time is before start time, show warning
        toast.error('End time must be after start time')
        return prev
      }

      slots[index] = updatedSlot
      return newSchedule
    })
  }

  const handleSave = async () => {
    if (disabled) {
      toast.error("Please set your timezone before saving availability.")
      return
    }
    try {
      // Validate all time slots before saving
      const invalidSlots = Object.entries(schedule).flatMap(([day, slots]) =>
        slots.map((slot, index) => ({
          day,
          index,
          valid: validateTimeSlot(slot.from, slot.to)
        }))
      ).filter(slot => !slot.valid)

      if (invalidSlots.length > 0) {
        toast.error('Some time slots have invalid time ranges')
        return
      }

      setIsLoading(true)
      
      // Log the schedule being sent
      console.log('[SAVE_SCHEDULE_REQUEST]', { schedule, timezone })
      
      const result = await onSave({ schedule, timezone: timezone || undefined })
      
      if (!result) {
        throw new Error('No response from server')
      }
      
      if (result.error) {
        // Handle specific error types
        switch (result.error.code) {
          case 'VALIDATION_ERROR':
            toast.error('Invalid schedule format. Please check your time slots.')
            break
          case 'FORBIDDEN':
            toast.error('You do not have permission to update the schedule.')
            break
          case 'DATABASE_ERROR':
            toast.error('Failed to save schedule to database. Please try again.')
            break
          default:
            throw new Error(result.error.message || 'Failed to save schedule')
        }
        return
      }
      
      if (!result.data?.success) {
        throw new Error('Failed to save schedule')
      }
      
      toast.success('Availability schedule saved successfully')
    } catch (error) {
      console.error('[SAVE_SCHEDULE_ERROR]', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save availability schedule')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <TooltipProvider>
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Weekly Availability Schedule</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {timezone 
                  ? `Set your weekly coaching availability. Times shown in ${timezone}.` 
                  : "Set your weekly coaching availability."}
              </p>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || disabled}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Schedule'
              )}
            </Button>
          </div>

          {disabled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Timezone Required</AlertTitle>
              <AlertDescription>
                A timezone must be set in your profile or detected from your calendar integration before you can manage availability.
              </AlertDescription>
            </Alert>
          )}

          <div className={`space-y-6 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {DISPLAY_ORDER.map((day) => (
              <div key={day} className="space-y-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">
                      {day.charAt(0) + day.slice(1).toLowerCase()}
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs cursor-help">
                          {schedule[day].length} slots
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Number of available time slots for {day.toLowerCase()}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeSlot(day)}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Time Slot
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add a new availability window for {day.toLowerCase()}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {schedule[day].length === 0 ? (
                  <div className="flex items-center justify-center py-6 rounded-md border-2 border-dashed">
                    <p className="text-sm text-muted-foreground">
                      No availability set for {day.charAt(0) + day.slice(1).toLowerCase()}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {schedule[day].map((slot, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-4 p-3 rounded-md bg-background hover:bg-accent/5 transition-colors"
                      >
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
                          size="icon"
                          onClick={() => removeTimeSlot(day, index)}
                          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove time slot</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Changes to your availability will not affect existing bookings. New bookings will follow the updated schedule.
                </p>
              </div>
              <Button 
                onClick={handleSave} 
                disabled={isLoading || disabled}
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Schedule'
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  )
}

// Helper function to generate time options in 30-minute intervals with AM/PM format
function generateTimeOptions(): string[] {
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