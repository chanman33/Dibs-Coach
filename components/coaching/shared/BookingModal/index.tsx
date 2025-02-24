import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useEffect } from 'react'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  coachName: string
  calendlyUrl: string | null
  eventTypeUrl: string | null
  sessionConfig: {
    durations: number[]
    rates: Record<string, number>
    currency: string
    defaultDuration: number
    allowCustomDuration: boolean
    minimumDuration: number
    maximumDuration: number
    isActive: boolean
  }
}

declare global {
  interface Window {
    Calendly: any
  }
}

export function BookingModal({ isOpen, onClose, coachName, calendlyUrl, eventTypeUrl, sessionConfig }: BookingModalProps) {
  useEffect(() => {
    if (isOpen && calendlyUrl) {
      // Initialize Calendly widget
      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      script.async = true
      document.body.appendChild(script)

      return () => {
        document.body.removeChild(script)
      }
    }
  }, [isOpen, calendlyUrl])

  useEffect(() => {
    if (isOpen && calendlyUrl && window.Calendly) {
      window.Calendly.initInlineWidget({
        url: eventTypeUrl || calendlyUrl,
        parentElement: document.getElementById('calendly-booking-widget'),
        prefill: {},
        utm: {}
      })
    }
  }, [isOpen, calendlyUrl, eventTypeUrl])

  if (!calendlyUrl) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[80vh]">
        <DialogHeader>
          <DialogTitle>Book a Session with {coachName}</DialogTitle>
        </DialogHeader>
        <div id="calendly-booking-widget" style={{ height: '100%', width: '100%' }} />
      </DialogContent>
    </Dialog>
  )
} 