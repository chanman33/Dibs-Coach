'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { addMinutes, parseISO, format } from 'date-fns'
import { createAuthClient } from '@/utils/auth'
import { DatePickerSection } from '../availability/DatePickerSection'
import { TimeSlotsSection } from '../availability/TimeSlotsSection'
import { BookingSummary } from '../availability/BookingSummary'
import { LoadingState } from '../availability/LoadingState'
import { ErrorState } from '../availability/ErrorState'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Calendar } from 'lucide-react'
import { rescheduleSession } from '@/utils/actions/rescheduleActions'
import { TimeSlot, TimeSlotGroup } from '@/utils/types/booking'
import { getUserTimezone } from '@/utils/timezone-utils'
import { useReschedule } from './use-reschedule'

export default function ReschedulePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('sessionId') || ''
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [reschedulingReason, setReschedulingReason] = useState('')
  
  // Get the user's timezone
  const userTimezone = getUserTimezone();
  
  // Fetch session details
  useEffect(() => {
    if (!sessionId) {
      setError('Session ID is required')
      setLoading(false)
      return
    }
    
    async function fetchSessionDetails() {
      try {
        const supabase = createAuthClient()
        const { data, error } = await supabase
          .from('Session')
          .select(`
            ulid,
            startTime,
            endTime,
            coachUlid,
            calBookingUlid,
            coach:coachUlid(firstName, lastName, profileImageUrl),
            status
          `)
          .eq('ulid', sessionId)
          .single()
          
        if (error) throw error
        
        if (!data) {
          setError('Session not found')
        } else if (data.status !== 'SCHEDULED' && data.status !== 'RESCHEDULED') {
          setError(`Cannot reschedule a session with status: ${data.status}`)
        } else {
          setSession(data)
        }
      } catch (err) {
        console.error('[FETCH_SESSION_ERROR]', err)
        setError('Failed to load session details')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSessionDetails()
  }, [sessionId])
  
  // Calculate session duration
  const sessionDuration = useMemo(() => {
    if (!session) return 60; // Default to 60 minutes
    return Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60));
  }, [session]);
  
  // Use the booking availability hook
  const {
    loading: loadingAvailability,
    error: availabilityError,
    selectedDate,
    setSelectedDate,
    selectedTimeSlot,
    setSelectedTimeSlot,
    availableDates,
    isDateDisabled,
    timeSlotGroups,
    coachTimezone,
    formatTime
  } = useReschedule({
    coachId: session?.coachUlid || '',
    sessionDuration
  });
  
  // Handle reschedule action
  const handleReschedule = async () => {
    if (!session || !selectedTimeSlot) return;
    
    setIsRescheduling(true);
    
    try {
      const startTime = selectedTimeSlot.startTime.toISOString();
      const endTime = selectedTimeSlot.endTime.toISOString();
      
      const result = await rescheduleSession({
        sessionUlid: session.ulid,
        calBookingUid: session.calBookingUlid,
        newStartTime: startTime,
        newEndTime: endTime,
        reschedulingReason,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Redirect to success page
      router.push(`/booking/booking-rescheduled?coachId=${session.coachUlid}&startTime=${startTime}&endTime=${endTime}`);
    } catch (err) {
      console.error('[RESCHEDULE_ERROR]', err);
      setError('Failed to reschedule session. Please try again.');
    } finally {
      setIsRescheduling(false);
    }
  };
  
  // Get coach name for display
  const coachName = session?.coach 
    ? `${session.coach.firstName || ''} ${session.coach.lastName || ''}`.trim()
    : 'Coach';
  
  if (loading || loadingAvailability) {
    return <LoadingState message="Loading session details..." />;
  }
  
  if (error) {
    return <ErrorState message={error} />;
  }
  
  if (availabilityError) {
    return <ErrorState message={`Error loading availability: ${availabilityError}`} />;
  }
  
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <div className="mx-auto mb-4">
            <Calendar className="h-12 w-12 text-primary mx-auto" />
          </div>
          <CardTitle className="text-2xl text-center">Reschedule Your Session</CardTitle>
          <CardDescription className="text-center">
            Please select a new date and time for your session with {coachName}
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select a New Date</CardTitle>
            </CardHeader>
            <CardContent>
              <DatePickerSection 
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                availableDates={availableDates}
                isDateDisabled={isDateDisabled}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Available Times</CardTitle>
              <CardDescription>
                {selectedDate
                  ? `Select a time slot for ${selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}`
                  : "Please select a date first"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <div className="text-center p-6 text-muted-foreground">
                  Select a date to see available times
                </div>
              ) : timeSlotGroups.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  No available times on this date, please try a different day
                </div>
              ) : (
                <TimeSlotsSection
                  timeSlotGroups={timeSlotGroups}
                  selectedTimeSlot={selectedTimeSlot}
                  onSelectTimeSlot={setSelectedTimeSlot}
                  formatTime={formatTime}
                  coachTimezone={coachTimezone}
                  eventTypeDuration={sessionDuration}
                />
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <BookingSummary 
            coachName={coachName}
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTimeSlot}
            canBook={!!selectedTimeSlot}
            isBooking={isRescheduling}
            onConfirm={handleReschedule}
            formatTime={formatTime}
            coachTimezone={coachTimezone || 'UTC'}
          />
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Rescheduling Reason</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <textarea
                placeholder="Please provide a reason for rescheduling (optional)"
                className="w-full p-2 border rounded-md h-24 resize-none"
                value={reschedulingReason}
                onChange={(e) => setReschedulingReason(e.target.value)}
              />
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                disabled={!selectedTimeSlot || isRescheduling}
                onClick={handleReschedule}
              >
                {isRescheduling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rescheduling...
                  </>
                ) : (
                  'Confirm Reschedule'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 