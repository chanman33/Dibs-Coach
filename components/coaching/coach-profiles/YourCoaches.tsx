'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { CoachCard } from '../shared/CoachCard'
import type { BrowseCoachData } from '@/utils/types/browse-coaches'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { useRef, useState, useEffect } from 'react'
import { cn } from '@/utils/cn'

interface YourCoachesProps {
  isLoading: boolean;
  bookedCoaches: BrowseCoachData[];
  role: keyof typeof USER_CAPABILITIES;
  onCoachClick: (coach: BrowseCoachData) => void;
  className?: string; // Added to allow customization from parent
}

export function YourCoaches({ 
  isLoading,
  bookedCoaches,
  role,
  onCoachClick,
  className = ''
}: YourCoachesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Function to check scroll possibility
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth);
    }
  };

  // Set up scroll event listener and initial check
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      // Initial check after content is loaded
      setTimeout(checkScroll, 100);
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, [bookedCoaches]);

  // Check scroll possibilities when window size changes
  useEffect(() => {
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  // Scroll handlers
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Function to render the list of booked coaches
  const renderBookedCoaches = (coaches: BrowseCoachData[]) => (
    <div className="relative">
      <div className="overflow-x-auto hide-scrollbar" ref={scrollContainerRef}>
        <div className="flex space-x-4 py-2 px-1 min-w-min">
          {coaches.map(coach => (
            <div key={coach.ulid} className="w-full min-w-[300px] max-w-md flex-shrink-0">
              <CoachCard
                id={coach.ulid}
                userId={coach.userId}
                name={`${coach.firstName} ${coach.lastName}`}
                imageUrl={coach.profileImageUrl || ''}
                specialty={coach.coachSkills?.[0] || 'General Coach'}
                bio={coach.bio || ''}
                experience={coach.yearsCoaching 
                  ? `${coach.yearsCoaching} years of coaching experience` 
                  : null}
                availability={coach.isActive ? "Available" : "Unavailable"}
                sessionLength={`${coach.defaultDuration} minutes`}
                coachSkills={coach.coachSkills || []}
                coachRealEstateDomains={coach.coachRealEstateDomains || []}
                coachPrimaryDomain={coach.coachPrimaryDomain}
                isBooked={true} // Always true for this component
                onProfileClick={() => onCoachClick(coach)} // Use the passed handler
                sessionConfig={{
                  durations: [
                    coach.minimumDuration,
                    coach.defaultDuration,
                    coach.maximumDuration
                  ].filter(Boolean), // Filter out any falsy values
                  rates: {
                    [coach.minimumDuration]: (coach.hourlyRate || 0) * (coach.minimumDuration / 60),
                    [coach.defaultDuration]: (coach.hourlyRate || 0) * (coach.defaultDuration / 60),
                    [coach.maximumDuration]: (coach.hourlyRate || 0) * (coach.maximumDuration / 60)
                  },
                  currency: 'USD',
                  defaultDuration: coach.defaultDuration || 60,
                  allowCustomDuration: coach.allowCustomDuration || false,
                  minimumDuration: coach.minimumDuration || 30,
                  maximumDuration: coach.maximumDuration || 90,
                  isActive: coach.isActive
                }}
                profileSlug={coach.profileSlug}
                isPublic={false}
                showBookButton={false} // Don't show book button for already booked coaches
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Scroll navigation buttons */}
      {coaches.length > 1 && (
        <>
          <button 
            onClick={scrollLeft}
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-primary/90 p-2 text-white shadow-md transition-opacity",
              canScrollLeft ? "opacity-90 hover:opacity-100" : "opacity-0 pointer-events-none"
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={scrollRight}
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/90 p-2 text-white shadow-md transition-opacity",
              canScrollRight ? "opacity-90 hover:opacity-100" : "opacity-0 pointer-events-none"
            )}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className={`container mx-auto max-w-7xl px-4 sm:px-6 ${className}`}>
      <Card className="shadow-sm">
        <CardHeader className="pb-2 px-6 pt-6">
          <h2 className="text-2xl font-bold tracking-tight">Your Coaches</h2>
        </CardHeader>
        <CardContent className="pt-4 px-6 pb-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : bookedCoaches.length > 0 ? (
            renderBookedCoaches(bookedCoaches)
          ) : (
            <p className="text-center text-muted-foreground py-12">
              {role === USER_CAPABILITIES.MENTEE 
                ? "You haven't booked any coaches yet. Browse our recommended coaches below!"
                : "You haven't connected with any other coaches yet. Browse our recommended coaches below!"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 