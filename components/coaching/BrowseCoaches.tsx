'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2, AlertCircle } from 'lucide-react'
import { Coach } from '@/components/dashboard/Coach'
import { SearchAndFilter } from '@/app/dashboard/coach/browse-coaches/_components/SearchAndFilter'
import { CoachProfileModal } from '@/components/dashboard/CoachProfileModal'
import { useBrowseCoaches } from '@/utils/hooks/useBrowseCoaches'
import { BrowseCoachData, SessionConfig } from '@/utils/types/browse-coaches'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { Categories } from '@/app/coaches/components/Categories'


export interface BrowseCoachProps {
  role: keyof typeof USER_CAPABILITIES;
  isBooked?: boolean;
}

export function BrowseCoaches({ role }: BrowseCoachProps) {
  const {
    isLoading,
    error,
    filteredBookedCoaches,
    filteredRecommendedCoaches,
    handleSearch,
    handleFilter,
    allSpecialties,
  } = useBrowseCoaches({ role: role as 'COACH' | 'MENTEE' });


  const [selectedCoach, setSelectedCoach] = useState<BrowseCoachData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCoachClick = (coach: BrowseCoachData) => {
    setSelectedCoach(coach);
    setIsModalOpen(true);
  };

  const handlePriceRangeChange = (range: string) => {
    // TODO: Implement price range filtering
    console.log('Price range changed:', range);
  };

  const handleSortChange = (sort: string) => {
    // TODO: Implement sorting
    console.log('Sort changed:', sort);
  };

  const renderCoaches = (coaches: BrowseCoachData[], isBooked: boolean = false) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
      {coaches.map(coach => (
        <Coach
          key={coach.id}
          id={coach.id}
          userId={coach.id.toString()}
          name={`${coach.firstName} ${coach.lastName}`}
          imageUrl={coach.profileImageUrl}
          specialty={coach.specialties?.[0] || 'General Coach'}
          bio={coach.bio}
          experience={null}
          certifications={[]}
          availability="Available"
          sessionLength="60 minutes"
          specialties={coach.specialties || []}
          calendlyUrl={null}
          eventTypeUrl={null}
          isBooked={isBooked}
          onProfileClick={() => handleCoachClick(coach)}
          sessionConfig={getSessionConfig(coach)}
        />
      ))}
    </div>
  );

  const getSessionConfig = (coach: BrowseCoachData): SessionConfig => ({
    durations: [30, 60, 90],
    rates: {
      '30': coach.hourlyRate || 0,
      '60': (coach.hourlyRate || 0) * 2,
      '90': (coach.hourlyRate || 0) * 3
    },
    currency: 'USD',
    defaultDuration: 60,
    allowCustomDuration: false,
    minimumDuration: 30,
    maximumDuration: 90,
    isActive: true
  });

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
                onFilter={handleFilter}
                onPriceRangeChange={handlePriceRangeChange}
                onSortChange={handleSortChange}
                specialties={allSpecialties}
                vertical={true}
              />
            </CardContent>
          </Card>

          <Categories />
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
                  {renderCoaches(filteredRecommendedCoaches.filter(coach => 
                    !filteredBookedCoaches.some(booked => booked.id === coach.id)
                  ))}
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
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredRecommendedCoaches.length > 0 ? (
            renderCoaches(filteredRecommendedCoaches.filter(coach => 
              !filteredBookedCoaches.some(booked => booked.id === coach.id)
            ))
          ) : (
            <p className="text-center text-muted-foreground py-12">
              {role === USER_CAPABILITIES.MENTEE
                ? "No recommended coaches available at the moment. Please check back later!"
                : "No other recommended coaches available at the moment. Please check back later!"}
            </p>
          )}
        </CardContent>
      </Card>

      {selectedCoach && (
        <CoachProfileModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          coach={{
            id: selectedCoach.id,
            userId: selectedCoach.id.toString(),
            name: `${selectedCoach.firstName} ${selectedCoach.lastName}`,
            imageUrl: selectedCoach.profileImageUrl,
            specialty: selectedCoach.specialties?.[0] || 'General Coach',
            bio: selectedCoach.bio,
            experience: null,
            certifications: [],
            availability: "Available",
            sessionLength: "60 minutes",
            specialties: selectedCoach.specialties || [],
            calendlyUrl: null,
            eventTypeUrl: null,
            sessionConfig: getSessionConfig(selectedCoach)
          }}
        />
      )}
    </div>
  );
} 