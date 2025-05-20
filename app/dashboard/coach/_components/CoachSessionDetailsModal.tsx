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
import { Calendar, Clock, Video, FileText } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

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
  console.log('Modal received session:', session);
  console.log('Modal isOpen:', isOpen);
  
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

  return (
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
              <AvatarImage src={mentee.profileImageUrl || ''} alt={menteeName} />
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
          {session.status === 'SCHEDULED' && (
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
                onClick={() => {/* TODO: Implement reschedule logic */}}
              >
                Reschedule
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-w-[90px] hover:bg-destructive/90 hover:text-destructive-foreground"
                onClick={() => {/* TODO: Implement cancel logic */}}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
