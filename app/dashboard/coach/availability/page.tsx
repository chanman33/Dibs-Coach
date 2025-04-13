'use client'

import { useEffect, useCallback, useState } from 'react'
import { AvailabilityManager } from '@/components/coaching/AvailabilityManager'
import { saveCoachAvailability, fetchCoachAvailability } from '@/utils/actions/availability'
import { fetchCoachEventTypes, saveCoachEventTypes } from '@/utils/actions/cal-event-type-actions'
import { Loader2, Calendar, RefreshCw, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { AvailabilityResponse, SaveAvailabilityParams } from '@/utils/types/availability'
import { ApiResponse } from '@/utils/types/api'
import dynamic from 'next/dynamic'
import { EventType } from '@/components/cal/EventTypeCard'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { auth } from '@clerk/nextjs'
import { createAuthClient } from '@/utils/auth'

// Dynamically import EventTypeManager with no SSR
const EventTypeManager = dynamic(
  () => import('@/components/cal/EventTypeManager'),
  { ssr: false }
)

export default function CoachAvailabilityPage() {
  // State to track auth recovery state
  const [isRecovering, setIsRecovering] = useState(false);
  const [isCreatingDefaultTypes, setIsCreatingDefaultTypes] = useState(false);

  // Fetch coach's event types
  const {
    data: eventTypesData,
    isLoading: isLoadingEventTypes,
    error: eventTypesError,
    refetch: refetchEventTypes
  } = useQuery({
    queryKey: ['coach-event-types'],
    queryFn: async () => {
      console.log('[EVENT_TYPES_FETCH] Starting fetch of coach event types');
      const result = await fetchCoachEventTypes();
      
      if (result.error) {
        console.error('[EVENT_TYPES_FETCH_ERROR]', {
          error: result.error,
          message: result.error.message,
          timestamp: new Date().toISOString()
        });
        throw new Error(result.error.message);
      }
      
      // Debug log the result
      console.log('[EVENT_TYPES_FETCH_SUCCESS]', {
        count: result.data?.eventTypes?.length || 0,
        eventTypes: result.data?.eventTypes?.map(et => ({
          id: et.id,
          name: et.name,
          enabled: et.enabled
        })),
        hasHourlyRate: !!result.data?.coachHourlyRate?.hourlyRate,
        timestamp: new Date().toISOString()
      });
      
      return result.data;
    }
  })

  // Auto-create default event types when none are found
  useEffect(() => {
    // Only run this effect if we've loaded event types data and found none
    if (!isLoadingEventTypes && eventTypesData && eventTypesData.eventTypes) {
      const hasNoEventTypes = eventTypesData.eventTypes.length === 0;
      
      console.log('[AUTO_CREATE_CHECK]', {
        hasEventTypesData: !!eventTypesData,
        eventTypesCount: eventTypesData.eventTypes?.length || 0,
        shouldCreateDefault: hasNoEventTypes,
        timestamp: new Date().toISOString()
      });
      
      if (hasNoEventTypes) {
        handleCreateDefaultEventTypes();
      }
    }
  }, [isLoadingEventTypes, eventTypesData]);

  // Handle creating default event types
  const handleCreateDefaultEventTypes = async () => {
    if (isCreatingDefaultTypes) return; // Prevent multiple calls
    
    setIsCreatingDefaultTypes(true);
    const toastId = toast.loading('Setting up default session types...');
    
    try {
      console.log('[CREATE_DEFAULT_START]', {
        timestamp: new Date().toISOString(),
      });
      
      // Call the API endpoint to create default event types
      const response = await fetch('/api/cal/event-types/create-default', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}) // No need for userUlid, API will get from auth context
      });
      
      console.log('[CREATE_DEFAULT_RESPONSE]', {
        status: response.status,
        ok: response.ok,
        timestamp: new Date().toISOString()
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create default session types');
      }
      
      console.log('[CREATE_DEFAULT_SUCCESS]', {
        created: result.data.totalCreated,
        eventTypes: result.data.createdEventTypes?.map((et: { name: string }) => et.name) || [],
        timestamp: new Date().toISOString()
      });
      
      toast.success(`Created ${result.data.totalCreated} default session types`, { id: toastId });
      
      // Refetch event types to show the newly created ones
      await refetchEventTypes();
    } catch (error: any) {
      console.error('[CREATE_DEFAULT_ERROR]', {
        error,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      toast.error(`Failed to create default session types: ${error.message}`, { id: toastId });
    } finally {
      setIsCreatingDefaultTypes(false);
    }
  };

  // Fetch coach's availability schedule
  const { 
    data: availabilityData,
    isLoading: isLoadingAvailability,
    error: availabilityError,
    refetch: refetchAvailability
  } = useQuery<AvailabilityResponse | null, Error>({
    queryKey: ['coach-availability'],
    queryFn: async () => {
      const result = await fetchCoachAvailability({});
      
      if (result.error) {
        // Don't throw error for first-time setup
        if (result.error.code === 'NOT_FOUND') {
          return null
        }
        throw new Error(result.error.message)
      }
      
      // Ensure data exists before returning
      return result.data ? { schedule: result.data.schedule, timezone: result.data.timezone } : null;
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
    // Let the server re-fetch the Cal.com timezone as the source of truth
    // Don't pass in an explicit timezone to ensure the server gets it fresh from Cal.com
    const result = await saveCoachAvailability({
      ...params,
    });
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

  // --- Handlers for EventTypeManager ---

  const handleCreateEventType = async (eventTypeData: Omit<EventType, 'id'>) => {
    const toastId = toast.loading('Creating new session type...');
    try {
      // Call saveCoachEventTypes with a single event type
      const result = await saveCoachEventTypes({ 
        eventTypes: [{ ...eventTypeData, id: '' }] 
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
      toast.success('Session type created successfully.', { id: toastId });
      refetchEventTypes(); // Refetch data to show the new type
    } catch (error: any) {
      console.error("Error creating event type:", error);
      toast.error(`Failed to create session type: ${error.message}`, { id: toastId });
    }
  };

  const handleUpdateEventType = async (eventType: EventType) => {
    const toastId = toast.loading('Updating session type...');
    try {
      // Call saveCoachEventTypes with a single event type
      const result = await saveCoachEventTypes({ 
        eventTypes: [eventType] 
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
      toast.success('Session type updated successfully.', { id: toastId });
      refetchEventTypes(); // Refetch data
    } catch (error: any) {
      console.error("Error updating event type:", error);
      toast.error(`Failed to update session type: ${error.message}`, { id: toastId });
    }
  };

  const handleDeleteEventType = async (eventTypeId: string) => {
    const toastId = toast.loading('Deleting session type...');
    try {
      // Call saveCoachEventTypes with an empty array for this ID
      const result = await saveCoachEventTypes({ 
        eventTypes: eventTypesData?.eventTypes.filter(et => et.id !== eventTypeId) || [] 
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
      toast.success('Session type deleted successfully.', { id: toastId });
      refetchEventTypes(); // Refetch data
    } catch (error: any) {
      console.error("Error deleting event type:", error);
      toast.error(`Failed to delete session type: ${error.message}`, { id: toastId });
    }
  };
  
  const handleToggleEventType = async (eventTypeId: string, enabled: boolean) => {
    const toastId = toast.loading(`${enabled ? 'Enabling' : 'Disabling'} session type...`);
    try {
      // Find the event type and update its enabled status
      const eventType = eventTypesData?.eventTypes.find(et => et.id === eventTypeId);
      if (!eventType) {
        throw new Error('Event type not found');
      }
      
      // Call saveCoachEventTypes with the updated event type
      const result = await saveCoachEventTypes({ 
        eventTypes: eventTypesData?.eventTypes.map(et => 
          et.id === eventTypeId ? { ...et, enabled } : et
        ) || []
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
      toast.success(`Session type ${enabled ? 'enabled' : 'disabled'} successfully.`, { id: toastId });
      refetchEventTypes(); // Refetch data
    } catch (error: any) {
      console.error(`Error toggling event type:`, error);
      toast.error(`Failed to update session type: ${error.message}`, { id: toastId });
    }
  };

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

  // Determine if it's the first time setup (no schedule AND no event types)
  const isFirstTimeSetup = !availabilityData && !(eventTypesData?.eventTypes?.length)
  const determinedTimezone = availabilityData?.timezone;
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Your Availability</h1>
      
      {/* Timezone Alert */}
      {!isFirstTimeSetup && (
        <Alert className="mb-6">
          {determinedTimezone ? (
            <Info className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          )}
          <AlertTitle>{determinedTimezone ? "Timezone Information" : "Timezone Required"}</AlertTitle>
          <AlertDescription>
            {determinedTimezone ? (
              `Your availability is currently managed in the ${determinedTimezone} timezone. This is synchronized with your connected calendar or your profile settings.`
            ) : (
              <span>
                Please set your timezone to ensure accurate scheduling. You can connect your Cal.com account or set it manually in your <Link href="/dashboard/settings" className="underline font-medium">Settings</Link>.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isFirstTimeSetup && (
        <Alert className="mb-6">
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            Welcome! Let's set up your coaching schedule. Start by creating your session types below, 
            then set your weekly availability.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Event Type Manager - Pass the new handlers */}
      <EventTypeManager
        initialEventTypes={eventTypesData?.eventTypes || []}
        onCreateEventType={handleCreateEventType}
        onUpdateEventType={handleUpdateEventType}
        onDeleteEventType={handleDeleteEventType}
        onToggleEventType={handleToggleEventType}
      />
      
      {/* Existing Availability Manager - Pass timezone and schedule directly */} 
      <AvailabilityManager
        onSave={handleSave}
        initialSchedule={availabilityData?.schedule || undefined} // Pass directly
        timezone={determinedTimezone} 
        disabled={!determinedTimezone} 
      />
    </div>
  )
} 