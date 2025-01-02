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
  imageUrl: string
  isBooked?: boolean
  rating: number
  reviewCount: number
  calendlyUrl: string
  rate: number
  eventTypeUrl: string
  onProfileClick: () => void
}

export function Coach({ id, name, specialty, imageUrl, isBooked, rating, reviewCount, calendlyUrl, rate, eventTypeUrl, onProfileClick }: CoachProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

  const handleBooking = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent profile modal from opening
    setIsBookingModalOpen(true)
  }

  return (
    <>
      <Card className="w-[250px] cursor-pointer" onClick={onProfileClick}>
        <CardContent className="pt-4">
          <div className="aspect-square relative mb-2">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover rounded-md"
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
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">({reviewCount})</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            variant={isBooked ? "secondary" : "default"}
            onClick={handleBooking}
          >
            {isBooked ? "Book Again" : "Book Call"}
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

