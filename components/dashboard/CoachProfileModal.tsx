import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star, Calendar, Clock, Award } from 'lucide-react'
import Image from "next/image"
import { BookingModal } from "@/components/dashboard/BookingModal"
import { formatCurrency } from "@/utils/format"

const DEFAULT_IMAGE_URL = '/placeholder.svg'

const getImageUrl = (url: string | null) => {
  if (!url) return DEFAULT_IMAGE_URL
  // No transformation needed, use the URL directly
  return url
}

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

interface Coach {
  id: number
  userId: string
  name: string
  specialty: string
  imageUrl: string | null
  bio: string | null
  experience: string | null
  certifications: string[] | null
  availability: string | null
  sessionLength: string | null
  specialties: string[]
  calendlyUrl: string | null
  eventTypeUrl: string | null
  sessionConfig: SessionConfig
}

interface CoachProfileModalProps {
  isOpen: boolean
  onClose: () => void
  coach: Coach
}

export function CoachProfileModal({ isOpen, onClose, coach }: CoachProfileModalProps) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [imgError, setImgError] = useState(false)

  const handleBookNowClick = () => {
    setIsBookingModalOpen(true)
    onClose() // Close the profile modal
  }

  const finalImageUrl = imgError ? DEFAULT_IMAGE_URL : getImageUrl(coach.imageUrl)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{coach.name}</DialogTitle>
            <DialogDescription>{coach.specialty}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <Image 
                src={finalImageUrl}
                alt={coach.name} 
                width={100} 
                height={100} 
                className="rounded-full"
                onError={() => setImgError(true)}
              />
              <div>
                <p className="text-sm text-muted-foreground mt-1">{coach.experience || 'Experience information not available'}</p>
              </div>
            </div>
            <p className="text-sm">{coach.bio || 'No bio available'}</p>
            
            {/* Session Lengths and Rates */}
            <div>
              <h4 className="font-semibold mb-2">Available Session Lengths</h4>
              <div className="space-y-2">
                {coach.sessionConfig.durations.map((duration) => (
                  <div key={duration} className="flex justify-between items-center text-sm">
                    <span>{duration} minutes</span>
                    <span className="font-medium">
                      {formatCurrency(coach.sessionConfig.rates[duration.toString()])}
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

            <div>
              <h4 className="font-semibold mb-2">Certifications</h4>
              <ul className="list-disc list-inside text-sm">
                {(coach.certifications || []).map((cert, index) => (
                  <li key={index}>{cert}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Specialties</h4>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(coach.specialties) && coach.specialties.length > 0 ? (
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
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>Availability: {coach.availability || 'Not specified'}</span>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button 
              onClick={handleBookNowClick}
              disabled={!coach.calendlyUrl || !coach.sessionConfig.isActive}
            >
              {!coach.calendlyUrl ? "Booking Unavailable" : 
               !coach.sessionConfig.isActive ? "Not Accepting Bookings" : 
               "Book Now"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        coachName={coach.name}
        coachId={coach.id}
        calendlyUrl={coach.calendlyUrl}
        eventTypeUrl={coach.eventTypeUrl}
        sessionConfig={coach.sessionConfig}
      />
    </>
  )
}

