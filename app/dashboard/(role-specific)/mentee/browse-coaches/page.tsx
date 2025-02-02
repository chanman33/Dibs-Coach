'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { Coach } from '@/components/dashboard/Coach'
import { SearchAndFilter } from '@/components/SearchAndFilter'
import { CoachProfileModal } from '@/components/dashboard/CoachProfileModal'
import { fetchCoaches } from '@/app/api/user/coach/route'

interface CoachData {
  id: number
  userId: string
  name: string
  strength: string
  imageUrl: string | null
  bio: string | null
  experience: string | null
  certifications: string[] | null
  availability: string | null
  sessionLength: string | null
  specialties: string[]
  calendlyUrl: string | null
  eventTypeUrl: string | null
  rate: number | null
}

interface RealtorCoachProfile {
  specialty: string
  bio: string
  experience: string
  certifications: string[]
  availability: string
  sessionLength: string
  specialties: string
  calendlyUrl: string
  eventTypeUrl: string
  hourlyRate: number
}

interface UserWithProfile {
  id: number
  firstName: string
  lastName: string
  RealtorCoachProfile: RealtorCoachProfile
}

export default function CoachesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [bookedCoaches, setBookedCoaches] = useState<CoachData[]>([])
  const [recommendedCoaches, setRecommendedCoaches] = useState<CoachData[]>([])
  const [filteredBookedCoaches, setFilteredBookedCoaches] = useState<CoachData[]>([])
  const [filteredRecommendedCoaches, setFilteredRecommendedCoaches] = useState<CoachData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('all')
  const [selectedCoach, setSelectedCoach] = useState<CoachData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const getCoaches = async () => {
      try {
        console.log('[DEBUG] Fetching coaches...')
        const { data: coachesData, error } = await fetchCoaches()
        
        if (error) {
          console.error('[FETCH_COACHES_ERROR]', error)
          throw error
        }

        console.log('[DEBUG] Raw coaches data:', coachesData)

        if (coachesData) {
          const formattedCoaches: CoachData[] = coachesData.map(coach => {
            console.log('[DEBUG] Processing coach:', coach.id, {
              firstName: coach.firstName,
              lastName: coach.lastName,
              profile: coach.RealtorCoachProfile
            })

            // Get the profile data (it comes as an array with one item)
            const profile = Array.isArray(coach.RealtorCoachProfile) 
              ? coach.RealtorCoachProfile[0] 
              : coach.RealtorCoachProfile

            const formattedCoach = {
              id: coach.id,
              userId: coach.userId,
              name: `${coach.firstName || ''} ${coach.lastName || ''}`.trim(),
              strength: profile?.specialty || 'General Coach',
              imageUrl: coach.profileImageUrl,
              bio: profile?.bio,
              experience: profile?.experience,
              certifications: profile?.certifications || [],
              availability: profile?.availability,
              sessionLength: profile?.sessionLength,
              specialties: profile?.specialties ? JSON.parse(profile.specialties) : [],
              calendlyUrl: profile?.calendlyUrl,
              eventTypeUrl: profile?.eventTypeUrl,
              rate: profile?.hourlyRate ? parseFloat(profile.hourlyRate.toString()) : null
            }

            console.log('[DEBUG] Formatted coach data:', formattedCoach)
            return formattedCoach
          })

          console.log('[DEBUG] All formatted coaches:', formattedCoaches)

          setBookedCoaches(formattedCoaches.slice(0, 2))
          setRecommendedCoaches(formattedCoaches.slice(2))
          setFilteredBookedCoaches(formattedCoaches.slice(0, 2))
          setFilteredRecommendedCoaches(formattedCoaches.slice(2))
        }
      } catch (error) {
        console.error('[FETCH_COACHES_ERROR]', error)
      } finally {
        setIsLoading(false)
      }
    }

    getCoaches()
  }, [])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    filterCoaches(term, selectedSpecialty)
  }

  const handleFilter = (specialty: string) => {
    setSelectedSpecialty(specialty)
    filterCoaches(searchTerm, specialty)
  }

  const filterCoaches = (term: string, specialty: string) => {
    const filterFunction = (coach: CoachData) =>
      (coach.name.toLowerCase().includes(term.toLowerCase()) ||
       coach.strength.toLowerCase().includes(term.toLowerCase())) &&
      (specialty === 'all' || coach.strength === specialty)

    setFilteredBookedCoaches(bookedCoaches.filter(filterFunction))
    setFilteredRecommendedCoaches(recommendedCoaches.filter(filterFunction))
  }

  const handleCoachClick = (coach: CoachData) => {
    setSelectedCoach(coach)
    setIsModalOpen(true)
  }

  const allSpecialties = Array.from(new Set([...bookedCoaches, ...recommendedCoaches].map(coach => coach.strength)))

  const renderCoaches = (coaches: CoachData[], isBooked: boolean = false) => (
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
  )

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
            <p className="text-center text-muted-foreground py-12">No matching coaches found.</p>
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
            <p className="text-center text-muted-foreground py-12">No matching coaches found.</p>
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
            eventTypeUrl: selectedCoach.eventTypeUrl
          }}
        />
      )}
    </div>
  )
}

