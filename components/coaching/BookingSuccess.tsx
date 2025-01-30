import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

interface BookingSuccessProps {
  coachName: string
  startTime?: string
  onClose: () => void
}

export function BookingSuccess({
  coachName,
  startTime,
  onClose
}: BookingSuccessProps) {
  return (
    <div className="py-6 text-center space-y-6">
      <div className="flex justify-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          Your session has been booked!
        </h3>
        <p className="text-muted-foreground">
          You have successfully scheduled a coaching session with {coachName}
          {startTime && (
            <> for {format(new Date(startTime), 'EEEE, MMMM d, yyyy')} at {format(new Date(startTime), 'h:mm a')}</>
          )}.
        </p>
      </div>

      <div className="space-y-4 pt-2">
        <p className="text-sm text-muted-foreground">
          You will receive a confirmation email with the session details and instructions to join the call.
          Please check your email and calendar for the meeting link.
        </p>

        <p className="text-sm text-muted-foreground">
          If you need to reschedule or cancel your session, you can do so from your dashboard.
        </p>
      </div>

      <div className="pt-4">
        <Button onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
} 