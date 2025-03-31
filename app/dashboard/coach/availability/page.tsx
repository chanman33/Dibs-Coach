'use client'

import { useEffect, useCallback, useState } from 'react'
import { AvailabilityManager } from '@/components/coaching/AvailabilityManager'
import { saveCoachAvailability, fetchCoachAvailability } from '@/utils/actions/availability'
import { fetchCoachEventTypes, saveCoachEventTypes } from '@/utils/actions/cal-event-type-actions'
import { Loader2, Calendar, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { AvailabilityResponse, SaveAvailabilityParams } from '@/utils/types/availability'
import { ApiResponse } from '@/utils/types/api'
import dynamic from 'next/dynamic'
import { type EventType } from '@/components/cal/EventTypeCard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Decimal } from '@prisma/client/runtime/library'
import { fetchCoachHourlyRate, type CoachHourlyRateResponse } from '@/utils/actions/cal-coach-rate-actions'
import { Button } from '@/components/ui/button'

// Dynamically import EventTypeManager with no SSR
const EventTypeManager = dynamic(
  () => import('@/components/cal/EventTypeManager'),
  { ssr: false }
)

export default function CoachAvailabilityPage() {
  // State to track auth recovery state
  const [isRecovering, setIsRecovering] = useState(false);

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

  // Fetch coach's hourly rate from profile data when available
  // We include it directly as part of event types data to avoid server-side auth issues
  const hourlyRateData = eventTypesData?.coachHourlyRate;
  const isLoadingHourlyRate = isLoadingEventTypes;
  
  // Handle token expiration issues
  const isTokenExpired = eventTypesError?.message?.includes('Cal.com') || 
                          eventTypesError?.message?.includes('token') || 
                          availabilityError?.message?.includes('Cal.com') ||
                          availabilityError?.message?.includes('token');

  // Handle recovery action
  const handleRecoverAuth = async () => {
    setIsRecovering(true);
    toast.loading('Reconnecting to Cal.com...');
    
    try {
      // Trigger a refetch which will attempt token refresh on the server
      await Promise.all([
        refetchEventTypes(),
        refetchAvailability()
      ]);
      
      toast.success('Successfully reconnected to Cal.com');
    } catch (error) {
      console.error('[CAL_RECOVERY_ERROR]', error);
      toast.error('Failed to reconnect. Please go to Settings and reconnect Cal.com manually.');
    } finally {
      setIsRecovering(false);
    }
  };
  
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

  // Memoize the validation and handler to prevent state updates during render
  // IMPORTANT: Define useCallback BEFORE any conditional returns to ensure consistent hook calling order
  const validateEventTypes = useCallback((eventTypes: EventType[]) => {
    // Frontend Validation: Check for hourly rate if non-free events exist
    const hasNonFreeEvent = eventTypes.some(et => !et.free);
    
    // Simple validation - hourlyRate is now a regular number
    const hourlyRate = hourlyRateData?.hourlyRate;
    const isValidRate = typeof hourlyRate === 'number' && hourlyRate > 0;

    if (hasNonFreeEvent && !isValidRate) {
      return false;
    }
    
    return true;
  }, [hourlyRateData]);

  // Handle availability save success - Define this BEFORE conditional returns
  const handleSaveSuccess = useCallback(async () => {
    await refetchAvailability();
  }, [refetchAvailability]);

  // Handle save - Define this BEFORE conditional returns
  const handleSave = useCallback(async (params: SaveAvailabilityParams): Promise<ApiResponse<{ success: true }>> => {
    const result = await saveCoachAvailability(params);
    if (result.data?.success) {
      await handleSaveSuccess();
    }
    return result;
  }, [handleSaveSuccess]);

  // Handle event types changes - Define this BEFORE conditional returns
  const handleEventTypesChange = useCallback(async (eventTypes: EventType[]) => {
    // Show loading toast immediately
    const toastId = toast.loading('Saving event types...'); 
    
    // Validate before attempting to save
    if (!validateEventTypes(eventTypes)) {
      toast.error('Please set a valid hourly rate in your coach profile before saving paid event types.', {
        id: toastId, 
        duration: 5000 // Keep message longer
      });
      return; // Stop execution
    }
    
    try {
      const result = await saveCoachEventTypes({ eventTypes });
      
      if (result.error) {
        console.error('[SAVE_EVENT_TYPES_ERROR]', result.error);
        
        // Handle Cal.com token expiration specifically
        if (result.error.message?.includes('token') || result.error.message?.includes('Cal.com')) {
          toast.error('Your Cal.com connection needs to be refreshed. Please try again or go to settings to reconnect.', { 
            id: toastId,
            duration: 8000
          });
        } else {
          // Use error toast for other errors
          toast.error(`Failed to save event types: ${result.error.message}`, { id: toastId }); 
        }
        return;
      }
      
      // Use success toast
      toast.success('Event types saved successfully', { id: toastId });
      // Refetch data only on full success
      refetchEventTypes(); 
    } catch (error) {
      console.error('[SAVE_EVENT_TYPES_ERROR]', error);
      // Use error toast for unexpected errors
      toast.error('An unexpected error occurred while saving event types', { id: toastId });
    }
  }, [validateEventTypes, refetchEventTypes]);

  // Show loading state
  const isLoading = isLoadingAvailability || isLoadingEventTypes
  if (isLoading) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Show token expiration error
  if (isTokenExpired) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Manage Your Availability</h1>
        
        <Alert className="mb-6 border-red-400">
          <Calendar className="h-4 w-4 text-red-500" />
          <AlertDescription className="flex flex-col gap-4">
            <p>Your Cal.com connection appears to have expired. This can happen if you haven't used the system for a while.</p>
            
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleRecoverAuth}
                disabled={isRecovering}
                className="flex items-center gap-2"
              >
                {isRecovering ? 
                  <Loader2 className="h-4 w-4 animate-spin" /> : 
                  <RefreshCw className="h-4 w-4" />
                }
                Reconnect to Cal.com
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard/settings'}
              >
                Go to Settings
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
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