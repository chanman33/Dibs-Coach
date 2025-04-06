'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { FilterSidebar, SearchBar } from '@/components/coaching/shared/SearchAndFilter'
import { PrivateCoachCard } from '../shared/CoachCard/PrivateCard'
import { Categories } from '../shared/Categories'
import { useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CoachProfileModal } from '@/components/profile/common/CoachProfileModal'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { useBrowseCoaches } from '@/utils/hooks/useBrowseCoaches'
import { BrowseCoachData } from '@/utils/types/browse-coaches'
import { CoachFilters } from '@/components/coaching/shared/SearchAndFilter/types'
import { useRouter } from 'next/navigation'

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
  const [filters, setFilters] = useState<CoachFilters>({});
  const router = useRouter();

  const handleCoachClick = (coach: BrowseCoachData) => {
    try {
      // Get the current path
      const currentPath = window.location.pathname;
      
      // Log for debugging with detailed context
      console.log('[COACH_NAVIGATION]', {
        action: 'view_profile',
        from: currentPath,
        to: `/profile/${coach.profileSlug || coach.ulid}`,
        coachId: coach.ulid,
        coachName: `${coach.firstName} ${coach.lastName}`,
        role,
        timestamp: new Date().toISOString()
      });
      
      // Navigate to the coach profile page with the current path as a query parameter
      const profilePath = coach.profileSlug || coach.ulid;
      router.push(`/profile/${profilePath}?from=${encodeURIComponent(currentPath)}`);
    } catch (error) {
      // Log the error with detailed context
      console.error('[COACH_NAVIGATION_ERROR]', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        coachId: coach.ulid,
        role,
        timestamp: new Date().toISOString()
      });
      
      // Navigate anyway even if there's an error
      const profilePath = coach.profileSlug || coach.ulid;
      router.push(`/profile/${profilePath}`);
    }
  };

  const handleFiltersChange = (newFilters: CoachFilters) => {
    setFilters(newFilters);
    if (newFilters.domain?.length) {
      handleFilter(newFilters.domain[0]);
    }
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {coaches.map(coach => (
        <PrivateCoachCard
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
          certifications={[]}
          availability={coach.isActive ? "Available" : "Unavailable"}
          sessionLength={`${coach.defaultDuration} minutes`}
          coachSkills={coach.coachSkills || []}
          coachRealEstateDomains={coach.coachRealEstateDomains || []}
          coachPrimaryDomain={coach.coachPrimaryDomain}
          isBooked={isBooked}
          onProfileClick={() => handleCoachClick(coach)}
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
        />
      ))}
    </div>
  );

  // Helper function to get top recommended coaches
  const getTopRecommendedCoaches = (coaches: BrowseCoachData[], count: number = 10): BrowseCoachData[] => {
    // Filter out coaches that are already booked
    const availableCoaches = coaches.filter(coach => 
      !filteredBookedCoaches.some(booked => booked.ulid === coach.ulid) &&
      coach.coachSkills && 
      coach.coachSkills.length > 0
    );
    
    // Sort by a combination of factors to get the best recommendations
    return availableCoaches
      .sort((a, b) => {
        // First prioritize by rating
        const ratingDiff = (b.averageRating || 0) - (a.averageRating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        
        // Then by experience
        const experienceDiff = (b.yearsCoaching || 0) - (a.yearsCoaching || 0);
        if (experienceDiff !== 0) return experienceDiff;
        
        // Then by total sessions
        return (b.totalSessions || 0) - (a.totalSessions || 0);
      })
      .slice(0, count);
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Your Coaches Section */}
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

      {/* Global Search Bar */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <h2 className="text-lg font-semibold">Search Coaches</h2>
        </CardHeader>
        <CardContent className="pt-4">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search coaches by name, specialty, or expertise..."
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with Filters and Categories */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <h2 className="text-lg font-semibold">Filters</h2>
            </CardHeader>
            <CardContent className="pt-4">
              <FilterSidebar
                onFiltersChange={handleFiltersChange}
                domains={allSpecialties.map(specialty => ({
                  label: specialty,
                  value: specialty
                }))}
              />
            </CardContent>
          </Card>

          <Categories onCategoryClick={(category) => handleFilter(category)} />
        </div>
        
        {/* Main Content Area */}
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
                      specialty: coach.coachSkills?.[0] || 'General Coach'
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

      {/* Recommended Coaches Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <h2 className="text-2xl font-bold tracking-tight">Recommended Coaches</h2>
          {role === USER_CAPABILITIES.COACH && (
            <p className="text-xs text-muted-foreground">
              Note: Only coaches with published profiles are visible to mentees.
            </p>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredRecommendedCoaches.length > 0 ? (
            renderCoaches(getTopRecommendedCoaches(filteredRecommendedCoaches))
          ) : (
            <p className="text-center text-muted-foreground py-12">
              No recommended coaches available at the moment.
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
            specialty: selectedCoach.coachSkills?.[0] || 'General Coach',
            bio: selectedCoach.bio || '',
            experience: selectedCoach.yearsCoaching 
              ? `${selectedCoach.yearsCoaching} years of coaching experience` 
              : null,
            certifications: [],
            availability: selectedCoach.isActive ? "Available" : "Unavailable",
            sessionLength: `${selectedCoach.defaultDuration} minutes`,
            coachSkills: selectedCoach.coachSkills || [],
            coachRealEstateDomains: selectedCoach.coachRealEstateDomains || [],
            coachPrimaryDomain: selectedCoach.coachPrimaryDomain,
            profileSlug: selectedCoach.profileSlug,
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