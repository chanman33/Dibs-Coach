import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, ArrowLeft, CalendarDays, Clock, DollarSign } from 'lucide-react'

interface BookingConfirmationProps {
  slot: {
    startTime: string
    endTime: string
    durationMinutes: number
  }
  coachName: string
  coachRate?: number
  onConfirm: () => Promise<void>
  onBack: () => void
  isLoading: boolean
}

export function BookingConfirmation({
  slot,
  coachName,
  coachRate,
  onConfirm,
  onBack,
  isLoading
}: BookingConfirmationProps) {
  const startTime = new Date(slot.startTime)
  const endTime = new Date(slot.endTime)
  const sessionCost = coachRate ? (slot.durationMinutes / 60) * coachRate : null

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="flex items-center gap-2"
        onClick={onBack}
        disabled={isLoading}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-muted-foreground">
                  {format(startTime, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Time</p>
                <p className="text-muted-foreground">
                  {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                </p>
              </div>
            </div>

            {sessionCost && (
              <div className="flex items-start gap-4">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Cost</p>
                  <p className="text-muted-foreground">
                    ${sessionCost.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              By confirming this booking, you agree to attend the coaching session with {coachName} at the specified time.
              Please make sure to join the session on time and have a stable internet connection.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Booking
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 