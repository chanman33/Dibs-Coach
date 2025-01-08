import { useState } from 'react'
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Star } from 'lucide-react'
import Image from "next/image"
import { BookingModal } from "@/app/dashboard/realtor/coaches/_components/BookingModal"

interface CoachProps {
  id: number
  name: string
  specialty: string
  imageUrl: string | null
  isBooked?: boolean
  calendlyUrl: string | null
  rate: number | null
  eventTypeUrl: string | null
  onProfileClick: () => void
}

const DEFAULT_IMAGE_URL = '/placeholder.svg'

const getImageUrl = (url: string | null) => {
  if (!url) return DEFAULT_IMAGE_URL
  return url
}

export function Coach({ id, name, specialty, imageUrl, isBooked, calendlyUrl, rate, eventTypeUrl, onProfileClick }: CoachProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [imgError, setImgError] = useState(false)

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

  const handleBooking = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent profile modal from opening
    setIsBookingModalOpen(true)
  }

  const finalImageUrl = imgError ? DEFAULT_IMAGE_URL : getImageUrl(imageUrl)

  return (
    <>
      <Card className="w-[250px] cursor-pointer" onClick={onProfileClick}>
        <CardContent className="pt-4">
          <div className="aspect-square relative mb-2">
            <Image
              src={finalImageUrl}
              alt={name}
              fill
              className="object-cover rounded-md"
              onError={() => setImgError(true)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white/90"
              onClick={toggleFavorite}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
            </Button>
          </div>
          <h3 className="font-semibold text-lg">{name}</h3>
          <p className="text-sm text-muted-foreground">{specialty}</p>
          <div className="flex items-center mt-2">
            <span className="text-sm text-muted-foreground">{rate ? `$${rate}/hr` : 'Rate not set'}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            variant={isBooked ? "secondary" : "default"}
            onClick={handleBooking}
            disabled={!calendlyUrl}
          >
            {isBooked ? "Book Again" : calendlyUrl ? "Book Call" : "Booking Unavailable"}
          </Button>
        </CardFooter>
      </Card>

      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        coachName={name}
        coachId={id}
        calendlyUrl={calendlyUrl}
        eventTypeUrl={eventTypeUrl}
      />
    </>
  )
}

