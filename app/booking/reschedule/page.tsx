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
import { Loader2, Calendar, Clock } from 'lucide-react'
import { rescheduleSession } from '@/utils/actions/rescheduleActions'
import { TimeSlot, TimeSlotGroup } from '@/utils/types/booking'
import { getUserTimezone } from '@/utils/timezone-utils'
import { useReschedule } from './use-reschedule'
import { CoachProfileSection } from '../availability/CoachProfileSection'

// New ReBookingSummary component that includes rescheduling reason
interface ReBookingSummaryProps {
  selectedDate: Date | null;
  selectedTimeSlot: TimeSlot;
  onConfirm: () => Promise<void>;
  canBook: boolean;
  isBooking: boolean;
  coachName: string;
  formatTime: (date: Date) => string;
  coachTimezone: string;
  eventTypeName: string;
  eventTypeDuration: number;
  reschedulingReason: string;
  setReschedulingReason: (reason: string) => void;
  originalStartTime: string;
  originalEndTime: string;
}

function ReBookingSummary(props: ReBookingSummaryProps) {
  const {
    selectedDate,
    selectedTimeSlot,
    onConfirm,
    canBook,
    isBooking,
    coachName,
    formatTime,
    coachTimezone,
    eventTypeName,
    eventTypeDuration,
    reschedulingReason,
    setReschedulingReason,
    originalStartTime,
    originalEndTime,
  } = props;
  
  // Parse original times
  const origStart = new Date(originalStartTime);
  const origEnd = new Date(originalEndTime);
  
  // Use the existing BookingSummary component internally
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Booking Summary</CardTitle>
        <CardDescription>Review your rescheduled session details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Original Session Details */}
          <div className="pb-4 mb-2 border-b">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">CURRENT SESSION</h3>
            
            <div>
              <h4 className="text-sm font-medium mb-1">Date</h4>
              <p className="text-sm">{format(origStart, 'EEEE, MMMM d, yyyy')}</p>
            </div>
            
            <div className="mt-2">
              <h4 className="text-sm font-medium mb-1">Time</h4>
              <p className="text-sm">
                {formatTime(origStart)} - {formatTime(origEnd)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {Math.round((origEnd.getTime() - origStart.getTime()) / (1000 * 60))} minutes in {coachTimezone}
              </p>
            </div>
          </div>
          
          {/* New Session Section Heading */}
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">NEW SESSION</h3>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Session Type</h4>
            <p className="text-sm">{eventTypeName || "Coaching Session"}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Coach</h4>
            <p className="text-sm">{coachName}</p>
          </div>
          
          {selectedDate && (
            <div>
              <h4 className="text-sm font-medium mb-1">Date</h4>
              <p className="text-sm">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
            </div>
          )}
          
          {selectedTimeSlot && (
            <div>
              <h4 className="text-sm font-medium mb-1">Time</h4>
              <p className="text-sm">
                {formatTime(selectedTimeSlot.startTime)} - {formatTime(selectedTimeSlot.endTime)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {eventTypeDuration} minutes in {coachTimezone}
              </p>
            </div>
          )}
          
          {/* Rescheduling Reason Field */}
          <div>
            <h4 className="text-sm font-medium mb-1">Rescheduling Reason</h4>
            <textarea
              placeholder="Please provide a reason for rescheduling (optional)"
              className="w-full p-2 border rounded-md h-24 resize-none text-sm"
              value={reschedulingReason}
              onChange={(e) => setReschedulingReason(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          disabled={!canBook || isBooking}
          onClick={onConfirm}
        >
          {isBooking ? (
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
  );
}

export default function ReschedulePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('sessionId') || ''
  const coachIdFromUrl = searchParams.get('coachId') || ''
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
    coachId: coachIdFromUrl,
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

  const coachProfileImage = session?.coach?.profileImageUrl || null;
  
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
    <div className="container max-w-5xl py-10">
      <h1 className="text-2xl font-bold mb-6">Reschedule Your Session with {coachName}</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Coach Profile & Date Selection */}
        <div>
          {/* Coach Profile Section */}
          <CoachProfileSection 
            coachName={coachName} 
            profileImageUrl={coachProfileImage}
            specialty="Session Rescheduling"
          />
          
          {/* Date Picker Section */}
          <DatePickerSection
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            availableDates={availableDates}
            isDateDisabled={isDateDisabled}
          />
          
          {/* Add timezone display in booking UI */}
          {coachTimezone && (
            <div className="mt-2 text-xs text-muted-foreground">
              <p>Coach's timezone: {coachTimezone}</p>
              <p className="mt-1 text-xs">Times will adjust to your local timezone when displayed.</p>
            </div>
          )}
        </div>

        {/* Right Column - Time Slots and Booking Summary */}
        <div className="md:col-span-2">
          {/* Time Slots Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Available Times
              </CardTitle>
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

          {/* Use ReBookingSummary Component */}
          {selectedTimeSlot && (
            <ReBookingSummary
              coachName={coachName}
              selectedDate={selectedDate}
              selectedTimeSlot={selectedTimeSlot}
              canBook={!!selectedTimeSlot}
              isBooking={isRescheduling}
              onConfirm={handleReschedule}
              formatTime={formatTime}
              coachTimezone={coachTimezone || 'UTC'}
              eventTypeName="Rescheduled Session"
              eventTypeDuration={sessionDuration}
              reschedulingReason={reschedulingReason}
              setReschedulingReason={setReschedulingReason}
              originalStartTime={session.startTime}
              originalEndTime={session.endTime}
            />
          )}
        </div>
      </div>
    </div>
  );
} 