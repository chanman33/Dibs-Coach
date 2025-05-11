'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { FilterSidebar, SearchBar } from '@/components/coaching/shared/SearchAndFilter'
import { CoachCard } from '../shared/CoachCard'
import { Categories } from '../shared/Categories'
import { useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CoachProfileModal } from '@/components/coach-profile/CoachProfileModal'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { useBrowseCoaches } from '@/utils/hooks/useBrowseCoaches'
import { BrowseCoachData } from '@/utils/types/browse-coaches'
import { CoachFilters } from '@/components/coaching/shared/SearchAndFilter/types'
import { useRouter, useSearchParams } from 'next/navigation'
import { COACH_SPECIALTIES, SpecialtyCategory } from '@/utils/types/coach'
import { RecommendedCoaches } from '../shared/RecommendedCoaches'

// Define focus area to skill category mappings
const FOCUS_TO_CATEGORIES: Record<string, SpecialtyCategory[]> = {
  'sales': ['BUSINESS_DEVELOPMENT'],
  'marketing': ['MARKET_INNOVATION', 'SOCIAL_MEDIA'],
  'investing': ['INVESTOR', 'ECONOMIC_MASTERY']
};

export interface BrowseCoachesProps {
  role: keyof typeof USER_CAPABILITIES;
  isSignedIn: boolean;
}

export function BrowseCoaches({ role, isSignedIn }: BrowseCoachesProps) {
  const {
    isLoading,
    error,
    filteredBookedCoaches,
    recommendedCoaches,
    allSpecialties,
    handleSearch,
  } = useBrowseCoaches({ role, isSignedIn });

  const searchParams = useSearchParams();
  const focusParam = searchParams.get('focus');
  
  const [selectedCoach, setSelectedCoach] = useState<BrowseCoachData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<CoachFilters>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const router = useRouter();

  // Set initial filters based on focus parameter
  useEffect(() => {
    if (focusParam && FOCUS_TO_CATEGORIES[focusParam]) {
      setFilters(prev => ({
        ...prev,
        skillCategories: FOCUS_TO_CATEGORIES[focusParam]
      }));
    }
  }, [focusParam]);

  // Filtering logic for coaches
  const filterCoaches = (coaches: BrowseCoachData[]) => {
    return coaches.filter(coach => {
      // Search query filter
      const searchMatch = !searchQuery 
        ? true 
        : [
            coach.firstName,
            coach.lastName, 
            ...(coach.coachSkills || [])
          ].some(field => 
            field?.toLowerCase().includes(searchQuery.toLowerCase())
          );

      // Real Estate Domain filter
      const domainMatch = !filters.realEstateDomain || filters.realEstateDomain.length === 0
        ? true
        : filters.realEstateDomain.some(domain => coach.coachRealEstateDomains?.includes(domain));

      // Skill Categories filter - matches coaches who have ANY skill from the selected categories
      // This allows users to filter coaches by broader skill areas rather than specific skills
      const skillCategoriesMatch = !filters.skillCategories || filters.skillCategories.length === 0
        ? true
        : filters.skillCategories.some(category => 
            COACH_SPECIALTIES[category]?.some((skill: string) => coach.coachSkills?.includes(skill))
          );

      // Individual Coach Skills filter (keeping for backward compatibility)
      const skillsMatch = !filters.coachSkills || filters.coachSkills.length === 0
        ? true
        : filters.coachSkills.some(skill => coach.coachSkills?.includes(skill));

      // Price Range filter
      const priceMatch = !filters.priceRange
        ? true
        : (coach.hourlyRate ?? 0) >= (filters.priceRange.min ?? 0) && (coach.hourlyRate ?? 0) <= (filters.priceRange.max ?? Infinity);

      // Rating filter
      const ratingMatch = !filters.rating
        ? true
        : (coach.averageRating ?? 0) >= filters.rating;

      return searchMatch && domainMatch && skillCategoriesMatch && skillsMatch && priceMatch && ratingMatch;
    });
  };

  const filteredRecommendedCoaches = filterCoaches(recommendedCoaches || []);
  const filteredBookedCoachesList = filterCoaches(filteredBookedCoaches || []);

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
  };

  const handleLocalSearch = (query: string) => {
    setSearchQuery(query);
    handleSearch(query); // Also call API search if needed
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

  const renderCoaches = (coaches: BrowseCoachData[]) => (
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
          isBooked={false}
          onProfileClick={() => handleCoachClick(coach)}
          sessionConfig={{
            durations: [
              coach.minimumDuration,
              coach.defaultDuration,
              coach.maximumDuration
            ].filter(Boolean),
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
          showBookButton={true}
        />
      ))}
    </div>
  );

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <h2 className="text-lg font-semibold">Search Coaches</h2>
        </CardHeader>
        <CardContent className="pt-4">
          <SearchBar 
            onSearch={handleLocalSearch} 
            placeholder="Search coaches by name, specialty, or expertise..." 
            initialQuery={searchQuery}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <h2 className="text-lg font-semibold">Filters</h2>
            </CardHeader>
            <CardContent className="pt-4">
              <FilterSidebar
                onFiltersChange={handleFiltersChange}
                initialFilters={filters}
                domains={allSpecialties.map(specialty => ({
                  label: specialty,
                  value: specialty
                }))}
              />
            </CardContent>
          </Card>

          {/* Categories component has been replaced by the coachSkills filter in FilterSidebar and can be removed */}
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
                      !filteredBookedCoachesList.some(booked => booked.ulid === coach.ulid)
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

      <RecommendedCoaches 
        recommendedCoaches={recommendedCoaches || []}
        isLoading={isLoading}
        onCoachClick={handleCoachClick}
      />

      {selectedCoach && (
        <CoachProfileModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          coach={{
            ulid: selectedCoach.ulid,
            userUlid: selectedCoach.ulid,
            firstName: selectedCoach.firstName,
            lastName: selectedCoach.lastName,
            profileImageUrl: selectedCoach.profileImageUrl || '',
            bio: selectedCoach.bio || '',
            coachSkills: selectedCoach.coachSkills || [],
            coachRealEstateDomains: selectedCoach.coachRealEstateDomains || [],
            coachPrimaryDomain: selectedCoach.coachPrimaryDomain,
            profileSlug: selectedCoach.profileSlug,
            hourlyRate: selectedCoach.hourlyRate || undefined,
            yearsCoaching: selectedCoach.yearsCoaching || undefined,
            totalSessions: selectedCoach.totalSessions || undefined,
            averageRating: selectedCoach.averageRating || undefined,
            sessionConfig: {
              defaultDuration: selectedCoach.defaultDuration,
              minimumDuration: selectedCoach.minimumDuration,
              maximumDuration: selectedCoach.maximumDuration,
              allowCustomDuration: selectedCoach.allowCustomDuration
            }
          }}
        />
      )}
    </div>
  );
} 