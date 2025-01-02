import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star, Calendar, Clock, Award } from 'lucide-react'
import Image from "next/image"
import { BookingModal } from "@/app/dashboard/realtor/coaches/_components/BookingModal"

interface Coach {
  id: number
  userId: string
  name: string
  specialty: string
  imageUrl: string
  rating: number
  reviewCount: number
  bio: string
  experience: string
  certifications: string[]
  availability: string
  sessionLength: string
  specialties: string[]
  calendlyUrl: string
  eventTypeUrl: string
}

interface CoachProfileModalProps {
  isOpen: boolean
  onClose: () => void
  coach: Coach
}

export function CoachProfileModal({ isOpen, onClose, coach }: CoachProfileModalProps) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  const handleBookNowClick = () => {
    setIsBookingModalOpen(true)
    onClose() // Close the profile modal
  }

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
              <Image src={coach.imageUrl} alt={coach.name} width={100} height={100} className="rounded-full" />
              <div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-5 w-5 ${i < Math.round(coach.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">({coach.reviewCount} reviews)</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{coach.experience} of experience</p>
              </div>
            </div>
            <p className="text-sm">{coach.bio}</p>
            <div>
              <h4 className="font-semibold mb-2">Certifications</h4>
              <ul className="list-disc list-inside text-sm">
                {coach.certifications.map((cert, index) => (
                  <li key={index}>{cert}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Specialties</h4>
              <div className="flex flex-wrap gap-2">
                {coach.specialties.map((specialty, index) => (
                  <span key={index} className="bg-primary/10 text-primary text-xs py-1 px-2 rounded-full">{specialty}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>Availability: {coach.availability}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>Session Length: {coach.sessionLength}</span>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={handleBookNowClick}>Book Now</Button>
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
      />
    </>
  )
}

