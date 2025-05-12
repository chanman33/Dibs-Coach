import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { addDays, format, isSameDay, startOfDay } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { formatCurrency } from '@/utils/format'

interface TimeSlot {
  startTime: string
  endTime: string
  rate: number
  currency: string
}

interface DateTimeSelectorProps {
  coachId: string
  duration: number
  onSelect: (slot: TimeSlot) => void
}

export function DateTimeSelector({ coachId, duration, onSelect }: DateTimeSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()))
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      setIsLoading(true)
      try {
        const endDate = addDays(selectedDate, 1).toISOString()
        const response = await fetch(
          `/api/coaching/sessions/available?` + 
          new URLSearchParams({
            coachId,
            startDate: selectedDate.toISOString(),
            endDate,
            duration: duration.toString()
          })
        )

        if (!response.ok) {
          throw new Error('Failed to fetch available slots')
        }

        const data = await response.json()
        setAvailableSlots(data.data.availableSlots)
      } catch (error) {
        console.error('[AVAILABILITY_ERROR]', error)
        // TODO: Show error toast
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailableSlots()
  }, [coachId, duration, selectedDate])

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(startOfDay(date))}
          disabledDates={(date) => date < startOfDay(new Date())}
          className="rounded-md border"
        />
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">
          Available Times for {format(selectedDate, 'EEEE, MMMM d')}
        </h4>

        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : availableSlots.length > 0 ? (
          <div className="grid gap-2 max-h-[300px] overflow-y-auto">
            {availableSlots.map((slot) => (
              <Button
                key={slot.startTime}
                variant="outline"
                className="w-full justify-between h-auto py-3"
                onClick={() => onSelect(slot)}
              >
                <span>{format(new Date(slot.startTime), 'h:mm a')}</span>
                <span className="font-medium">
                  {formatCurrency(slot.rate)}
                </span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No available slots for this date
          </div>
        )}
      </div>
    </div>
  )
} 