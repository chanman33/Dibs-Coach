'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BookingFlow } from '@/components/coaching/BookingFlow'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Mock coach data for testing
const MOCK_COACH = {
  id: 'user_2r0JFaVbINR4TBRNFzcwIsyEXV0', // Replace with test coach ID
  name: 'Jane Smith',
  title: 'Senior Engineering Coach',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=coach1',
  hourlyRate: 150,
  expertise: ['System Design', 'Frontend Development', 'Career Growth'],
  rating: 4.9,
  totalSessions: 142
}

export default function BookingFlowTest() {
  const [isBookingOpen, setIsBookingOpen] = useState(false)

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Booking Flow Test Page</h1>
      
      {/* Coach Profile Card */}
      <Card className="p-6 mb-8">
        <div className="flex items-start gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={MOCK_COACH.avatarUrl} alt={MOCK_COACH.name} />
            <AvatarFallback>{MOCK_COACH.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{MOCK_COACH.name}</h2>
            <p className="text-muted-foreground">{MOCK_COACH.title}</p>
            
            <div className="mt-3 flex flex-wrap gap-2">
              {MOCK_COACH.expertise.map(skill => (
                <span 
                  key={skill}
                  className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
            
            <div className="mt-4 flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                ⭐ {MOCK_COACH.rating} ({MOCK_COACH.totalSessions} sessions)
              </span>
              <span className="text-sm font-medium">
                ${MOCK_COACH.hourlyRate}/hour
              </span>
            </div>
          </div>
          
          <Button 
            size="lg"
            onClick={() => setIsBookingOpen(true)}
          >
            Book Session
          </Button>
        </div>
      </Card>

      {/* Test Controls */}
      <Card className="p-6 mb-8">
        <h3 className="font-semibold mb-4">Test Controls</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => setIsBookingOpen(false)}
            >
              Close Booking Flow
            </Button>
          </div>
        </div>
      </Card>

      {/* Booking Flow Component */}
      <BookingFlow
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        coachId={MOCK_COACH.id}
        coachName={MOCK_COACH.name}
        coachRate={MOCK_COACH.hourlyRate}
      />
    </div>
  )
} 