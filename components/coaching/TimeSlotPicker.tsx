import { useState, useEffect } from 'react'
import { format, addDays, startOfDay } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface TimeSlot {
  startTime: string
  endTime: string
}

interface TimeSlotPickerProps {
  coachId: string
  onTimeSelected: (slot: { startTime: string; endTime: string; durationMinutes: number }) => void
}

export function TimeSlotPicker({ coachId, onTimeSelected }: TimeSlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()))
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchAvailableSlots = async (date: Date) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/coaching/sessions/available?${new URLSearchParams({
        coachId,
        startDate: date.toISOString(),
        endDate: addDays(date, 1).toISOString()
      })}`)

      if (!response.ok) {
        throw new Error('Failed to fetch available slots')
      }

      const { data } = await response.json()
      setAvailableSlots(data.availableSlots)
    } catch (error) {
      console.error('[FETCH_SLOTS_ERROR]', error)
      setAvailableSlots([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailableSlots(selectedDate)
  }, [selectedDate, coachId])

  const handleDateSelect = (date: Date | null) => {
    if (date) {
      setSelectedDate(startOfDay(date))
    }
  }

  const handleTimeSelect = (slot: TimeSlot) => {
    const start = new Date(slot.startTime)
    const end = new Date(slot.endTime)
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)

    onTimeSelected({
      startTime: slot.startTime,
      endTime: slot.endTime,
      durationMinutes
    })
  }

  return (
    <div className="grid grid-cols-[auto,1fr] gap-4">
      <div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabledDates={(date) => date < new Date()}
          className="rounded-md border"
        />
      </div>

      <div className="border rounded-md p-4">
        <h3 className="font-medium mb-4">
          Available Times for {format(selectedDate, 'EEEE, MMMM d')}
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : availableSlots.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {availableSlots.map((slot, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleTimeSelect(slot)}
                >
                  {format(new Date(slot.startTime), 'h:mm a')}
                </Button>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No available time slots for this date.
          </div>
        )}
      </div>
    </div>
  )
} 