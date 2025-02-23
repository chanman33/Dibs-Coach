'use client'

import { useEffect } from 'react'
import { AvailabilityManager } from '@/components/coaching/AvailabilityManager'
import { saveCoachAvailability, fetchCoachAvailability } from '@/utils/actions/availability'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { AvailabilityResponse, SaveAvailabilityParams } from '@/utils/types/availability'
import { ApiResponse } from '@/utils/types/api'

export default function CoachAvailabilityPage() {
  // Fetch coach's availability schedule
  const { 
    data: availabilityData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['coach-availability'],
    queryFn: async () => {
      const result = await fetchCoachAvailability({})
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      
      return result.data
    }
  })

  // Handle fetch errors
  useEffect(() => {
    if (error) {
      console.error('[FETCH_AVAILABILITY_ERROR]', error)
      toast.error('Failed to load availability schedule')
    }
  }, [error])

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Handle save success by refetching the schedule
  const handleSaveSuccess = async () => {
    await refetch()
  }

  const handleSave = async (params: SaveAvailabilityParams): Promise<ApiResponse<{ success: true }>> => {
    const result = await saveCoachAvailability(params)
    if (result.data?.success) {
      await handleSaveSuccess()
    }
    return result
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Your Availability</h1>
      <AvailabilityManager
        onSave={handleSave}
        initialSchedule={availabilityData || undefined}
      />
    </div>
  )
} 