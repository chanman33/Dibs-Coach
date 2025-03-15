import { Button } from '@/components/ui/button'
import { BaseCoachCard } from '.'
import { PublicCoachCardProps } from './types'
import { RatingDisplay } from '../RatingDisplay'
import { useState, useEffect } from 'react'
import { BookingModal } from '../BookingModal'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function PublicCoachCard(props: PublicCoachCardProps) {
  const { rating, reviewCount, coachSkills, profileSlug, id, ...baseProps } = props
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const pathname = usePathname()

  // Determine the profile path - use profileSlug if available, otherwise use id
  const profilePath = profileSlug || id;

  // Handle navigation to coach profile
  const handleProfileClick = () => {
    try {
      // Log navigation event with detailed context
      console.log('[PUBLIC_COACH_NAVIGATION]', {
        action: 'view_profile',
        from: pathname,
        to: `/profile/${profilePath}`,
        coachId: id,
        coachName: props.name,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[PUBLIC_COACH_NAVIGATION_ERROR]', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        coachId: id,
        timestamp: new Date().toISOString()
      });
    }
  }

  return (
    <>
      <BaseCoachCard
        {...baseProps}
        id={id}
        renderFooter={() => (
          <div className="w-full space-y-4">
            {(rating !== undefined && reviewCount !== undefined) && (
              <RatingDisplay 
                rating={rating} 
                reviewCount={reviewCount}
                size="sm"
                showNewCoachBadge={reviewCount === 0}
              />
            )}
            
            {coachSkills && coachSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {coachSkills.slice(0, 3).map(skill => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            <Link 
              href={`/profile/${profilePath}?from=${encodeURIComponent(pathname)}`} 
              className="block w-full" 
              onClick={handleProfileClick}
            >
              <Button 
                className="w-full" 
                variant="secondary"
              >
                Learn More
              </Button>
            </Link>
          </div>
        )}
      />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        coachName={props.name}
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
    </>
  )
} 