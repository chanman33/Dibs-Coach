import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SessionConfig } from '@/utils/types/browse-coaches'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  coachName: string
  sessionConfig: SessionConfig
  coachId?: string
}

export function BookingModal({ isOpen, onClose, coachName, sessionConfig, coachId }: BookingModalProps) {
  const router = useRouter()

  const handleBookSession = () => {
    if (!coachId) {
      return
    }
    
    // Close the modal
    onClose()
    
    // Navigate to the availability page
    router.push(`/booking/availability?coachId=${coachId}`)
  }

  if (!sessionConfig?.isActive) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Unavailable</DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertDescription>
              This coach is not currently accepting bookings.
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Book a Session with {coachName}</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Session Duration</p>
                <p>{sessionConfig.defaultDuration} minutes</p>
              </div>
              <div>
                <p className="font-medium">Rate</p>
                <p>${sessionConfig.rates?.[sessionConfig.defaultDuration] || 0}/session</p>
              </div>
            </div>
            
            <Button onClick={handleBookSession} className="w-full">
              Check Availability & Book
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 