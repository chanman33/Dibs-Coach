import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { loadCalendlyScript } from '@/lib/calendly'
import { Card } from '@/components/ui/card'
import { createBooking } from '@/utils/actions/booking'
import { toast } from 'react-hot-toast'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  coachName: string
  calendlyUrl: string
  eventTypeUrl: string
  rate?: number // Add this prop to Coach component
}

export function BookingModal({ 
  isOpen, 
  onClose, 
  coachName, 
  calendlyUrl,
  eventTypeUrl,
  rate = 150
}: BookingModalProps) {
  const [step, setStep] = useState(0)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const initCalendly = async () => {
        setIsLoading(true)
        try {
          await loadCalendlyScript()
          console.log('Calendly script loaded') // Debug log
          
          // Add a small delay to ensure the DOM element exists
          setTimeout(() => {
            const element = document.querySelector('.calendly-inline-widget')
            console.log('Calendly element:', element) // Debug log
            
            if (window.Calendly && element) {
              window.Calendly.initInlineWidget({
                url: calendlyUrl,
                parentElement: element,
                prefill: {},
              })
              console.log('Calendly widget initialized') // Debug log
            }
          }, 100)
        } catch (error) {
          console.error('Error loading Calendly:', error)
          toast.error('Failed to load booking calendar')
        } finally {
          setIsLoading(false)
        }
      }

      initCalendly()
    }
  }, [isOpen, calendlyUrl])

  const steps = [
    { title: 'Select Date & Time' },
    { title: 'Confirm Details' },
    { title: 'Payment' },
    { title: 'Confirmation' },
  ]

  const handleCalendlyEvent = async (e: any) => {
    if (e.data.event === 'calendly.event_scheduled') {
      try {
        setIsSubmitting(true)
        const scheduledTime = e.data.payload.event.start_time
        const inviteeEmail = e.data.payload.invitee.email
        const eventUri = e.data.payload.event.uri
        
        setSelectedTime(scheduledTime)
        
        // Create booking with all required data
        await createBooking({
          eventTypeUrl,
          scheduledTime,
          inviteeEmail,
          eventUri,
          coachName
        })
        
        setStep(1)
        toast.success('Meeting scheduled successfully!')
      } catch (error) {
        console.error('Error creating booking:', error)
        toast.error('Failed to schedule meeting. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  useEffect(() => {
    window.addEventListener('message', handleCalendlyEvent)
    return () => window.removeEventListener('message', handleCalendlyEvent)
  }, [])

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="h-[600px] w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div 
                className="calendly-inline-widget" 
                data-url={calendlyUrl}
                style={{ minWidth: '320px', height: '600px' }}
              />
            )}
          </div>
        )
      case 1:
        return (
          <Card className="p-4 space-y-4">
            <div>
              <h4 className="font-semibold">Selected Time</h4>
              <p>{new Date(selectedTime!).toLocaleString()}</p>
            </div>
            <div>
              <h4 className="font-semibold">Coach</h4>
              <p>{coachName}</p>
            </div>
            <div>
              <h4 className="font-semibold">Rate</h4>
              <p>${rate}/hour</p>
            </div>
          </Card>
        )
      case 2:
        return (
          <div className="space-y-4">
            <h4 className="font-semibold">Payment Details</h4>
            {/* Integrate your payment component here */}
            <div className="p-4 border rounded">
              <p>Payment form will go here</p>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
              ✓
            </div>
            <h4 className="font-semibold">Booking Confirmed!</h4>
            <p>You will receive a confirmation email shortly.</p>
          </div>
        )
    }
  }

  const handleNext = async () => {
    if (step === 1) { // Payment step
      setIsSubmitting(true)
      try {
        // Handle payment processing here
        setStep(step + 1)
      } catch (error) {
        toast.error('Payment failed')
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Book a Call with {coachName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="flex items-center justify-center space-x-2 mb-6">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center">
                <div className={`
                  h-8 w-8 rounded-full flex items-center justify-center
                  ${i === step ? 'bg-primary text-white' : 
                    i < step ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}
                `}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-10 h-1 mx-2 ${i < step ? 'bg-green-100' : 'bg-gray-100'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="h-full">
            {renderStepContent()}
          </div>
        </div>
        
        <div className="flex justify-between mt-4">
          {step > 0 && <Button onClick={handleBack}>Back</Button>}
          {step < steps.length - 1 && step !== 0 && (
            <Button 
              onClick={handleNext} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : step === 1 ? (
                'Complete Payment'
              ) : (
                'Next'
              )}
            </Button>
          )}
          {step === steps.length - 1 && <Button onClick={onClose}>Close</Button>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

