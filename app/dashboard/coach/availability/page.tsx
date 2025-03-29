'use client'

import { useEffect } from 'react'
import { AvailabilityManager } from '@/components/coaching/AvailabilityManager'
import { saveCoachAvailability, fetchCoachAvailability } from '@/utils/actions/availability'
import { fetchCoachEventTypes, saveCoachEventTypes } from '@/utils/actions/cal-event-type-actions'
import { Loader2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { AvailabilityResponse, SaveAvailabilityParams } from '@/utils/types/availability'
import { ApiResponse } from '@/utils/types/api'
import { EventTypeManager } from '@/components/coaching/EventTypeManager'
import { type EventType } from '@/components/coaching/EventTypeCard'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function CoachAvailabilityPage() {
  // Fetch coach's event types
  const {
    data: eventTypesData,
    isLoading: isLoadingEventTypes,
    error: eventTypesError,
    refetch: refetchEventTypes
  } = useQuery({
    queryKey: ['coach-event-types'],
    queryFn: async () => {
      const result = await fetchCoachEventTypes()
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      
      return result.data
    }
  })

  // Fetch coach's availability schedule
  const { 
    data: availabilityData,
    isLoading: isLoadingAvailability,
    error: availabilityError,
    refetch: refetchAvailability
  } = useQuery({
    queryKey: ['coach-availability'],
    queryFn: async () => {
      const result = await fetchCoachAvailability({})
      
      if (result.error) {
        // Don't throw error for first-time setup
        if (result.error.code === 'NOT_FOUND') {
          return null
        }
        throw new Error(result.error.message)
      }
      
      return result.data
    }
  })

  // Handle fetch errors
  useEffect(() => {
    if (availabilityError) {
      console.error('[FETCH_AVAILABILITY_ERROR]', availabilityError)
      // Only show toast for unexpected errors
      if (!availabilityError.message.includes('NOT_FOUND')) {
        toast.error('Failed to load availability schedule')
      }
    }
    
    if (eventTypesError) {
      console.error('[FETCH_EVENT_TYPES_ERROR]', eventTypesError)
      // Only show toast for unexpected errors
      if (!eventTypesError.message.includes('NOT_FOUND')) {
        toast.error('Failed to load event types')
      }
    }
  }, [availabilityError, eventTypesError])

  // Show loading state
  const isLoading = isLoadingAvailability || isLoadingEventTypes
  if (isLoading) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Handle event types changes
  const handleEventTypesChange = async (eventTypes: EventType[]) => {
    try {
      const result = await saveCoachEventTypes({ eventTypes })
      
      if (result.error) {
        console.error('[SAVE_EVENT_TYPES_ERROR]', result.error)
        toast.error(`Failed to save event types: ${result.error.message}`)
        return
      }
      
      toast.success('Event types saved successfully')
      refetchEventTypes()
    } catch (error) {
      console.error('[SAVE_EVENT_TYPES_ERROR]', error)
      toast.error('An unexpected error occurred while saving event types')
    }
  };

  // Handle availability save success
  const handleSaveSuccess = async () => {
    await refetchAvailability()
  }

  const handleSave = async (params: SaveAvailabilityParams): Promise<ApiResponse<{ success: true }>> => {
    const result = await saveCoachAvailability(params)
    if (result.data?.success) {
      await handleSaveSuccess()
    }
    return result
  }

  // First time setup message
  const isFirstTimeSetup = !availabilityData && !eventTypesData?.eventTypes?.length
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Your Availability</h1>
      
      {isFirstTimeSetup && (
        <Alert className="mb-6">
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            Welcome! Let's set up your coaching schedule. Start by creating your session types below, 
            then set your weekly availability.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Event Type Manager */}
      <EventTypeManager
        initialEventTypes={eventTypesData?.eventTypes}
        onEventTypesChange={handleEventTypesChange}
      />
      
      {/* Existing Availability Manager */}
      <AvailabilityManager
        onSave={handleSave}
        initialSchedule={availabilityData || undefined}
      />
    </div>
  )
} 