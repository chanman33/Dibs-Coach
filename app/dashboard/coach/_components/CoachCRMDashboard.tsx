'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MenteeList } from './MenteeList'
import { MenteeDetails } from './MenteeDetails'
import { Button } from "@/components/ui/button"
import { PlusCircle, Users, Calendar, MessageSquare, Activity } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface RealtorProfile {
  id: number
  companyName: string | null
  licenseNumber: string | null
  phoneNumber: string | null
}

interface Mentee {
  id: number
  firstName: string | null
  lastName: string | null
  email: string
  profileImageUrl: string | null
  realtorProfile: RealtorProfile | null
  status: 'active' | 'inactive'
  lastSessionDate: string | null
  totalSessions: number
  nextSession: {
    date: string
    type: string
  } | null
  goals: string[]
  notes: {
    id: number
    content: string
    createdAt: string
  }[]
}

// Mock data for empty state visualization
const mockMentees: Mentee[] = [
  {
    id: 1,
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.j@example.com",
    profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    status: 'active',
    lastSessionDate: "2024-02-08",
    totalSessions: 12,
    nextSession: {
      date: "2024-02-15T10:00:00",
      type: "Weekly Check-in"
    },
    goals: [
      "Close 5 deals in Q1 2024",
      "Build social media presence",
      "Get certified in luxury real estate"
    ],
    notes: [
      {
        id: 1,
        content: "Excellent progress on social media strategy",
        createdAt: "2024-02-08T15:30:00"
      }
    ],
    realtorProfile: {
      id: 1,
      companyName: "Luxury Homes Inc",
      licenseNumber: "RE123456",
      phoneNumber: "(555) 123-4567"
    }
  }
]

export function CoachCRMDashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [mentees, setMentees] = useState<Mentee[]>([])
  const [selectedMenteeId, setSelectedMenteeId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMentees = async () => {
      try {
        const response = await fetch('/api/mentees')
        const result = await response.json()
        
        setMentees(result.data)
      } catch (error) {
        console.error('[CRM_ERROR] Failed to fetch mentees:', error)
        setError('Failed to load mentees data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMentees()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-red-500">
        <p className="text-lg font-semibold mb-2">Error: {error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4 p-4'>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Coach CRM Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track and manage your mentee relationships</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Mentee List Section */}
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Mentees
              </CardTitle>
              <Badge variant="secondary">
                {mentees.length} Total
              </Badge>
            </div>
            <div className="relative">
              <Input 
                placeholder="Search mentees..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            {mentees.length > 0 ? (
              <MenteeList 
                mentees={mentees}
                searchTerm={searchTerm} 
                onSelectMentee={setSelectedMenteeId}
                selectedMenteeId={selectedMenteeId}
              />
            ) : (
              <div className="text-center py-12 px-4">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Mentees will appear here after they book a coaching session with you through the marketplace.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mentee Details Section */}
        <Card className="col-span-8">
          <CardContent>
            {selectedMenteeId ? (
              <MenteeDetails menteeId={selectedMenteeId} />
            ) : (
              <div className="flex flex-col items-center justify-center h-[600px] text-center">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Select a mentee to view their detailed information
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

