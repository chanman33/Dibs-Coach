'use client'

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DEFAULT_AVATARS } from '@/utils/constants'
import { TransformedSession } from '@/utils/types/session'
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarClock, Clock, Video, CheckCircle2, Calendar, DollarSign } from "lucide-react"
import Link from "next/link"

interface SessionsPreviewModalProps {
  session: TransformedSession | null
  isOpen: boolean
  onClose: () => void
}

export function SessionsPreviewModal({ session, isOpen, onClose }: SessionsPreviewModalProps) {
  if (!session) return null
  
  // Format session status for display
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'outline'
      case 'COMPLETED': return 'default'
      case 'CANCELLED': return 'destructive'
      case 'RESCHEDULED': return 'secondary'
      default: return 'secondary'
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Session Details
          </DialogTitle>
          <DialogDescription>
            {format(new Date(session.startTime), "EEEE, MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Session Status Card */}
          <Card className="p-4 border-l-4" style={{ 
            borderLeftColor: 
              session.status === 'SCHEDULED' ? '#3B82F6' : 
              session.status === 'COMPLETED' ? '#10B981' : 
              session.status === 'CANCELLED' ? '#EF4444' : 
              '#6B7280' 
          }}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium mb-1">Session Status</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(session.status)}>
                    {session.status}
                  </Badge>
                  {session.paymentStatus && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      {session.paymentStatus}
                    </Badge>
                  )}
                </div>
              </div>
              {session.zoomJoinUrl && (
                <Button asChild size="sm" className="gap-1" variant="secondary">
                  <Link href={session.zoomJoinUrl} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4 mr-1" />
                    Join Zoom
                  </Link>
                </Button>
              )}
            </div>
          </Card>
          
          {/* Session Time Details */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Time Details</h3>
            <div className="bg-muted/30 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Start Time</div>
                  <div className="text-muted-foreground">{format(new Date(session.startTime), "h:mm a")}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">End Time</div>
                  <div className="text-muted-foreground">{format(new Date(session.endTime), "h:mm a")}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Duration</div>
                  <div className="text-muted-foreground">{session.durationMinutes} minutes</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mentee Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Attendee Details</h3>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={session.otherParty.profileImageUrl || DEFAULT_AVATARS.PLACEHOLDER} 
                  alt={`${session.otherParty.firstName || ''} ${session.otherParty.lastName || ''}`}
                />
                <AvatarFallback>
                  {session.otherParty.firstName?.[0] || ''}
                  {session.otherParty.lastName?.[0] || ''}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{session.otherParty.firstName} {session.otherParty.lastName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    Mentee
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          {/* Session Details */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Session Information</h3>
            <div className="space-y-2">
              {session.sessionType && (
                <div className="flex justify-between items-center text-sm">
                  <div className="text-muted-foreground">Session Type</div>
                  <div className="font-medium">{session.sessionType}</div>
                </div>
              )}
              {session.paymentStatus && (
                <div className="flex justify-between items-center text-sm">
                  <div className="text-muted-foreground">Payment Status</div>
                  <div className="font-medium flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    {session.paymentStatus}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <div className="text-muted-foreground">Created At</div>
                <div className="font-medium">{format(new Date(session.createdAt), "MMM d, yyyy")}</div>
              </div>
            </div>
          </div>
          
          {/* Calendar & Zoom Information */}
          {session.zoomJoinUrl && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Video Conference</h3>
              <Card className="p-3 bg-muted/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-blue-500" />
                    <div className="text-sm font-medium">Zoom Meeting</div>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={session.zoomJoinUrl} target="_blank" rel="noopener noreferrer">
                      Join Meeting
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 