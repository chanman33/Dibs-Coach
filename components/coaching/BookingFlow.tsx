import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TimeSlotPicker } from './TimeSlotPicker'
import { BookingConfirmation } from './BookingConfirmation'
import { BookingSuccess } from './BookingSuccess'
import { toast } from 'sonner'

export interface BookingFlowProps {
  isOpen: boolean
  onClose: () => void
  coachName: string
  coachId: string
  coachRate?: number
}

type BookingStep = 'select-time' | 'confirm' | 'success'

interface SelectedSlot {
  startTime: string
  endTime: string
  durationMinutes: number
}

export function BookingFlow({
  isOpen,
  onClose,
  coachName,
  coachId,
  coachRate
}: BookingFlowProps) {
  const [step, setStep] = useState<BookingStep>('select-time')
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleTimeSelected = (slot: SelectedSlot) => {
    setSelectedSlot(slot)
    setStep('confirm')
  }

  const handleConfirm = async () => {
    if (!selectedSlot) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/coaching/sessions/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coachId,
          ...selectedSlot
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to book session')
      }

      // Move directly to success after booking
      setStep('success')
    } catch (error) {
      console.error('[BOOKING_ERROR]', error)
      toast.error('Failed to book session. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep('select-time')
    setSelectedSlot(null)
    onClose()
  }

  const getStepContent = () => {
    switch (step) {
      case 'select-time':
        return (
          <TimeSlotPicker
            coachId={coachId}
            onTimeSelected={handleTimeSelected}
          />
        )
      case 'confirm':
        return selectedSlot ? (
          <BookingConfirmation
            slot={selectedSlot}
            coachName={coachName}
            coachRate={coachRate}
            onConfirm={handleConfirm}
            onBack={() => setStep('select-time')}
            isLoading={isLoading}
          />
        ) : null
      case 'success':
        return (
          <BookingSuccess
            coachName={coachName}
            startTime={selectedSlot?.startTime}
            onClose={handleClose}
          />
        )
    }
  }

  const titles = {
    'select-time': `Book a Call with ${coachName}`,
    'confirm': 'Confirm Your Booking',
    'success': 'Booking Confirmed!'
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{titles[step]}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {getStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
} 