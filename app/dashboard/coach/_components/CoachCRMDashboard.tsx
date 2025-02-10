'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MenteeList } from './MenteeList'
import { MenteeDetails } from './MenteeDetails'

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
}

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
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (mentees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Welcome to your CRM Dashboard</h2>
        <p className="text-gray-600 mb-4">
          You don't have any clients yet. Once you start coaching, your clients will appear here.
        </p>
        {/* Optional: Add a button or link to help coaches get started */}
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4 p-4'>
      <h1 className="text-2xl font-bold">Coach CRM Dashboard</h1>
      <div className='grid grid-cols-3 gap-4'>
        <Card className='col-span-1'>
          <CardHeader>
            <CardTitle>Mentees</CardTitle>
            <div className="h-1" />
            <Input 
              placeholder="Search mentees..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardHeader>
          <CardContent>
            <MenteeList 
              mentees={mentees}
              searchTerm={searchTerm} 
              onSelectMentee={setSelectedMenteeId}
              selectedMenteeId={selectedMenteeId}
            />
          </CardContent>
        </Card>
        <Card className='col-span-2'>
          <CardContent>
            {selectedMenteeId ? (
              <MenteeDetails menteeId={selectedMenteeId} />
            ) : (
              <p>No mentee selected</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

