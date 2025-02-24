'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PublicCoachCard } from '@/components/coaching/shared/CoachCard/PublicCard'
import { usePublicCoaches } from '@/utils/hooks/usePublicCoaches'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { TITLE_TAILWIND_CLASS } from '@/utils/constants'

export default function CoachCarousel() {
  const { coaches, isLoading, error } = usePublicCoaches()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [width, setWidth] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Get top rated coaches
  const featuredCoaches = coaches
    ?.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    ?.slice(0, 6) || []

  // Number of coaches to show at once based on screen size
  const getVisibleCount = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 1
      if (window.innerWidth < 1024) return 2
      return 3
    }
    return 3
  }

  const [visibleCount, setVisibleCount] = useState(3)

  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCount())
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const maxIndex = Math.max(0, featuredCoaches.length - visibleCount)

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1))
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-red-500">Failed to load coaches. Please try again later.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-center items-center w-full">
      <div className='flex flex-col items-center p-3 w-full'>
        <div className='flex flex-col justify-start items-center gap-2 w-full'>
          <div className='flex gap-3 justify-start items-center w-full'>
            <h2 className={`${TITLE_TAILWIND_CLASS} mt-2 font-semibold tracking-tight dark:text-white text-gray-900`}>
              Meet Our Expert Real Estate Coaches
            </h2>
          </div>
          <div className='flex gap-3 justify-start items-center w-full border-b pb-4'>
            <p className="text-gray-600 dark:text-gray-400">
              Connect with experienced professionals who can help you achieve your real estate goals
            </p>
          </div>
        </div>
      </div>

      <div className="w-full relative mt-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 animate-spin border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : featuredCoaches.length > 0 ? (
          <>
            <div className="overflow-hidden" ref={carouselRef}>
              <motion.div 
                className="flex"
                animate={{ x: -currentIndex * (100 / visibleCount) + '%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {featuredCoaches.map((coach) => (
                  <div 
                    key={coach.ulid}
                    className={`flex-shrink-0 px-2 pb-4`}
                    style={{ width: `${100 / visibleCount}%` }}
                  >
                    <PublicCoachCard
                      id={coach.ulid}
                      name={`${coach.firstName || ''} ${coach.lastName || ''}`}
                      imageUrl={coach.profileImageUrl || ''}
                      specialty={coach.coachingSpecialties[0] || 'Real Estate Coach'}
                      bio={coach.bio || ''}
                      specialties={coach.coachingSpecialties || []}
                      rating={coach.averageRating ?? undefined}
                      reviewCount={coach.totalSessions}
                      hourlyRate={coach.hourlyRate as number | undefined}
                    />
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between w-full absolute top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Button
                variant="outline"
                size="icon"
                className={`rounded-full bg-background shadow-md pointer-events-auto ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={`rounded-full bg-background shadow-md pointer-events-auto ${currentIndex >= maxIndex ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-12">
            No coaches available at the moment.
          </p>
        )}
      </div>

      <div className="w-full text-center mt-8">
        <Link href="/coaches" className="text-blue-600 hover:text-blue-700 font-semibold">
          View All Coaches →
        </Link>
      </div>
    </div>
  )
} 