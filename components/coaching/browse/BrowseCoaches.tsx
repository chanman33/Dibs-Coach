'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2, AlertCircle } from 'lucide-react'
import { Coach } from '@/components/dashboard/Coach'
import { SearchAndFilter } from '@/components/SearchAndFilter'
import { CoachProfileModal } from '@/components/dashboard/CoachProfileModal'
import { useBrowseCoaches } from '@/utils/hooks/useBrowseCoaches'
import { BrowseCoachData, SessionConfig } from '@/utils/types/browse-coaches'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ROLES } from '@/utils/roles/roles'


export interface BrowseCoachProps {
  role: keyof typeof ROLES;
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

  const renderCoaches = (coaches: BrowseCoachData[], isBooked: boolean = false) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {coaches.map(coach => (
        <Coach
          key={coach.id}
          {...coach}
          specialty={coach.strength}
          isBooked={isBooked}
          onProfileClick={() => handleCoachClick(coach)}
        />
      ))}
    </div>
  );

  const getSessionConfig = (coach: BrowseCoachData): SessionConfig => ({
    durations: [30, 60, 90],
    rates: {
      '30': coach.rate || 0,
      '60': (coach.rate || 0) * 2,
      '90': (coach.rate || 0) * 3
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
      <SearchAndFilter
        onSearch={handleSearch}
        onFilter={handleFilter}
        specialties={allSpecialties}
      />

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
              {role === ROLES.MENTEE 
                ? "You haven't booked any coaches yet. Browse our recommended coaches below!"
                : "You haven't connected with any other coaches yet. Browse our recommended coaches below!"}
            </p>
          )}
        </CardContent>
      </Card>

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
            renderCoaches(filteredRecommendedCoaches)
          ) : (
            <p className="text-center text-muted-foreground py-12">
              {role === ROLES.MENTEE
                ? "No coaches available at the moment. Please check back later!"
                : "No other coaches available at the moment. Please check back later!"}
            </p>

          )}
        </CardContent>
      </Card>

      {selectedCoach && (
        <CoachProfileModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          coach={{
            ...selectedCoach,
            specialty: selectedCoach.strength,
            calendlyUrl: selectedCoach.calendlyUrl,
            eventTypeUrl: selectedCoach.eventTypeUrl,
            sessionConfig: getSessionConfig(selectedCoach)
          }}
        />
      )}
    </div>
  );
} 