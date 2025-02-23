'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { CoachAnalyticsDashboard } from '../_components/CoachAnalyticsDashboard'
import { Loader2 } from 'lucide-react'
import { ApiResponse } from '@/utils/types/api'

interface CoachUserResponse {
  ulid: string
  systemRole: string
  email: string
  firstName: string | null
  lastName: string | null
  profileImageUrl: string | null
  capabilities: string[]
}

export default function CoachAnalyticsPage() {
  const { userId } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [userUlid, setUserUlid] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        redirect('/sign-in')
        return
      }

      try {
        const response = await fetch(`${window.location.origin}/api/user/coach`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          console.error('Failed to fetch user data:', await response.text())
          redirect('/dashboard')
          return
        }

        const { data, error } = (await response.json()) as ApiResponse<CoachUserResponse>

        if (error || !data) {
          console.error('Error fetching user data:', error)
          redirect('/dashboard')
          return
        }

        setUserUlid(data.ulid)
      } catch (error) {
        console.error('Error fetching user data:', error)
        redirect('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!userUlid) {
    return null
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <CoachAnalyticsDashboard userDbId={userUlid} />
    </div>
  )
} 