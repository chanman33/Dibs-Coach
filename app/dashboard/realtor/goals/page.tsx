'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { RealtorGoalsDashboard } from '@/app/dashboard/realtor/_components/RealtorGoalsDashboard'
import { Loader2 } from 'lucide-react'

export default function RealtorGoalsPage() {
  const { userId } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [userDbId, setUserDbId] = useState<number | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        redirect('/sign-in')
        return
      }

      try {
        const response = await fetch(`${window.location.origin}/api/user/realtor`, {
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

        const user = await response.json()

        if (!user || (user.role !== 'realtor' && user.role !== 'realtor_coach')) {
          console.log('Redirecting because:', !user ? 'user not found' : `role ${user.role} not allowed`)
          redirect('/dashboard')
          return
        }

        setUserDbId(user.id)
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

  if (!userDbId) {
    return null
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <RealtorGoalsDashboard userDbId={userDbId} />
    </div>
  )
} 