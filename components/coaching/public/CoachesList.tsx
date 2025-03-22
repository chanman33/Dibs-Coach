'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SearchAndFilter } from '../shared/SearchAndFilter'
import { PublicCoachCard } from '../shared/CoachCard/PublicCard'
import { Categories } from '../shared/Categories'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  specialties: string[];
  bio: string;
  rating?: number;
  reviewCount?: number;
}

interface CoachesListProps {
  coaches: Coach[];
  isLoading?: boolean;
}

export function CoachesList({ coaches, isLoading }: CoachesListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])

  const allSpecialties = Array.from(
    new Set(coaches.flatMap(coach => coach.specialties))
  )

  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = searchQuery === '' || 
      `${coach.firstName} ${coach.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSpecialties = selectedSpecialties.length === 0 ||
      selectedSpecialties.some(s => coach.specialties.includes(s))

    return matchesSearch && matchesSpecialties
  })

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Search & Filters</h2>
            </CardHeader>
            <CardContent>
              <SearchAndFilter
                onSearch={setSearchQuery}
                onFilter={setSelectedSpecialties}
                specialties={allSpecialties}
                vertical={true}
                variant="public"
              />
            </CardContent>
          </Card>

          <Categories />
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold tracking-tight">Featured Coaches</h2>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredCoaches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredCoaches
                    .slice(0, 3)
                    .map(coach => (
                      <PublicCoachCard
                        key={coach.id}
                        id={coach.id}
                        name={`${coach.firstName} ${coach.lastName}`}
                        imageUrl={coach.profileImageUrl}
                        specialty={coach.specialties[0] || 'General Coach'}
                        bio={coach.bio}
                        coachSkills={coach.specialties}
                        rating={coach.rating}
                        reviewCount={coach.reviewCount}
                      />
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  No coaches found matching your search criteria.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 