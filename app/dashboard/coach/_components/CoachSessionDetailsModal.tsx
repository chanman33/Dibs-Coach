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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from "@/components/ui/use-toast"
import { useQueryClient } from '@tanstack/react-query'

// Default image placeholder
const DEFAULT_IMAGE_URL = '/placeholder.svg';

// Utility function to handle Clerk profile image URLs
const getProfileImageUrl = (url: string | null | undefined): string => {
  // For missing URLs, use placeholder
  if (!url) return DEFAULT_IMAGE_URL;

  // For placeholder images, use our default placeholder
  if (url.includes('placeholder')) return DEFAULT_IMAGE_URL;

  // Handle Clerk OAuth URLs
  if (url.includes('oauth_google')) {
    // Try img.clerk.com domain first
    return url.replace('images.clerk.dev', 'img.clerk.com');
  }

  // Handle other Clerk URLs
  if (url.includes('clerk.dev') || url.includes('clerk.com')) {
    return url;
  }

  // For all other URLs, ensure HTTPS
  return url.startsWith('https://') ? url : `https://${url}`;
};

// Status badge colors
const statusColorMap: Record<string, string> = {
  'SCHEDULED': 'bg-blue-500',
  'COMPLETED': 'bg-green-500',
  'CANCELLED': 'bg-red-500',
  'NO_SHOW': 'bg-yellow-500'
}

