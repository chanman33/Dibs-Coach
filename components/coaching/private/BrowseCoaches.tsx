'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SearchAndFilter } from '../shared/SearchAndFilter'
import { PrivateCoachCard } from '../shared/CoachCard/PrivateCard'
import { Categories } from '../shared/Categories'
import { useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CoachProfileModal } from '@/components/dashboard/CoachProfileModal'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { useBrowseCoaches } from '@/utils/hooks/useBrowseCoaches'
import { BrowseCoachData } from '@/utils/types/browse-coaches'

export interface BrowseCoachesProps {
  role: keyof typeof USER_CAPABILITIES;
}

export function BrowseCoaches({ role }: BrowseCoachesProps) {
  const {
    isLoading,
    error,
    filteredBookedCoaches,
    filteredRecommendedCoaches,
    handleSearch,
    handleFilter,
    allSpecialties,
  } = useBrowseCoaches({ role });

  const [selectedCoach, setSelectedCoach] = useState<BrowseCoachData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCoachClick = (coach: BrowseCoachData) => {
    setSelectedCoach(coach);
    setIsModalOpen(true);
  };

  if (error) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderCoaches = (coaches: BrowseCoachData[], isBooked: boolean = false) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
      {coaches.map(coach => (
        <PrivateCoachCard
          key={coach.ulid}
          id={coach.ulid}
          userId={coach.userId}
          name={`${coach.firstName} ${coach.lastName}`}
          imageUrl={coach.profileImageUrl || ''}
          specialty={coach.coachingSpecialties?.[0] || 'General Coach'}
          bio={coach.bio || ''}
          experience={coach.yearsCoaching 
            ? `${coach.yearsCoaching} years of coaching experience` 
            : null}
          certifications={[]}
          availability={coach.isActive ? "Available" : "Unavailable"}
          sessionLength={`${coach.defaultDuration} minutes`}
          specialties={coach.coachingSpecialties || []}
          calendlyUrl={coach.calendlyUrl || ''}
          eventTypeUrl={coach.eventTypeUrl || ''}
          isBooked={isBooked}
          onProfileClick={() => handleCoachClick(coach)}
          sessionConfig={{
            durations: [
              coach.minimumDuration,
              coach.defaultDuration,
              coach.maximumDuration
            ],
            rates: {
              [coach.minimumDuration]: (coach.hourlyRate || 0) * (coach.minimumDuration / 60),
              [coach.defaultDuration]: (coach.hourlyRate || 0) * (coach.defaultDuration / 60),
              [coach.maximumDuration]: (coach.hourlyRate || 0) * (coach.maximumDuration / 60)
            },
            currency: 'USD',
            defaultDuration: coach.defaultDuration,
            allowCustomDuration: coach.allowCustomDuration,
            minimumDuration: coach.minimumDuration,
            maximumDuration: coach.maximumDuration,
            isActive: coach.isActive
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <h2 className="text-2xl font-bold tracking-tight">Your Coaches</h2>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredBookedCoaches.length > 0 ? (
            renderCoaches(filteredBookedCoaches, true)
          ) : (
            <p className="text-center text-muted-foreground py-12">
              {role === USER_CAPABILITIES.MENTEE 
                ? "You haven't booked any coaches yet. Browse our recommended coaches below!"
                : "You haven't connected with any other coaches yet. Browse our recommended coaches below!"}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <h2 className="text-lg font-semibold">Search & Filters</h2>
            </CardHeader>
            <CardContent className="pt-4">
              <SearchAndFilter
                onSearch={handleSearch}
                onFilter={(filters: string[]) => handleFilter(filters[0] || 'all')}
                specialties={allSpecialties}
                vertical={true}
                variant="private"
              />
            </CardContent>
          </Card>

          <Categories onCategoryClick={(category) => handleFilter(category)} />
        </div>
        
        <div className="lg:col-span-3">
          <Card className="shadow-sm h-full">
            <CardHeader className="pb-2">
              <h2 className="text-2xl font-bold tracking-tight">All Coaches</h2>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredRecommendedCoaches.length > 0 ? (
                <div className="w-full">
                  {renderCoaches(filteredRecommendedCoaches
                    .filter(coach => 
                      !filteredBookedCoaches.some(booked => booked.ulid === coach.ulid)
                    )
                    .map(coach => ({
                      ...coach,
                      specialty: coach.coachingSpecialties?.[0] || 'General Coach'
                    }))
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  No coaches available at the moment. Please check back later!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <h2 className="text-2xl font-bold tracking-tight">Recommended Coaches</h2>
          <p className="text-sm text-muted-foreground">
            Top rated coaches that match your interests and expertise level
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredRecommendedCoaches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderCoaches(filteredRecommendedCoaches
                .filter(coach => 
                  !filteredBookedCoaches.some(booked => booked.ulid === coach.ulid)
                )
                .slice(0, 3)
                .map(coach => ({
                  ...coach,
                  rating: coach.averageRating,
                  specialty: coach.coachingSpecialties?.[0] || 'General Coach'
                }))
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              No recommended coaches available at the moment. Please check back later!
            </p>
          )}
        </CardContent>
      </Card>

      {selectedCoach && (
        <CoachProfileModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          coach={{
            id: selectedCoach.ulid,
            userId: selectedCoach.userId,
            name: `${selectedCoach.firstName} ${selectedCoach.lastName}`,
            imageUrl: selectedCoach.profileImageUrl || '',
            specialty: selectedCoach.coachingSpecialties?.[0] || 'General Coach',
            bio: selectedCoach.bio || '',
            experience: selectedCoach.yearsCoaching 
              ? `${selectedCoach.yearsCoaching} years of coaching experience` 
              : null,
            certifications: [],
            availability: selectedCoach.isActive ? "Available" : "Unavailable",
            sessionLength: `${selectedCoach.defaultDuration} minutes`,
            specialties: selectedCoach.coachingSpecialties || [],
            calendlyUrl: selectedCoach.calendlyUrl || '',
            eventTypeUrl: selectedCoach.eventTypeUrl || '',
            sessionConfig: {
              durations: [
                selectedCoach.minimumDuration,
                selectedCoach.defaultDuration,
                selectedCoach.maximumDuration
              ],
              rates: {
                [selectedCoach.minimumDuration]: (selectedCoach.hourlyRate || 0) * (selectedCoach.minimumDuration / 60),
                [selectedCoach.defaultDuration]: (selectedCoach.hourlyRate || 0) * (selectedCoach.defaultDuration / 60),
                [selectedCoach.maximumDuration]: (selectedCoach.hourlyRate || 0) * (selectedCoach.maximumDuration / 60)
              },
              currency: 'USD',
              defaultDuration: selectedCoach.defaultDuration,
              allowCustomDuration: selectedCoach.allowCustomDuration,
              minimumDuration: selectedCoach.minimumDuration,
              maximumDuration: selectedCoach.maximumDuration,
              isActive: selectedCoach.isActive
            }
          }}
        />
      )}
    </div>
  );
} 