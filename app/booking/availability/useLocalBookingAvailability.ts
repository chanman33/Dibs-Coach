"use client"

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, addDays, parseISO } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { createAuthClient } from "@/utils/auth";
import { createBooking } from "@/utils/actions/booking-actions";
import { TimeSlot, TimeSlotGroup, LoadingState } from "@/utils/types/booking";
import {
  dayMapping,
  formatTime,
  getTomorrowDate,
  getMaxBookingDate,
  getDayNameFromNumber,
  doesTimeSlotOverlapWithBusyTime
} from "@/utils/date-utils";

// Interface for coach schedule from the database
export interface AvailabilitySlot {
  days: string[];
  startTime: string; // Format: "HH:MM"
  endTime: string;   // Format: "HH:MM"
}

export interface CoachSchedule {
  ulid: string;
  userUlid: string;
  name: string;
  timeZone: string;
  availability: AvailabilitySlot[];
  isDefault: boolean;
  active: boolean;
  defaultDuration: number;
}

export interface BusyTime {
  start: string;
  end: string;
  source: string;
}

// Helper function to generate and filter time slots for a specific date
const generateAndFilterTimeSlots = (
  date: Date, 
  coachSchedule: CoachSchedule, 
  busyTimes: BusyTime[], 
  slotDuration: number
): TimeSlot[] => {
  
  console.log('[DEBUG][BOOKING_HELPER] Generating slots for date', {
    date: format(date, 'yyyy-MM-dd'),
    slotDuration
  });
  
  const dayOfWeek = date.getDay();
  const dayName = getDayNameFromNumber(dayOfWeek);
  
  if (!dayName) {
    console.error('[DEBUG][BOOKING_HELPER] Invalid day for slot generation', { date });
    return []; // Cannot generate slots if day name is invalid
  }

  // Find availability slots for the selected day
  const dayScheduleSlots = coachSchedule.availability.filter(slot => {
    if (!slot.days || !Array.isArray(slot.days)) return false;
    return slot.days.some(day => {
      if (typeof day === 'number') return day === dayOfWeek;
      if (typeof day === 'string') return day.toUpperCase() === dayName.toUpperCase(); // Case-insensitive compare
      return false;
    });
  });

  console.log('[DEBUG][BOOKING_HELPER] Found schedule slots for day', { dayName, count: dayScheduleSlots.length });

  if (dayScheduleSlots.length === 0) {
    return []; // No availability defined for this day
  }

  // Generate potential slots based on schedule
  const potentialSlots: TimeSlot[] = [];
  dayScheduleSlots.forEach(scheduleSlot => {
    const [startHour, startMinute] = scheduleSlot.startTime.split(":").map(Number);
    const [endHour, endMinute] = scheduleSlot.endTime.split(":").map(Number);

    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const scheduleEndTime = new Date(date);
    scheduleEndTime.setHours(endHour, endMinute, 0, 0);

    console.log('[DEBUG][BOOKING_HELPER] Processing schedule slot', {
      scheduleStartTime: scheduleSlot.startTime,
      scheduleEndTime: scheduleSlot.endTime,
      loopStart: format(currentTime, 'HH:mm'),
      loopEnd: format(scheduleEndTime, 'HH:mm')
    });

    while (currentTime < scheduleEndTime) {
      const slotEndTime = new Date(currentTime);
      slotEndTime.setMinutes(currentTime.getMinutes() + slotDuration);

      if (slotEndTime <= scheduleEndTime) {
        potentialSlots.push({
          startTime: new Date(currentTime),
          endTime: slotEndTime
        });
      }
      currentTime = new Date(slotEndTime);
    }
  });
  
  console.log('[DEBUG][BOOKING_HELPER] Generated potential slots', { count: potentialSlots.length });

  // Filter out slots conflicting with busy times
  const availableSlots = potentialSlots.filter(slot => {
    const conflicts = busyTimes.some(busyTime => {
      // Ensure busy times are parsed correctly into Date objects
      let busyStart: Date, busyEnd: Date;
      try {
        busyStart = parseISO(busyTime.start);
        busyEnd = parseISO(busyTime.end);
      } catch (e) {
        console.error('[DEBUG][BOOKING_HELPER] Failed to parse busy time:', busyTime, e);
        return true; // Treat parse failure as a conflict to be safe
      }

      // Check for overlap using the utility function
      const overlaps = doesTimeSlotOverlapWithBusyTime(slot, busyStart, busyEnd);
      
      // Add detailed logging for the comparison
      if (format(date, 'yyyy-MM-dd') === '2025-05-01') { // Log specifically for May 1st
           console.log('[DEBUG][BOOKING_HELPER][MAY_1_FILTER]', {
              slotStart: slot.startTime.toISOString(), 
              slotEnd: slot.endTime.toISOString(),
              busyStart: busyStart.toISOString(),
              busyEnd: busyEnd.toISOString(),
              busySource: busyTime.source,
              slotStartTimestamp: slot.startTime.getTime(),
              slotEndTimestamp: slot.endTime.getTime(),
              busyStartTimestamp: busyStart.getTime(),
              busyEndTimestamp: busyEnd.getTime(),
              check: `(${slot.startTime.getTime()} < ${busyEnd.getTime()}) && (${slot.endTime.getTime()} > ${busyStart.getTime()})`,
              overlaps
            });
      }
      
      // Log general conflicts
      if (overlaps) {
        console.log('[DEBUG][BOOKING_HELPER] Slot conflicts with busy time', {
            slot: {
              start: format(slot.startTime, 'HH:mm'),
              end: format(slot.endTime, 'HH:mm'),
              utc: slot.startTime.toISOString()
            },
            busy: {
              start: format(busyStart, 'HH:mm zzz'), // Add timezone info if possible
              end: format(busyEnd, 'HH:mm zzz'),
              utcStart: busyStart.toISOString(),
              utcEnd: busyEnd.toISOString(),
              source: busyTime.source
            }
          });
      }
      return overlaps;
    });
    // Keep the slot only if it DOES NOT conflict
    return !conflicts; 
  });
  // const availableSlots = potentialSlots; // REMOVED: Use the filtered slots

  console.log('[DEBUG][BOOKING_HELPER] Final filtered slots for date', {
    date: format(date, 'yyyy-MM-dd'),
    count: availableSlots.length,
    slots: availableSlots.map(s => format(s.startTime, 'HH:mm')) 
  });
  
  return availableSlots;
};

