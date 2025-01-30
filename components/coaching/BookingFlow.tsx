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

type BookingStep = 'select-time' | 'confirm' | 'calendly' | 'success'

interface SelectedSlot {
  startTime: string
  endTime: string
  durationMinutes: number
}

declare global {
  interface Window {
    Calendly: any;
  }
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
  const [schedulingUrl, setSchedulingUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (step === 'calendly' && schedulingUrl) {
      // Load Calendly script
      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      script.async = true
      document.head.appendChild(script)

      // Initialize widget when script loads
      script.onload = () => {
        if (window.Calendly) {
          const container = document.getElementById('calendly-container')
          if (container) {
            container.innerHTML = ''
            window.Calendly.initInlineWidget({
              url: schedulingUrl,
              parentElement: container,
              prefill: {},
              minWidth: '320px',
              height: '600px'
            })
          }
        }
      }

      return () => {
        const container = document.getElementById('calendly-container')
        if (container) {
          container.innerHTML = ''
        }
      }
    }
  }, [step, schedulingUrl])

  useEffect(() => {
    if (isOpen) {
      const handleCalendlyEvent = (e: any) => {
        if (e.origin !== 'https://calendly.com') return
        if (e.data.event === 'calendly.event_scheduled') {
          setStep('success')
        }
      }

      window.addEventListener('message', handleCalendlyEvent)
      return () => window.removeEventListener('message', handleCalendlyEvent)
    }
  }, [isOpen])

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

      const { data } = await response.json()
      setSchedulingUrl(data.schedulingUrl)
      setStep('calendly')
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
    setSchedulingUrl(null)
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
      case 'calendly':
        return (
          <div id="calendly-container" className="min-h-[600px]" />
        )
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
    'calendly': 'Schedule Your Session',
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