type SessionDetailsModalProps = {
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

export function SessionDetailsModal({ session, isOpen, onClose }: SessionDetailsModalProps) {
  // Add logging to debug session data
  // console.log('Modal received session:', session); // REMOVED
  // console.log('Modal isOpen:', isOpen); // REMOVED
  
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationError, setCancellationError] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [menteeImgError, setMenteeImgError] = useState(false);
  
  if (!session) return null;
  
  const mentee = session.otherParty;
  const menteeName = [mentee.firstName, mentee.lastName].filter(Boolean).join(' ') || 'Unknown Mentee';
  const menteeInitials = [mentee.firstName?.[0], mentee.lastName?.[0]].filter(Boolean).join('') || '?';
  const statusColor = statusColorMap[session.status] || 'bg-gray-500';
  
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

  // Calculate coach earnings (platform takes a percentage as fee)
  const sessionPrice = (session as any).price ?? 0  // Use type assertion since price isn't in the base type
  const platformFeePercentage = 0.20 // 20% platform fee is standard
  const coachEarnings = sessionPrice * (1 - platformFeePercentage)
  const formattedPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sessionPrice)
  const formattedFee = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sessionPrice * platformFeePercentage)
  const formattedEarnings = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(coachEarnings)

  const handleOpenCancelDialog = () => {
    if (isCancelDisabled) return; // Prevent opening if disabled
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
        calBookingUid: session.calBookingUid, // This is actually the CalBooking table ulid
        cancellationReason: cancellationReason.trim(),
      });

      if (result.error) { // System-level error
        console.error('Cancellation failed due to system error:', result.error);
        setCancellationError(result.error.message || 'A system error occurred during cancellation.');
      } else if (result.data?.success) { // Successful cancellation
        console.log('Session cancelled successfully:', result.data.message);
        setIsCancelDialogOpen(false);
        onClose(); // Close the main details modal
        toast({ 
          title: "Session Cancelled", 
          description: result.data.message || "The session has been successfully cancelled.",
          variant: "default", // Or "success" if you have one
        });
        await queryClient.invalidateQueries({ queryKey: ['coach-sessions'] });
        router.refresh(); // Refresh the page to show updated session list/status
        // router.push('/dashboard/coach'); // Or redirect as needed
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
  const isWithin24Hours = new Date(session.startTime).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;
  const isCancelDisabled = !canModifySession || isWithin24Hours;
  const cancelTooltipMessage = !canModifySession 
    ? "Session cannot be modified." 
    : isWithin24Hours 
      ? "Cannot cancel within 24 hours of start time."
      : "Cancel this session";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[600px] max-h-[81vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">Session Details</DialogTitle>
            </div>
            <DialogDescription>
              View information about this coaching session
            </DialogDescription>
          </DialogHeader>
          
          {/* Mentee Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={menteeImgError ? DEFAULT_IMAGE_URL : getProfileImageUrl(mentee.profileImageUrl)} 
                  alt={menteeName}
                  onError={() => setMenteeImgError(true)}
                />
                <AvatarFallback>{menteeInitials}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-lg">{menteeName}</h3>
                <p className="text-sm text-muted-foreground">Mentee</p>
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
                  {/* {session.paymentStatus && (
                    <Badge variant="secondary" className={paymentStatusColor}>
                      Payment: {session.paymentStatus}
                    </Badge>
                  )} */}
                </div>
              </div>
            </div>

            {/* Extra Session Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {/* <div>
                <div className="text-xs text-muted-foreground mb-1">Session Type</div>
                <div className="font-medium">
                  {session.sessionType ? session.sessionType : <span className="text-muted-foreground">—</span>}
                </div>
              </div> */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Payment Status</div>
                <div className="font-medium flex items-center gap-2">
                  {session.paymentStatus ? (
                    <span className="capitalize">{session.paymentStatus}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Earnings</div>
                <div className="font-medium text-green-700">
                  {(session as any).price ? formattedEarnings : '$-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Created At</div>
                <div className="font-medium">
                  {session.createdAt ? formatDate(session.createdAt, 'MMM d, yyyy') : <span className="text-muted-foreground">—</span>}
                </div>
              </div>
            </div>

            {/* Coach Session Price Section */}
            {/* <div className="p-4 bg-green-50 border border-green-100 rounded-md mt-4">
              <h3 className="font-medium text-sm text-green-800 mb-2">Session Price Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-green-700 mb-1">Session Price</div>
                  <div className="font-bold text-green-900">{(session as any).price ? formattedPrice : '$-'}</div>
                </div>
                <div>
                  <div className="text-xs text-green-700 mb-1">Platform Fee ({(platformFeePercentage * 100).toFixed(0)}%)</div>
                  <div className="font-medium text-green-900">{(session as any).price ? formattedFee : '$-'}</div>
                </div>
              </div>
              {(session as any).price && (
                <div className="text-xs text-green-700 mt-2">
                  {session.paymentStatus === 'COMPLETED' 
                    ? 'Payment has been processed and added to your balance.' 
                    : session.paymentStatus === 'PENDING'
                      ? 'You will receive this amount once the session is completed and payment is processed.'
                      : 'Payment status is currently unavailable.'}
                </div>
              )}
            </div> */}

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
                  className="min-w-[110px] bg-primary/90 hover:bg-primary"
                  onClick={() => { alert('Reschedule feature coming soon!')/* TODO: Implement reschedule logic */}}
                >
                  Reschedule
                </Button>
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <span tabIndex={0} className={isCancelDisabled ? 'cursor-not-allowed' : ''}> 
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-w-[90px] hover:bg-destructive/90 hover:text-destructive-foreground"
                          onClick={handleOpenCancelDialog}
                          disabled={isCancelDisabled}
                          aria-disabled={isCancelDisabled}
                        >
                          Cancel
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {isCancelDisabled && (
                      <TooltipContent>
                        <p>{cancelTooltipMessage}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCancelDialogOpen(false);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Session</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div>Are you sure you want to cancel this session? This action cannot be undone.</div>
                <div>
                  <label htmlFor="coachCancellationReason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for cancellation (required)
                  </label>
                  <Textarea 
                    id="coachCancellationReason"
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
                  <div>Please be mindful of your mentee. Consider reaching out to them directly if cancelling close to the session time.</div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep Session</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancel} 
              disabled={isCancelling || !cancellationReason.trim()}
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
