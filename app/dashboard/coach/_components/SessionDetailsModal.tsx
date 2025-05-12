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
  if (!session) return null
  
  const mentee = session.otherParty
  const menteeName = [mentee.firstName, mentee.lastName].filter(Boolean).join(' ') || 'Unknown Mentee'
  const menteeInitials = [mentee.firstName?.[0], mentee.lastName?.[0]].filter(Boolean).join('') || '?'
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
                {session.paymentStatus && (
                  <Badge variant="secondary" className={paymentStatusColor}>
                    Payment: {session.paymentStatus}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {session.status === 'SCHEDULED' && session.zoomJoinUrl ? (
          <div className="flex justify-center mt-4">
            <Button size="sm" asChild>
              <a href={session.zoomJoinUrl} target="_blank" rel="noopener noreferrer">
                Join Zoom
              </a>
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
