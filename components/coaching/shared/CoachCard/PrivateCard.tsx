import { Button } from '@/components/ui/button'
import { BaseCoachCard } from '.'
import { PrivateCoachCardProps } from './types'
import { Calendar, Clock } from 'lucide-react'
import { useState } from 'react'
import { CoachProfileModal } from '../CoachProfileModal'
import { BookingModal } from '../BookingModal'

export function PrivateCoachCard({
  specialties,
  sessionLength,
  availability,
  isBooked,
  onProfileClick,
  sessionConfig,
  ...baseProps
}: PrivateCoachCardProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const baseRate = sessionConfig.rates[sessionConfig.defaultDuration.toString()]

  const handleActionClick = () => {
    if (isBooked) {
      setIsProfileModalOpen(true)
    } else {
      setIsBookingModalOpen(true)
    }
  }

  return (
    <>
      <BaseCoachCard
        {...baseProps}
        renderFooter={() => (
          <div className="w-full space-y-4">
            <div className="flex flex-wrap gap-2">
              {specialties.slice(0, 3).map(specialty => (
                <span
                  key={specialty}
                  className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {specialty}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{sessionLength}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{availability}</span>
              </div>
            </div>

            {sessionConfig.isActive && (
              <div className="text-sm">
                <span className="font-medium">
                  ${baseRate}/hr
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant={isBooked ? "secondary" : "default"}
                onClick={handleActionClick}
              >
                {isBooked ? "View Profile" : "Book Session"}
              </Button>
            </div>
          </div>
        )}
      />

      <CoachProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        coach={{
          id: baseProps.id,
          firstName: baseProps.name.split(' ')[0],
          lastName: baseProps.name.split(' ').slice(1).join(' '),
          profileImageUrl: baseProps.imageUrl,
          specialties,
          bio: baseProps.bio,
          hourlyRate: baseRate,
          calendlyUrl: baseProps.calendlyUrl,
          eventTypeUrl: baseProps.eventTypeUrl,
          sessionConfig
        }}
        variant="private"
      />

      {!isBooked && baseProps.calendlyUrl && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          coachName={baseProps.name}
          calendlyUrl={baseProps.calendlyUrl}
          eventTypeUrl={baseProps.eventTypeUrl}
          sessionConfig={sessionConfig}
        />
      )}
    </>
  )
} 