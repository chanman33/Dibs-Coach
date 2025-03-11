import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SessionConfig } from '@/utils/types/browse-coaches'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  coachName: string
  sessionConfig: SessionConfig
}

export function BookingModal({ isOpen, onClose, coachName, sessionConfig }: BookingModalProps) {
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
      <DialogContent className="max-w-3xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Book a Session with {coachName}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {/* Cal.com integration will go here */}
          <div className="flex items-center justify-center h-full">
            <p>Calendar integration coming soon...</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 