export function useLocalBookingAvailability() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get coach identifiers from URL
  const coachId = searchParams.get("coachId");
  const coachSlug = searchParams.get("slug");
  
  // State variables
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  // AVAILABLE DATES NOW REPRESENTS DATES WITH CONFIRMED SLOTS
  const [availableDates, setAvailableDates] = useState<Date[]>([]); 
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachSchedule, setCoachSchedule] = useState<CoachSchedule | null>(null);
  const [busyTimes, setBusyTimes] = useState<BusyTime[]>([]); // Keep busyTimes state
  const [coachName, setCoachName] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [actualCoachId, setActualCoachId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced loading state
  const [loadingState, setLoadingState] = useState<LoadingState>({
    status: 'loading',
    context: 'initial'
  });

  // Helper function to check if a date should be disabled (outside window or general non-working day)
  // Note: This remains unchanged, it's about the overall window/day-off status, not specific slots.
  const isDateDisabled = useCallback((date: Date) => {
    if (!date) return true;
    
    // First check: Is the date within the allowed booking window?
    const tomorrow = getTomorrowDate();
    const maxDate = getMaxBookingDate();
    
    if (date < tomorrow || date > maxDate) {
      return true; // Outside booking window - disable
    }
    
    // Second check: Is this a day the coach generally works on?
    const dayOfWeek = date.getDay();
    const dateDayName = getDayNameFromNumber(dayOfWeek);
    
    if (!dateDayName || !coachSchedule) {
      return true; // We don't have enough info - disable to be safe
    }
    
    // Check if this day is in the coach's schedule
    const isDayGenerallyAvailable = coachSchedule.availability.some(slot => 
      slot.days.some(day => {
        if (typeof day === 'number') return day === dayOfWeek;
        if (typeof day === 'string') return day.toUpperCase() === dateDayName.toUpperCase();
        return false;
      })
    );
    
    return !isDayGenerallyAvailable; // Disable if not generally available
  }, [coachSchedule]);

  // Fetch coach data and schedule when component mounts
  useEffect(() => {
    if (!coachId && !coachSlug) return;
    
    setLoading(true);
    setLoadingState({
      status: 'loading',
      context: 'COACH_DATA',
      message: 'Loading coach details...'
    });
    
    const fetchCoachData = async () => {
      try {
        const supabase = createAuthClient();
        let coachUlid: string;
        
        // First, resolve the coach ID from slug if needed
        if (coachSlug && !coachId) {
          console.log('[DEBUG][BOOKING] Fetching coach ID from slug', { slug: coachSlug });
          const { data: slugData, error: slugError } = await supabase
            .from("CoachProfile")
            .select("userUlid")
            .eq("slug", coachSlug)
            .single();
            
          if (slugError || !slugData) {
            console.error("[FETCH_COACH_SLUG_ERROR]", {
              error: slugError,
              slug: coachSlug,
              timestamp: new Date().toISOString()
            });
            setLoadingState({
              status: 'error',
              context: 'COACH_DATA',
              message: 'Coach not found'
            });
            setError("Coach not found. Please check the URL and try again.");
            return;
          }
          
          coachUlid = slugData.userUlid;
          console.log('[DEBUG][BOOKING] Found coach ID from slug', { coachUlid });
        } else {
          // If only coachId provided, use it directly
          coachUlid = coachId!;
          console.log('[DEBUG][BOOKING] Using provided coachId directly', { coachUlid });
        }
        
        // Store the actual coachId for later use
        setActualCoachId(coachUlid);
        console.log('[DEBUG][BOOKING] Coach ID set for availability fetch', { coachUlid });
        
        // Get coach info
        console.log('[DEBUG][BOOKING] Fetching coach user details', { coachUlid });
        const { data: coachData, error: coachError } = await supabase
          .from("User")
          .select("firstName, lastName, ulid")
          .eq("ulid", coachUlid)
          .single();
        
        if (coachError || !coachData) {
          console.error("[FETCH_COACH_ERROR]", {
            error: coachError,
            timestamp: new Date().toISOString()
          });
          setLoadingState({
            status: 'error',
            context: 'COACH_DATA',
            message: 'Failed to fetch coach information'
          });
          return;
        }
        
        setCoachName(`${coachData.firstName || ""} ${coachData.lastName || ""}`);
        console.log('[DEBUG][BOOKING] Coach name set', { name: `${coachData.firstName || ""} ${coachData.lastName || ""}` });
        
        // Then get coach's availability schedule
        console.log('[DEBUG][BOOKING] Fetching coach availability schedule', { coachUlid });
        const { data: scheduleData, error: scheduleError } = await supabase
          .from("CoachingAvailabilitySchedule")
          .select("*")
          .eq("userUlid", coachUlid)
          .eq("isDefault", true)
          .eq("active", true)
          .single();
          
        if (scheduleError) {
          console.error("[FETCH_SCHEDULE_ERROR]", {
            error: scheduleError,
            timestamp: new Date().toISOString()
          });
          setLoadingState({
            status: 'error',
            context: 'SCHEDULE_DATA',
            message: 'Failed to fetch coach schedule'
          });
          return;
        }
        
        if (scheduleData) {
          // Parse availability data if needed
          const availabilityData = typeof scheduleData.availability === 'string' 
            ? JSON.parse(scheduleData.availability) 
            : scheduleData.availability;
            
          console.log('[DEBUG][BOOKING] Coach schedule data retrieved', { 
            scheduleId: scheduleData.ulid,
            timezone: scheduleData.timeZone,
            availability: availabilityData,
            defaultDuration: scheduleData.defaultDuration
          });
          
          // Check if there's a Cal.com integration with timezone (prioritize it)
          const { data: calData, error: calError } = await supabase
            .from("CalendarIntegration")
            .select("calAccessToken, timeZone")
            .eq("userUlid", coachUlid)
            .single();
          
          // Use Cal.com timezone if available (priority), otherwise use schedule timezone
          const determinedTimeZone = calData?.timeZone || scheduleData.timeZone;
          
          console.log('[DEBUG][BOOKING] Timezone determination', {
            calTimeZone: calData?.timeZone || 'none',
            scheduleTimeZone: scheduleData.timeZone,
            using: determinedTimeZone,
            timestamp: new Date().toISOString()
          });
          
          setCoachSchedule({
            ...scheduleData,
            timeZone: determinedTimeZone, // Use the prioritized timezone
            availability: availabilityData
          });
          
          // Fetch busy times using the actualCoachId
           if (coachUlid) {
             setLoadingState({ status: 'loading', context: 'BUSY_TIMES', message: 'Loading busy times...' });
             try {
               const response = await fetch(`/api/availability/busy-times?coachId=${coachUlid}&days=31`); // Fetch for ~1 month
               if (!response.ok) {
                 throw new Error(`Failed to fetch busy times: ${response.statusText}`);
               }
               const busyData: BusyTime[] = await response.json();
               setBusyTimes(busyData);
               console.log('[DEBUG][BOOKING] Successfully fetched busy times', { count: busyData.length, sample: busyData.slice(0, 2) });
               setLoadingState({ status: 'success', context: 'BUSY_TIMES' });
             } catch (busyError) {
               console.error('[FETCH_BUSY_TIMES_ERROR]', busyError);
               toast({ title: 'Error loading busy times', description: 'Could not load calendar events.', variant: 'destructive' });
               setBusyTimes([]); // Proceed without busy times if fetch fails
               setLoadingState({ status: 'error', context: 'BUSY_TIMES', message: 'Failed to load busy times' });
             }
           }
          
          setLoadingState({
            status: 'success',
            context: 'COACH_DATA'
          });
        } else {
          console.warn('[DEBUG][BOOKING] No schedule data found for coach', { coachUlid });
          setLoadingState({
            status: 'error',
            context: 'SCHEDULE_DATA',
            message: 'No availability schedule found for this coach'
          });
        }
      } catch (error) {
        console.error("[FETCH_COACH_DATA_ERROR]", {
          error,
          timestamp: new Date().toISOString()
        });
        setLoadingState({
          status: 'error',
          context: 'COACH_DATA',
          message: 'An unexpected error occurred'
        });
      } finally {
        // We are not done loading yet, calculation of available dates comes next
        // setLoading(false); 
      }
    };

    fetchCoachData();
  }, [coachId, coachSlug]);

  // Calculate available DATES (with confirmed slots) based on coach schedule and busy times
  useEffect(() => {
    // Wait until both schedule and busy times are potentially loaded
    if (!coachSchedule || loadingState.context === 'BUSY_TIMES' && loadingState.status === 'loading') {
        console.log('[DEBUG][BOOKING] Waiting for schedule/busy times before calculating available dates...');
        return;
    }

    console.log('[DEBUG][BOOKING] Calculating available DATES with actual slots');
    setLoadingState({
      status: 'loading',
      context: 'CALCULATING_DATES_WITH_SLOTS',
      message: 'Finding dates with available slots...'
    });

    // Use a timeout to ensure state updates from busyTimes fetch have settled
    const timerId = setTimeout(() => {
      const calculateAvailableDatesWithSlots = () => {
        const tomorrow = getTomorrowDate();
        const maxDate = getMaxBookingDate();
        const slotDuration = coachSchedule.defaultDuration || 60;
        const finalAvailableDates: Date[] = [];
        
        // Now we can safely use the busyTimes state
        const currentBusyTimes = busyTimes;
        console.log('[DEBUG][BOOKING] Using busy times for date calculation:', { count: currentBusyTimes.length });

        // Iterate through the booking window
        for (let i = 0; i <= 15; i++) {
          const date = addDays(tomorrow, i);
          if (date > maxDate) break;

          // Check if the day itself is generally available (avoids unnecessary slot calculation)
          const dayOfWeek = date.getDay();
          const dayName = getDayNameFromNumber(dayOfWeek);
          const isDayGenerallyAvailable = coachSchedule.availability.some(slot => 
            slot.days.some(day => {
              if (typeof day === 'number') return day === dayOfWeek;
              if (typeof day === 'string') return day.toUpperCase() === dayName?.toUpperCase();
              return false;
            })
          );

          if (isDayGenerallyAvailable) {
            // Generate slots for this specific date, filtering with currentBusyTimes
            const slotsForDate = generateAndFilterTimeSlots(date, coachSchedule, currentBusyTimes, slotDuration);
            
            // If slots exist for this date, add it to the list
            if (slotsForDate.length > 0) {
              finalAvailableDates.push(date);
            } else {
               console.log(`[DEBUG][BOOKING] No slots found for ${format(date, 'yyyy-MM-dd')} after filtering.`);
            }
          } else {
             console.log(`[DEBUG][BOOKING] Day ${format(date, 'yyyy-MM-dd')} (${dayName}) is not generally available.`);
          }
        }

        console.log('[DEBUG][BOOKING] Final available dates with slots calculated', {
          numDates: finalAvailableDates.length,
          dates: finalAvailableDates.map(d => format(d, 'yyyy-MM-dd')), // Log the actual dates
          dateRange: finalAvailableDates.length > 0 ? {
            firstDate: format(finalAvailableDates[0], 'yyyy-MM-dd'),
            lastDate: format(finalAvailableDates[finalAvailableDates.length - 1], 'yyyy-MM-dd')
          } : 'No dates available'
        });
        
        setAvailableDates(finalAvailableDates);
        
        // Auto-select the first available date if none is selected or current selection is invalid/disabled
        if (finalAvailableDates.length > 0) {
          const isCurrentSelectionValid = selectedDate && 
                                         finalAvailableDates.some(d => d.getTime() === selectedDate.getTime()) &&
                                         !isDateDisabled(selectedDate); // isDateDisabled checks general window/day off

          if (!isCurrentSelectionValid) {
            console.log('[DEBUG][BOOKING] Setting default selected date from dates with slots', { 
              date: format(finalAvailableDates[0], 'yyyy-MM-dd')
            });
            setSelectedDate(finalAvailableDates[0]); // Select the first date that *has slots*
          }
          setLoadingState({
            status: 'success',
            context: 'CALCULATING_DATES_WITH_SLOTS'
          });
        } else {
          console.warn('[DEBUG][BOOKING] No dates with available slots found in booking window');
          setError("No available booking slots found in the next 15 days.");
          setSelectedDate(undefined); // Clear selection if no dates are available
          setLoadingState({
            status: 'error',
            context: 'CALCULATING_DATES_WITH_SLOTS',
            message: 'No available dates with slots found'
          });
        }
        setLoading(false); // Finish loading only after dates are calculated
      };

      calculateAvailableDatesWithSlots();
   }, 0); // Use setTimeout with 0 delay

  // Rerun when schedule changes, OR potentially when busyTimes changes if it's dynamic
  // Make sure busyTimes state is included here so recalculation happens after fetch
  }, [coachSchedule, busyTimes]); 
  // REMOVED selectedDate and isDateDisabled from dependencies - these shouldn't trigger recalculation of the entire available date list.
  // Auto-selection logic inside the effect handles the selectedDate aspect.


  // Calculate available TIME SLOTS for the currently selected date
  useEffect(() => {
    // Only run if we have a selected date AND the schedule is loaded AND date calculation is done
     if (!selectedDate || !coachSchedule || loadingState.status !== 'success' || loadingState.context === 'CALCULATING_DATES_WITH_SLOTS') {
         console.log('[DEBUG][BOOKING] Waiting to calculate time slots...', { hasSelectedDate: !!selectedDate, hasCoachSchedule: !!coachSchedule, loadingStatus: loadingState.status, loadingContext: loadingState.context });
         return;
     }

    console.log('[DEBUG][BOOKING] Calculating/Re-calculating time slots for SELECTED date', {
      date: format(selectedDate, 'yyyy-MM-dd')
    });
    
    setLoadingState({
      status: 'loading',
      context: 'TIME_SLOTS_FOR_SELECTED',
      message: 'Loading time slots for selected date...'
    });
    
    const slotDuration = coachSchedule.defaultDuration || 60;
    // Use the helper function to get slots for the selected date
    // Assuming busyTimes state is up-to-date if/when implemented
    const slots = generateAndFilterTimeSlots(selectedDate, coachSchedule, busyTimes, slotDuration); 
    
    console.log('[DEBUG][BOOKING] Final available time slots for selected date', {
      count: slots.length,
      slots: slots.map(slot => format(slot.startTime, 'HH:mm'))
    });
    
    setTimeSlots(slots);
    setSelectedTimeSlot(null); // Reset selected time slot when date changes
    
    setLoadingState({
      status: 'success',
      context: 'TIME_SLOTS_FOR_SELECTED'
    });
  // Rerun when selectedDate, coachSchedule, or busyTimes change
  }, [selectedDate, coachSchedule, busyTimes, loadingState.status, loadingState.context]); 


  // Prepare times for rendering by grouping into morning, afternoon, evening
  const timeSlotGroups = useMemo<TimeSlotGroup[]>(() => {
    if (!timeSlots.length) return [];
    
    // Group into morning, afternoon, evening
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];
    
    timeSlots.forEach(slot => {
      const hour = slot.startTime.getHours();
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });
    
    const groups = [
      { title: "Morning", slots: morning },
      { title: "Afternoon", slots: afternoon },
      { title: "Evening", slots: evening }
    ].filter(group => group.slots.length > 0);
    
    console.log('[DEBUG][BOOKING] Time slot groups for UI', {
      morning: morning.length,
      afternoon: afternoon.length,
      evening: evening.length,
      totalGroups: groups.length
    });
    
    return groups;
  }, [timeSlots]);

  // Handle booking confirmation
  const handleConfirmBooking = useCallback(async () => {
    if (!selectedTimeSlot || !actualCoachId) return;
    
    console.log('[DEBUG][BOOKING] Starting booking confirmation', {
      coachId: actualCoachId,
      startTime: format(selectedTimeSlot.startTime, 'yyyy-MM-dd HH:mm'),
      endTime: format(selectedTimeSlot.endTime, 'yyyy-MM-dd HH:mm')
    });
    
    setIsBooking(true);
    setLoadingState({
      status: 'loading',
      context: 'BOOKING',
      message: 'Creating your booking...'
    });
    
    try {
      // NOTE: This is a placeholder for testing local functionality
      // In real implementation, this would call the Cal.com API
      
      // Simulating a successful booking without actually making one
      setTimeout(() => {
        setLoadingState({
          status: 'success',
          context: 'BOOKING',
          message: 'Booking created successfully! (TEST MODE)'
        });
        
        toast({
          title: "Booking Confirmed (Test Mode)",
          description: "This is a test booking and was not actually created. In production, this would create a real booking.",
          variant: "default"
        });
        
        setIsBooking(false);
        
        // Redirect to a success page with simulated data
        const coachIdentifier = coachSlug ? `slug=${coachSlug}` : `coachId=${actualCoachId}`;
        const startTimeStr = selectedTimeSlot.startTime.toISOString();
        const endTimeStr = selectedTimeSlot.endTime.toISOString();
        
        router.push(`/booking/booking-success?${coachIdentifier}&startTime=${encodeURIComponent(startTimeStr)}&endTime=${encodeURIComponent(endTimeStr)}&bookingUid=test-booking&testMode=true`);
      }, 1500); // Simulate API delay
      
      /* PRODUCTION CODE (COMMENTED OUT FOR TESTING)
      const result = await createBooking({
        eventTypeId: 12345, // This would be fetched from the actual coach's calendar
        startTime: selectedTimeSlot.startTime.toISOString(),
        endTime: selectedTimeSlot.endTime.toISOString(),
        attendeeName: "Test User", // This would be the current user's name
        attendeeEmail: "test@example.com", // This would be the current user's email
        timeZone: coachSchedule?.timeZone || "America/New_York",
        notes: "Booked via local testing" // User entered notes would go here
      });
      
      if (result.error) {
        console.error("[BOOKING_ERROR]", {
          error: result.error,
          timestamp: new Date().toISOString()
        });
        toast({
          title: "Booking Failed",
          description: result.error.message || "Could not complete booking. Please try again later.",
          variant: "destructive"
        });
        setIsBooking(false);
        setLoadingState({
          status: 'error',
          context: 'BOOKING',
          message: result.error.message || 'Booking failed'
        });
        return;
      }

      if (!result.data) {
        toast({
          title: "Booking Error",
          description: "No booking data received. Please try again later.",
          variant: "destructive"
        });
        setIsBooking(false);
        setLoadingState({
          status: 'error',
          context: 'BOOKING',
          message: 'No booking data received'
        });
        return;
      }

      // Redirect to booking success page with all necessary data
      // Prefer the slug if available, otherwise use the coachId
      const coachIdentifier = coachSlug ? `slug=${coachSlug}` : `coachId=${actualCoachId}`;
      setLoadingState({
        status: 'success',
        context: 'BOOKING',
        message: 'Booking created successfully!'
      });
      router.push(`/booking/booking-success?${coachIdentifier}&startTime=${encodeURIComponent(result.data.startTime)}&endTime=${encodeURIComponent(result.data.endTime)}&bookingUid=${encodeURIComponent(result.data.calBookingUid)}`);
      */
    } catch (error) {
      console.error("[BOOKING_ERROR]", {
        error,
        timestamp: new Date().toISOString()
      });
      toast({
        title: "Booking Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive"
      });
      setIsBooking(false);
      setLoadingState({
        status: 'error',
        context: 'BOOKING',
        message: 'An unexpected error occurred'
      });
    }
  }, [selectedTimeSlot, actualCoachId, coachSchedule, coachSlug, router]);

  return {
    // State
    loading,
    loadingState,
    error,
    coachName,
    selectedDate,
    setSelectedDate,
    availableDates,
    timeSlots,
    selectedTimeSlot,
    setSelectedTimeSlot,
    isBooking,
    coachSchedule,
    
    // Computed values
    timeSlotGroups,
    
    // Functions
    handleConfirmBooking,
    isDateDisabled,
    formatTime
  };
}
