import { Button } from '@/components/ui/button'
import { BaseCoachCard } from '.'
import { PublicCoachCardProps } from './types'
import { RatingDisplay } from '../RatingDisplay'
import { useState } from 'react'
import { CoachProfileModal } from '../CoachProfileModal'
import { BookingModal } from '../BookingModal'

export function PublicCoachCard(props: PublicCoachCardProps) {
  const { rating, reviewCount, specialties, ...baseProps } = props
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  return (
    <>
      <BaseCoachCard
        {...baseProps}
        renderFooter={() => (
          <div className="w-full space-y-4">
            {(rating !== undefined && reviewCount !== undefined) && (
              <RatingDisplay 
                rating={rating} 
                reviewCount={reviewCount}
                size="sm"
              />
            )}
            
            {specialties.length > 0 && (
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
            )}

            <Button 
              className="w-full" 
              variant="secondary"
              onClick={() => setIsProfileModalOpen(true)}
            >
              Learn More
            </Button>
          </div>
        )}
      />

      <CoachProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        coach={{
          id: props.id,
          firstName: props.name.split(' ')[0],
          lastName: props.name.split(' ').slice(1).join(' '),
          profileImageUrl: props.imageUrl,
          specialties: props.specialties,
          bio: props.bio,
          hourlyRate: props.hourlyRate ?? null,
          calendlyUrl: props.calendlyUrl ?? null,
          eventTypeUrl: props.eventTypeUrl ?? null,
          sessionConfig: props.sessionConfig ?? {
            durations: [60],
            rates: { '60': props.hourlyRate ?? 0 },
            currency: 'USD',
            defaultDuration: 60,
            allowCustomDuration: false,
            minimumDuration: 60,
            maximumDuration: 60,
            isActive: true
          }
        }}
        variant="public"
      />

      {props.calendlyUrl && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          coachName={props.name}
          calendlyUrl={props.calendlyUrl ?? null}
          eventTypeUrl={props.eventTypeUrl ?? null}
          sessionConfig={props.sessionConfig ?? {
            durations: [60],
            rates: { '60': props.hourlyRate ?? 0 },
            currency: 'USD',
            defaultDuration: 60,
            allowCustomDuration: false,
            minimumDuration: 60,
            maximumDuration: 60,
            isActive: true
          }}
        />
      )}
    </>
  )
} 