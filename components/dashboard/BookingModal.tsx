import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/utils/format"
import { DateTimeSelector } from "./DateTimeSelector"
import { toast } from 'react-hot-toast'

interface SessionConfig {
  durations: number[]
  rates: Record<string, number>
  currency: string
  defaultDuration: number
  allowCustomDuration: boolean
  minimumDuration: number
  maximumDuration: number
  isActive: boolean
}

interface TimeSlot {
  startTime: string
  endTime: string
  rate: number
  currency: string
}

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  coachName: string
  coachId: string
  calendlyUrl: string | null
  eventTypeUrl: string | null
  sessionConfig: SessionConfig
}

type BookingStep = 'duration' | 'datetime' | 'confirmation'

export function BookingModal({
  isOpen,
  onClose,
  coachName,
  coachId,
  sessionConfig
}: BookingModalProps) {
  const [step, setStep] = useState<BookingStep>('duration')
  const [selectedDuration, setSelectedDuration] = useState<number>()
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>()
  const [isLoading, setIsLoading] = useState(false)

  const handleDurationSelect = (duration: number) => {
    setSelectedDuration(duration)
    setStep('datetime')
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setStep('confirmation')
  }

  const handleConfirm = async () => {
    if (!selectedDuration || !selectedSlot) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/coaching/sessions/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          durationMinutes: selectedDuration,
          rate: selectedSlot.rate,
          currency: selectedSlot.currency
        })
      })

      if (!response.ok) {
        throw new Error('Failed to book session')
      }

      onClose()
      toast.success('Session booked successfully! Check your email for details.')
    } catch (error) {
      console.error('[BOOKING_ERROR]', error)
      toast.error('Failed to book session. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const renderDurationStep = () => (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Select Session Duration</DialogTitle>
        <DialogDescription>
          Choose how long you'd like your session to be
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3">
        {sessionConfig.durations.map((duration) => (
          <Button
            key={duration}
            variant="outline"
            className="w-full justify-between h-auto py-4"
            onClick={() => handleDurationSelect(duration)}
          >
            <span>{duration} minutes</span>
            <span className="font-medium">
              {formatCurrency(sessionConfig.rates[duration.toString()])}
            </span>
          </Button>
        ))}

        {sessionConfig.allowCustomDuration && (
          <Button
            variant="outline"
            className="w-full justify-between h-auto py-4"
            onClick={() => {/* TODO: Handle custom duration */}}
          >
            <span>Custom Duration</span>
            <span className="text-sm text-muted-foreground">
              ({sessionConfig.minimumDuration}-{sessionConfig.maximumDuration} min)
            </span>
          </Button>
        )}
      </div>
    </div>
  )

  const renderDateTimeStep = () => (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Select Date & Time</DialogTitle>
        <DialogDescription>
          Choose a time slot for your {selectedDuration}-minute session
        </DialogDescription>
      </DialogHeader>

      <DateTimeSelector
        coachId={coachId}
        duration={selectedDuration!}
        onSelect={handleSlotSelect}
      />

      <Button
        variant="outline"
        onClick={() => setStep('duration')}
        className="w-full"
      >
        Back to Duration Selection
      </Button>
    </div>
  )

  const renderConfirmationStep = () => (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Confirm Booking</DialogTitle>
        <DialogDescription>
          Review your session details
        </DialogDescription>
      </DialogHeader>

      {selectedSlot && (
        <div className="space-y-4 border rounded-lg p-4">
          <div className="grid gap-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Coach</span>
              <span className="font-medium">{coachName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{selectedDuration} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="font-medium">
                {new Date(selectedSlot.startTime).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-medium">
                {formatCurrency(selectedSlot.rate)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setStep('datetime')}
          className="flex-1"
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          onClick={handleConfirm}
          className="flex-1"
          disabled={isLoading}
        >
          Confirm Booking
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        {step === 'duration' && renderDurationStep()}
        {step === 'datetime' && renderDateTimeStep()}
        {step === 'confirmation' && renderConfirmationStep()}
      </DialogContent>
    </Dialog>
  )
}

