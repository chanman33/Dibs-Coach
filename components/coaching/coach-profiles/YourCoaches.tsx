'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { CoachCard } from '../shared/CoachCard'
import type { BrowseCoachData } from '@/utils/types/browse-coaches'
import { USER_CAPABILITIES } from '@/utils/roles/roles'

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

  // Function to render the list of booked coaches
  const renderBookedCoaches = (coaches: BrowseCoachData[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {coaches.map(coach => (
        <CoachCard
          key={coach.ulid}
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
      ))}
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