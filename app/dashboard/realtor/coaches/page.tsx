'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { Coach } from '@/components/Coach'
import { SearchAndFilter } from '@/components/SearchAndFilter'
import { CoachProfileModal } from '@/components/CoachProfileModal'

interface CoachData {
  id: string
  name: string
  specialty: string
  imageUrl: string
  rating: number
  reviewCount: number
  bio: string
  experience: string
  certifications: string[]
  availability: string
  sessionLength: string
  specialties: string[]
  calendlyUrl: string
  eventTypeUrl: string
  rate: number
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
    // Simulating API call to fetch coaches data
    const fetchCoaches = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate network delay
      
      // Mock data
      const mockCoaches: CoachData[] = [
        {
          id: '1',
          name: 'John Doe',
          specialty: 'Sales Strategy',
          imageUrl: '/placeholder.svg?height=200&width=200',
          rating: 4.8,
          reviewCount: 124,
          bio: 'Expert in real estate sales strategies with over 15 years of experience.',
          experience: '15 years',
          certifications: ['Certified Real Estate Coach', 'Sales Performance Specialist'],
          availability: 'Mon-Fri, 9AM-5PM',
          sessionLength: '60 minutes',
          specialties: ['Negotiation', 'Lead Generation', 'Client Retention'],
          calendlyUrl: 'https://calendly.com/john-doe',
          eventTypeUrl: 'https://calendly.com/john-doe/30min',
          rate: 150
        },
        {
          id: '2',
          name: 'Jane Smith',
          specialty: 'Marketing for Realtors',
          imageUrl: '/placeholder.svg?height=200&width=200',
          rating: 4.6,
          reviewCount: 98,
          bio: 'Digital marketing guru specializing in real estate lead generation.',
          experience: '10 years',
          certifications: ['Digital Marketing Certified', 'Real Estate Marketing Specialist'],
          availability: 'Tue-Sat, 10AM-6PM',
          sessionLength: '45 minutes',
          specialties: ['Social Media Marketing', 'Content Strategy', 'SEO for Realtors'],
          calendlyUrl: 'https://calendly.com/jane-smith',
          eventTypeUrl: '/event-type-2',
          rate: 80
        },
        {
          id: '3',
          name: 'Bob Johnson',
          specialty: 'Real Estate Leadership',
          imageUrl: '/placeholder.svg?height=200&width=200',
          rating: 4.9,
          reviewCount: 156,
          bio: 'Former real estate agency owner, now coaching the next generation of leaders.',
          experience: '20 years',
          certifications: ['Certified Leadership Coach', 'Real Estate Broker'],
          availability: 'Mon-Thu, 8AM-4PM',
          sessionLength: '90 minutes',
          specialties: ['Team Building', 'Business Strategy', 'Performance Management'],
          calendlyUrl: 'https://calendly.com/bob-johnson',
          eventTypeUrl: '/event-type-3',
          rate: 120
        },
        {
          id: '4',
          name: 'Alice Brown',
          specialty: 'Negotiation Skills',
          imageUrl: '/placeholder.svg?height=200&width=200',
          rating: 4.7,
          reviewCount: 112,
          bio: 'Master negotiator with a track record of closing high-value real estate deals.',
          experience: '12 years',
          certifications: ['Certified Negotiation Expert', 'Real Estate Negotiation Specialist'],
          availability: 'Wed-Sun, 11AM-7PM',
          sessionLength: '60 minutes',
          specialties: ['Deal Structuring', 'Conflict Resolution', 'Value-based Selling'],
          calendlyUrl: 'https://calendly.com/alice-brown',
          eventTypeUrl: '/event-type-4',
          rate: 90
        },
        {
          id: '5',
          name: 'Sarah Chen',
          specialty: 'Digital Marketing',
          imageUrl: '/placeholder.svg?height=200&width=200',
          rating: 4.8,
          reviewCount: 143,
          bio: 'Tech-savvy marketing expert helping realtors build their digital presence.',
          experience: '8 years',
          certifications: ['Digital Marketing Master', 'Social Media Marketing Expert'],
          availability: 'Mon-Fri, 10AM-6PM',
          sessionLength: '45 minutes',
          specialties: ['Digital Advertising', 'Email Marketing', 'Personal Branding'],
          calendlyUrl: 'https://calendly.com/sarah-chen',
          eventTypeUrl: '/event-type-5',
          rate: 100
        },
        {
          id: '6',
          name: 'Michael Torres',
          specialty: 'Luxury Real Estate',
          imageUrl: '/placeholder.svg?height=200&width=200',
          rating: 4.9,
          reviewCount: 167,
          bio: 'Luxury market specialist with expertise in high-end client relationships.',
          experience: '18 years',
          certifications: ['Luxury Marketing Specialist', 'High-Net-Worth Client Expert'],
          availability: 'Tue-Sat, 9AM-7PM',
          sessionLength: '75 minutes',
          specialties: ['Luxury Marketing', 'High-End Client Service', 'Market Analysis'],
          calendlyUrl: 'https://calendly.com/michael-torres',
          eventTypeUrl: '/event-type-6',
          rate: 150
        },
        {
          id: '7',
          name: 'Rachel Foster',
          specialty: 'Business Development',
          imageUrl: '/placeholder.svg?height=200&width=200',
          rating: 4.7,
          reviewCount: 132,
          bio: 'Strategic business coach focused on scaling real estate practices.',
          experience: '14 years',
          certifications: ['Business Development Specialist', 'Growth Strategy Expert'],
          availability: 'Mon-Thu, 8AM-6PM',
          sessionLength: '60 minutes',
          specialties: ['Business Planning', 'Revenue Growth', 'Team Scaling'],
          calendlyUrl: 'https://calendly.com/rachel-foster',
          eventTypeUrl: '/event-type-7',
          rate: 100
        },
        {
          id: '8',
          name: 'David Kim',
          specialty: 'Technology Integration',
          imageUrl: '/placeholder.svg?height=200&width=200',
          rating: 4.6,
          reviewCount: 89,
          bio: 'PropTech expert helping realtors leverage the latest technology tools.',
          experience: '9 years',
          certifications: ['PropTech Specialist', 'Real Estate Technology Advisor'],
          availability: 'Wed-Sun, 9AM-5PM',
          sessionLength: '60 minutes',
          specialties: ['CRM Implementation', 'Automation Tools', 'Virtual Tours'],
          calendlyUrl: 'https://calendly.com/david-kim',
          eventTypeUrl: '/event-type-8',
          rate: 80
        }
      ]

      setBookedCoaches(mockCoaches.slice(0, 2))
      setRecommendedCoaches(mockCoaches.slice(2))
      setFilteredBookedCoaches(mockCoaches.slice(0, 2))
      setFilteredRecommendedCoaches(mockCoaches.slice(2))
      setIsLoading(false)
    }

    fetchCoaches()
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
       coach.specialty.toLowerCase().includes(term.toLowerCase())) &&
      (specialty === 'all' || coach.specialty === specialty)

    setFilteredBookedCoaches(bookedCoaches.filter(filterFunction))
    setFilteredRecommendedCoaches(recommendedCoaches.filter(filterFunction))
  }

  const handleCoachClick = (coach: CoachData) => {
    setSelectedCoach(coach)
    setIsModalOpen(true)
  }

  const allSpecialties = Array.from(new Set([...bookedCoaches, ...recommendedCoaches].map(coach => coach.specialty)))

  const renderCoaches = (coaches: CoachData[], isBooked: boolean = false) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {coaches.map(coach => (
        <Coach
          key={coach.id}
          {...coach}
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
          coach={selectedCoach}
        />
      )}
    </div>
  )
}

