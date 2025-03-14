import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { BookingModal } from "../BookingModal"
import { useState } from "react"
import { SessionConfig } from "@/utils/types/browse-coaches"

interface CoachProfileModalProps {
  isOpen: boolean
  onClose: () => void
  coach: {
    firstName: string
    lastName: string
    profileImageUrl: string | null
    bio: string | null
    coachSkills: string[]
    hourlyRate: number | null
    sessionConfig: SessionConfig
  }
}

export function CoachProfileModal({ isOpen, onClose, coach }: CoachProfileModalProps) {
  const [showBookingModal, setShowBookingModal] = useState(false)

  const handleBookSession = () => {
    setShowBookingModal(true)
  }

  const handleCloseBookingModal = () => {
    setShowBookingModal(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Coach Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={coach.profileImageUrl || undefined} />
                <AvatarFallback>{coach.firstName?.[0]}{coach.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold">{coach.firstName} {coach.lastName}</h2>
                <p className="text-sm text-muted-foreground mt-1">{coach.bio}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {coach.coachSkills.map((skill, index) => (
                  <Badge key={index} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Session Details</h3>
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <span>Rate</span>
                  <span className="font-medium">${coach.hourlyRate}/hour</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Duration</span>
                  <span className="font-medium">{coach.sessionConfig.defaultDuration} minutes</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleBookSession}
                disabled={!coach.sessionConfig.isActive}
              >
                {!coach.sessionConfig.isActive ? "Booking Unavailable" : "Book a Session"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BookingModal
        isOpen={showBookingModal}
        onClose={handleCloseBookingModal}
        coachName={`${coach.firstName} ${coach.lastName}`}
        sessionConfig={coach.sessionConfig}
      />
    </>
  )
} 