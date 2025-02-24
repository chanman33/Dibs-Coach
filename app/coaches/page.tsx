'use client'

import { CoachesHero } from '@/components/coaching/public/CoachesHero'
import { usePublicCoaches } from '@/utils/hooks/usePublicCoaches'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PublicCoachCard } from '@/components/coaching/shared/CoachCard/PublicCard'
import { SearchAndFilter } from '@/components/coaching/shared/SearchAndFilter'
import { Categories } from '@/components/coaching/shared/Categories'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PublicCoach } from '@/utils/types/coach'

const COACHES_PER_PAGE = 6

export default function CoachesPage() {
  const { coaches, isLoading, error } = usePublicCoaches()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])

  if (error) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const allSpecialties = Array.from(
    new Set(coaches?.flatMap(coach => coach.coachingSpecialties) || [])
  )

  const filteredCoaches = coaches?.filter(coach => {
    const matchesSearch = searchQuery === '' || 
      `${coach.firstName || ''} ${coach.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (coach.bio || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.coachingSpecialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSpecialties = selectedSpecialties.length === 0 ||
      selectedSpecialties.some(s => coach.coachingSpecialties.includes(s))

    return matchesSearch && matchesSpecialties
  }) || []

  // Featured coaches are the top 3 rated active coaches
  const featuredCoaches = [...(filteredCoaches || [])]
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 3)

  // Pagination
  const totalPages = Math.ceil(filteredCoaches.length / COACHES_PER_PAGE)
  const startIndex = (currentPage - 1) * COACHES_PER_PAGE
  const paginatedCoaches = filteredCoaches.slice(startIndex, startIndex + COACHES_PER_PAGE)

  return (
    <div className="min-h-screen bg-background">
      <CoachesHero />
      
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Featured Coaches Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <h2 className="text-2xl font-bold tracking-tight">Featured Coaches</h2>
            <p className="text-sm text-muted-foreground">Top rated coaches ready to help you succeed</p>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="h-8 w-8 animate-spin border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : featuredCoaches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredCoaches.map(coach => (
                  <PublicCoachCard
                    key={coach.ulid}
                    id={coach.ulid}
                    name={`${coach.firstName || ''} ${coach.lastName || ''}`}
                    imageUrl={coach.profileImageUrl || ''}
                    specialty={coach.coachingSpecialties[0] || 'General Coach'}
                    bio={coach.bio || ''}
                    specialties={coach.coachingSpecialties}
                    rating={coach.averageRating ?? undefined}
                    reviewCount={coach.totalSessions}
                    hourlyRate={coach.hourlyRate}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">
                No featured coaches available at the moment.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-24rem)]">
          {/* Filters */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <h2 className="text-lg font-semibold">Search & Filters</h2>
              </CardHeader>
              <CardContent className="pt-4">
                <SearchAndFilter
                  onSearch={setSearchQuery}
                  onFilter={setSelectedSpecialties}
                  specialties={allSpecialties}
                  vertical={true}
                  variant="public"
                />
              </CardContent>
            </Card>

            <Categories onCategoryClick={(category) => {
              setSelectedSpecialties([category])
              setCurrentPage(1)
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
                  <div className="flex justify-center items-center h-48">
                    <div className="h-8 w-8 animate-spin border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : paginatedCoaches.length > 0 ? (
                  <div className="flex flex-col flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
                      {paginatedCoaches.map(coach => (
                        <PublicCoachCard
                          key={coach.ulid}
                          id={coach.ulid}
                          name={`${coach.firstName || ''} ${coach.lastName || ''}`}
                          imageUrl={coach.profileImageUrl || ''}
                          specialty={coach.coachingSpecialties[0] || 'General Coach'}
                          bio={coach.bio || ''}
                          specialties={coach.coachingSpecialties}
                          rating={coach.averageRating ?? undefined}
                          reviewCount={coach.totalSessions}
                          hourlyRate={coach.hourlyRate}
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
                  <p className="text-center text-muted-foreground py-12">
                    No coaches found matching your criteria.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

