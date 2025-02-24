import { useState } from 'react'
import Image from 'next/image'
import { Calendar } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DEFAULT_AVATARS } from '@/utils/constants'

interface SessionConfig {
  durations: number[]
  rates: Record<string, number>
  currency: string
  defaultDuration: number
  allowCustomDuration: boolean
  minimumDuration: number
  maximumDuration: number
  isActive: boolean
}

export interface CoachProfileModalProps {
  isOpen: boolean
  onClose: () => void
  coach: {
    id: string
    firstName: string
    lastName: string
    profileImageUrl: string | null
    specialties: string[]
    bio: string | null
    hourlyRate: number | null
    calendlyUrl?: string | null
    eventTypeUrl?: string | null
    sessionConfig?: SessionConfig
  }
  variant?: 'public' | 'private'
}

export function CoachProfileModal({ isOpen, onClose, coach, variant = 'public' }: CoachProfileModalProps) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [imgError, setImgError] = useState(false)

  const handleBookNowClick = () => {
    setIsBookingModalOpen(true)
    onClose() // Close the profile modal
  }

  const finalImageUrl = imgError ? DEFAULT_AVATARS.COACH : coach.profileImageUrl || DEFAULT_AVATARS.COACH

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{`${coach.firstName} ${coach.lastName}`}</DialogTitle>
          <DialogDescription>{coach.specialties[0] || 'General Coach'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Image 
              src={finalImageUrl}
              alt={`${coach.firstName} ${coach.lastName}`} 
              width={100} 
              height={100} 
              className="rounded-full object-cover"
              onError={() => setImgError(true)}
            />
          </div>
          <p className="text-sm">{coach.bio || 'No bio available'}</p>
          
          {/* Session Rates */}
          {coach.hourlyRate && (
            <div>
              <h4 className="font-semibold mb-2">Hourly Rate</h4>
              <p className="text-sm">${coach.hourlyRate}/hour</p>
            </div>
          )}

          {/* Session Config */}
          {coach.sessionConfig && (
            <div>
              <h4 className="font-semibold mb-2">Available Session Lengths</h4>
              <div className="space-y-2">
                {coach.sessionConfig.durations.map((duration) => (
                  <div key={duration} className="flex justify-between items-center text-sm">
                    <span>{duration} minutes</span>
                    <span className="font-medium">
                      ${coach.sessionConfig?.rates[duration.toString()]}
                    </span>
                  </div>
                ))}
                {coach.sessionConfig.allowCustomDuration && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Custom durations available ({coach.sessionConfig.minimumDuration}-{coach.sessionConfig.maximumDuration} minutes)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Specialties */}
          <div>
            <h4 className="font-semibold mb-2">Specialties</h4>
            <div className="flex flex-wrap gap-2">
              {coach.specialties.length > 0 ? (
                coach.specialties.map((specialty, index) => (
                  <span key={index} className="bg-primary/10 text-primary text-xs py-1 px-2 rounded-full">
                    {specialty}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">No specialties listed</span>
              )}
            </div>
          </div>
          
          {/* Availability */}
          {variant === 'private' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Available for booking</span>
            </div>
          )}
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {variant === 'public' && (
            <Button 
              onClick={handleBookNowClick}
              disabled={!coach.calendlyUrl || !coach.sessionConfig?.isActive}
            >
              {!coach.calendlyUrl ? "Booking Unavailable" : 
               !coach.sessionConfig?.isActive ? "Not Accepting Bookings" : 
               "Book Now"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 