'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { FilterSidebar, SearchBar } from '@/components/coaching/shared/SearchAndFilter'
import { PublicCoachCard } from '../shared/CoachCard/PublicCard'
import { Categories } from '../shared/Categories'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePublicCoaches } from '@/utils/hooks/usePublicCoaches'
import { CoachFilters } from '@/components/coaching/shared/SearchAndFilter/types'
import { RealEstateDomain } from '@/utils/types/coach'
import Link from 'next/link'

const COACHES_PER_PAGE = 12

export interface BrowseCoachesProps {
  showFeatured?: boolean;
}

export function BrowseCoaches({ showFeatured = true }: BrowseCoachesProps) {
  const { coaches, isLoading, error } = usePublicCoaches()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<CoachFilters>({})
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  // Reset to first page when filters or search change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filters])

  // Handle error state
  if (error) {
    console.error('[BROWSE_COACHES_ERROR]', { error, timestamp: new Date().toISOString() });
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Safely access coaches array
  const safeCoaches = Array.isArray(coaches) ? coaches : [];
  
  // Get all unique skills as strings
  const allSkills = Array.from(
    new Set(
      safeCoaches.flatMap(coach => 
        Array.isArray(coach.coachSkills) ? coach.coachSkills : []
      )
    )
  );

  // Filter coaches based on search and filters
  const filteredCoaches = safeCoaches.filter(coach => {
    const skills = Array.isArray(coach.coachSkills) ? coach.coachSkills : [];
    const realEstateDomains = Array.isArray(coach.coachRealEstateDomains) ? coach.coachRealEstateDomains : [];
    
    // Search query filter
    const matchesSearch = searchQuery === '' || 
      `${coach.firstName || ''} ${coach.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (coach.bio || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    // Industry/domain filter for skills
    const matchesDomain = !filters.domain?.length || 
      filters.domain.some(d => skills.includes(d));
      
    // Real estate domain filter
    const matchesRealEstateDomain = !filters.realEstateDomain?.length || 
      filters.realEstateDomain.some(d => 
        realEstateDomains.includes(d as RealEstateDomain) || 
        coach.coachPrimaryDomain === d
      );

    // Price range filter
    const matchesPrice = !filters.priceRange || 
      ((coach.hourlyRate ?? 0) >= filters.priceRange.min && (coach.hourlyRate ?? 0) <= filters.priceRange.max);

    // Rating filter
    const matchesRating = !filters.rating || 
      (coach.averageRating || 0) >= filters.rating;

    return matchesSearch && (matchesDomain || matchesRealEstateDomain) && matchesPrice && matchesRating;
  });

  // Featured coaches are the top 3 rated active coaches
  const featuredCoaches = [...filteredCoaches]
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 3);

  // Pagination
  const totalPages = Math.ceil(filteredCoaches.length / COACHES_PER_PAGE);
  const startIndex = (currentPage - 1) * COACHES_PER_PAGE;
  const paginatedCoaches = filteredCoaches.slice(startIndex, startIndex + COACHES_PER_PAGE);

  // Loading state component
  const LoadingState = () => (
    <div className="flex justify-center items-center h-48">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );

  // Empty state component
  const EmptyState = ({ message }: { message: string }) => (
    <p className="text-center text-muted-foreground py-12">
      {message}
    </p>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {showFeatured && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <h2 className="text-2xl font-bold tracking-tight">Featured Coaches</h2>
            <p className="text-sm text-muted-foreground">Top rated coaches ready to help you succeed</p>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <LoadingState />
            ) : featuredCoaches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {featuredCoaches
                  .map((coach) => (
                    <PublicCoachCard
                      key={coach.ulid}
                      id={coach.ulid}
                      name={`${coach.firstName || ''} ${coach.lastName || ''}`}
                      imageUrl={coach.profileImageUrl || ''}
                      specialty={coach.coachSkills && coach.coachSkills.length > 0 ? coach.coachSkills[0] : 'General Coach'}
                      bio={coach.bio || ''}
                      coachSkills={coach.coachSkills || []}
                      coachRealEstateDomains={coach.coachRealEstateDomains || []}
                      coachPrimaryDomain={coach.coachPrimaryDomain}
                      rating={coach.averageRating ?? undefined}
                      reviewCount={coach.totalSessions}
                      hourlyRate={coach.hourlyRate}
                      profileSlug={coach.profileSlug}
                    />
                  ))}
              </div>
            ) : (
              <EmptyState message="No featured coaches available at the moment." />
            )}
          </CardContent>
        </Card>
      )}

      {/* Global Search Bar */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <h2 className="text-lg font-semibold">Search Coaches</h2>
        </CardHeader>
        <CardContent className="pt-4">
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Search coaches by name, specialty, or expertise..."
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Mobile Filters Toggle */}
      <div className="lg:hidden">
        <Button 
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)} 
          variant="outline" 
          className="w-full"
        >
          {isMobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-24rem)]">
        {/* Filters - Hidden on mobile unless toggled */}
        <div className={`${isMobileFiltersOpen ? 'block' : 'hidden'} lg:block lg:col-span-1 space-y-6`}>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <h2 className="text-lg font-semibold">Filters</h2>
            </CardHeader>
            <CardContent className="pt-4">
              <FilterSidebar
                onFiltersChange={setFilters}
                domains={allSkills.map(skill => ({
                  label: skill,
                  value: skill
                }))}
              />
            </CardContent>
          </Card>

          <Categories onCategoryClick={(category) => {
            setFilters(prev => ({
              ...prev,
              domain: [category]
            }))
          }} />
        </div>

        {/* All Coaches */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="shadow-sm flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <h2 className="text-2xl font-bold tracking-tight">All Coaches</h2>
              <p className="text-sm text-muted-foreground">
                {filteredCoaches.length} {filteredCoaches.length === 1 ? 'coach' : 'coaches'} available
              </p>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col">
              {isLoading ? (
                <LoadingState />
              ) : paginatedCoaches.length > 0 ? (
                <div className="flex flex-col flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
                    {paginatedCoaches.map(coach => (
                      <PublicCoachCard
                        key={coach.ulid}
                        id={coach.ulid}
                        name={`${coach.firstName || ''} ${coach.lastName || ''}`}
                        imageUrl={coach.profileImageUrl || ''}
                        specialty={coach.coachSkills && coach.coachSkills.length > 0 ? coach.coachSkills[0] : 'General Coach'}
                        bio={coach.bio || ''}
                        coachSkills={coach.coachSkills || []}
                        coachRealEstateDomains={coach.coachRealEstateDomains || []}
                        coachPrimaryDomain={coach.coachPrimaryDomain}
                        rating={coach.averageRating ?? undefined}
                        reviewCount={coach.totalSessions}
                        hourlyRate={coach.hourlyRate}
                        profileSlug={coach.profileSlug}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-sm">
                        Page {currentPage} of {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState message="No coaches found matching your criteria." />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 