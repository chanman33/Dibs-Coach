'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { CoachProfileModal } from "@/components/profile/common/CoachProfileModal"

// Mock coach data for testing
const mockCoach = {
  id: 1,
  userId: 'user_2r0JFaVbINR4TBRNFzcwIsyEXV0',
  name: 'John Smith',
  specialty: 'Real Estate Investment',
  imageUrl: null,
  bio: 'Experienced real estate coach with over 15 years in the industry. Specializing in investment properties and market analysis.',
  experience: '15+ years in real estate',
  certifications: [
    'Certified Real Estate Coach (CREC)',
    'Investment Property Specialist',
    'Market Analysis Expert'
  ],
  availability: 'Monday to Friday, 9 AM - 5 PM',
  sessionLength: null,
  specialties: [
    'Investment Properties',
    'Market Analysis',
    'Property Valuation',
    'Portfolio Management'
  ],
  calendlyUrl: 'https://calendly.com/test',
  eventTypeUrl: 'https://calendly.com/test/30min',
  sessionConfig: {
    durations: [30, 60, 90],
    rates: {
      '30': 75,
      '60': 125,
      '90': 175
    },
    currency: 'USD',
    defaultDuration: 60,
    allowCustomDuration: true,
    minimumDuration: 30,
    maximumDuration: 120,
    isActive: true
  }
}

export default function BookingFlowTestPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Booking Flow Test Page</h1>
          <p className="text-muted-foreground">
            This page demonstrates the new booking flow components. Click the button below to start the booking process.
          </p>
        </div>

        <div className="p-6 border rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Test Coach Profile</h2>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span>{mockCoach.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Specialty:</span>
              <span>{mockCoach.specialty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Experience:</span>
              <span>{mockCoach.experience}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available Durations:</span>
              <span>{mockCoach.sessionConfig.durations.join(', ')} minutes</span>
            </div>
          </div>

          <Button 
            onClick={() => setIsModalOpen(true)}
            className="w-full"
          >
            View Profile & Book
          </Button>
        </div>

        <div className="p-6 border rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "View Profile & Book" to open the coach profile modal</li>
            <li>Review the coach's profile information and session rates</li>
            <li>Click "Book Now" to start the booking process</li>
            <li>Select a session duration from the available options</li>
            <li>Choose a date and time slot from the calendar</li>
            <li>Review and confirm your booking details</li>
          </ol>
        </div>

        <div className="p-6 border rounded-lg space-y-4 bg-muted/50">
          <h2 className="text-lg font-semibold">Testing Notes</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>All API endpoints are live and functional</li>
            <li>Session rates are calculated based on duration</li>
            <li>Custom durations are supported (30-120 minutes)</li>
            <li>Availability is checked in real-time</li>
            <li>Confirmation emails will be sent on successful booking</li>
          </ul>
        </div>
      </div>

      <CoachProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        coach={mockCoach}
      />
    </div>
  )
} 