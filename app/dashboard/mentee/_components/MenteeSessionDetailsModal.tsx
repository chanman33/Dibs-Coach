'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { TransformedSession } from '@/utils/types/session'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Clock, Video, FileText, AlertCircle } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from 'next/navigation'
import { cancelBookingAction } from '@/utils/actions/cal/booking-actions'
import { Textarea } from '@/components/ui/textarea'

// Status badge colors
const statusColorMap: Record<string, string> = {
  'SCHEDULED': 'bg-blue-500',
  'COMPLETED': 'bg-green-500',
  'CANCELLED': 'bg-red-500',
  'NO_SHOW': 'bg-yellow-500'
}

type MenteeSessionDetailsModalProps = {
  session: TransformedSession | null
  isOpen: boolean
  onClose: () => void
}

/**
 * Format date safely without persisting Date objects in state/closures
 */
function formatDate(dateString: string, formatString: string): string {
  try {
    const date = new Date(dateString)
    return format(date, formatString)
  } catch (e) {
    console.error('Date formatting error:', e)
    return dateString
  }
}

export function MenteeSessionDetailsModal({ session, isOpen, onClose }: MenteeSessionDetailsModalProps) {
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const router = useRouter()
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancellationError, setCancellationError] = useState<string | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  
  if (!session) return null
  
  const coach = session.otherParty
  const coachName = [coach.firstName, coach.lastName].filter(Boolean).join(' ') || 'Unknown Coach'
  const coachInitials = [coach.firstName?.[0], coach.lastName?.[0]].filter(Boolean).join('') || '?'
  const statusColor = statusColorMap[session.status] || 'bg-gray-500'
  
  // Format date and time
  const formattedDate = formatDate(session.startTime, 'EEEE, MMMM d, yyyy')
  const formattedStartTime = formatDate(session.startTime, 'h:mm a')
  const formattedEndTime = formatDate(session.endTime, 'h:mm a')
  
  // Format payment status
  const paymentStatus = session.paymentStatus || 'PENDING'
  const paymentStatusColors = {
    'COMPLETED': 'bg-green-100 text-green-800',
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'FAILED': 'bg-red-100 text-red-800',
    'REFUNDED': 'bg-gray-100 text-gray-800'
  }
  const paymentStatusColor = paymentStatusColors[paymentStatus as keyof typeof paymentStatusColors] || 'bg-gray-100 text-gray-800'

  const handleReschedule = () => {
    // Navigate to reschedule page with the session ID and cal booking UID
    // Use session.ulid as fallback if calBookingUid is not available
    // Also pass the coachId, which is session.otherParty.ulid
    if (!session || !session.otherParty || !session.otherParty.ulid) {
      console.error("Cannot reschedule: Missing session or coach information.");
      // Optionally, show a toast notification to the user
      return;
    }
    window.location.href = `/booking/reschedule?sessionId=${session.ulid}&calBookingId=${session.calBookingUid || session.ulid}&coachId=${session.otherParty.ulid}`
    setIsRescheduleDialogOpen(false)
  }

  const handleOpenCancelDialog = () => {
    setCancellationReason('');
    setCancellationError(null);
    setIsCancelDialogOpen(true);
  }

  const handleCancel = async () => {
    if (!session || !session.calBookingUid) {
      console.error('Cannot cancel: Missing session or Cal.com booking UID.');
      setCancellationError('Session details are missing. Cannot proceed with cancellation.');
      return;
    }
    if (!cancellationReason.trim()) {
      setCancellationError('Please provide a reason for cancellation.');
      return;
    }

    setIsCancelling(true);
    setCancellationError(null);

    try {
      const result = await cancelBookingAction({
        sessionId: session.ulid,
        calBookingUid: session.calBookingUid,
        cancellationReason: cancellationReason.trim(),
      });

      if (result.error) { // System-level error
        console.error('Cancellation failed due to system error:', result.error);
        setCancellationError(result.error.message || 'A system error occurred during cancellation.');
      } else if (result.data?.success) { // Successful cancellation
        console.log('Session cancelled successfully:', result.data.message);
        setIsCancelDialogOpen(false);
        onClose();
        router.push('/booking/booking-cancelled');
      } else { // Operational error (e.g., validation, policy)
        console.error('Cancellation failed:', result.data?.error);
        setCancellationError(result.data?.error || 'Failed to cancel session. Please try again.');
      }
    } catch (error) { // Catch unexpected errors during the action call itself
      console.error('Error during cancellation process:', error);
      setCancellationError('An unexpected error occurred. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  }

  const canModifySession = session.status === 'SCHEDULED'

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[600px] max-h-[81vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">Session Details</DialogTitle>
            </div>
            <DialogDescription>
              View information about your coaching session
            </DialogDescription>
          </DialogHeader>
          
          {/* Coach Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={coach.profileImageUrl || ''} alt={coachName} />
                <AvatarFallback>{coachInitials}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-lg">{coachName}</h3>
                <p className="text-sm text-muted-foreground">Your Coach</p>
              </div>
            </div>
            
            <Separator />
            
            {/* Session Information */}
            <div className="space-y-3">
              <h3 className="font-medium">Session Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formattedDate}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formattedStartTime} - {formattedEndTime} ({session.durationMinutes} min)</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {session.zoomJoinUrl ? 'Zoom meeting available' : 'No video conference'}
                  </span>
                </div>
                
                {session.sessionType && (
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm capitalize">{session.sessionType.toLowerCase()} Session</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Badge className={statusColor}>{session.status}</Badge>
                  {session.paymentStatus && (
                    <Badge variant="secondary" className={paymentStatusColor}>
                      Payment: {session.paymentStatus}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            {canModifySession && (
              <div className="flex flex-row items-center gap-2 mt-6 w-full">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white min-w-[110px]"
                  asChild
                >
                  <a href={session.zoomJoinUrl || '#'} target="_blank" rel="noopener noreferrer">
                    Join
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  className="min-w-[110px]"
                  onClick={() => setIsRescheduleDialogOpen(true)}
                >
                  Reschedule
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-w-[90px] hover:bg-destructive/90 hover:text-destructive-foreground"
                  onClick={handleOpenCancelDialog}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Confirmation Dialog */}
      <AlertDialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reschedule Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reschedule this session? You'll be able to choose a new time that works better for you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReschedule}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCancelDialogOpen(false);
          // Do not reset cancellationError here, so user can see it if dialog is closed by clicking outside
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Session</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3" asChild>
              <div className="space-y-3">
                <div>Are you sure you want to cancel this session?</div>
                <div>
                  <label htmlFor="cancellationReason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for cancellation (required)
                  </label>
                  <Textarea 
                    id="cancellationReason"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Please provide a brief reason for cancelling..."
                    rows={3}
                    disabled={isCancelling}
                  />
                </div>
                {cancellationError && (
                  <div className="flex items-start gap-2 text-sm text-red-700 bg-red-100 p-3 rounded-md border border-red-200">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-500" />
                    <div>{cancellationError}</div>
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-100 p-3 rounded-md border border-yellow-200">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-500" />
                  <div>Please note that cancellation policies may apply. You may be charged a cancellation fee depending on how close to the session time you cancel.</div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep Session</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancel} 
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel Session'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 