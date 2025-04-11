"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, addDays, parseISO } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { 
  getCoachAvailability, 
  getCoachBusyTimes
} from "@/utils/actions/coach-availability";
import { type CoachSchedule } from "@/utils/types/coach-availability";
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

export interface BusyTime {
  start: string;
  end: string;
  source: string;
}

export function useBookingUI() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get coach identifiers from URL
  const coachId = searchParams.get("coachId") || undefined;
  const coachSlug = searchParams.get("slug") || undefined;
  
  // State variables
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachSchedule, setCoachSchedule] = useState<CoachSchedule | null>(null);
  const [busyTimes, setBusyTimes] = useState<BusyTime[]>([]);
  const [coachName, setCoachName] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [actualCoachId, setActualCoachId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced loading state
  const [loadingState, setLoadingState] = useState<LoadingState>({
    status: 'idle',
    context: ''
  });

  // Helper function to check if a date should be disabled
  const isDateDisabled = useCallback((date: Date) => {
    if (!date) return true;
    
    // First check: Is the date within the allowed booking window?
    const tomorrow = getTomorrowDate();
    const maxDate = getMaxBookingDate();
    
    if (date < tomorrow || date > maxDate) {
      return true; // Outside booking window - disable
    }
    
    // Second check: Is this a day the coach works on?
    const dayOfWeek = date.getDay();
    const dateDayName = getDayNameFromNumber(dayOfWeek);
    
    if (!dateDayName || !coachSchedule) {
      return true; // We don't have enough info - disable to be safe
    }
    
    // Check if this day is in the coach's schedule
    const isDayAvailable = coachSchedule.availability.some(slot => 
      slot.days.includes(dateDayName)
    );
    
    return !isDayAvailable; // Disable if not available
  }, [coachSchedule]);

  // Fetch coach data and schedule from server action
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
        // Use the server action to fetch coach data
        const result = await getCoachAvailability({
          coachId,
          slug: coachSlug
        });
        
        if (result.error) {
          console.error("[FETCH_COACH_ERROR]", {
            error: result.error,
            timestamp: new Date().toISOString()
          });
          
          setLoadingState({
            status: 'error',
            context: 'COACH_DATA',
            message: result.error.message || 'Failed to fetch coach information'
          });
          
          setError(result.error.message || 'Failed to fetch coach information');
          setLoading(false);
          return;
        }
        
        if (!result.data?.coach) {
          setError("Coach not found");
          setLoadingState({
            status: 'error',
            context: 'COACH_DATA',
            message: 'Coach not found'
          });
          setLoading(false);
          return;
        }
        
        // Set coach information
        const { coach, schedule } = result.data;
        setActualCoachId(coach.ulid);
        setCoachName(`${coach.firstName || ""} ${coach.lastName || ""}`);
        
        console.log('[DEBUG][BOOKING] Coach data loaded', { 
          coachId: coach.ulid,
          name: `${coach.firstName || ""} ${coach.lastName || ""}`,
          hasSchedule: !!schedule
        });
        
        if (schedule) {
          setCoachSchedule(schedule);
          console.log('[DEBUG][BOOKING] Schedule data loaded', {
            timeZone: schedule.timeZone,
            availabilityCount: schedule.availability.length,
            defaultDuration: schedule.defaultDuration
          });
          
          setLoadingState({
            status: 'success',
            context: 'COACH_DATA'
          });
        } else {
          console.warn('[DEBUG][BOOKING] No schedule data found for coach', { coachUlid: coach.ulid });
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
        
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCoachData();
  }, [coachId, coachSlug]);

  // Calculate available dates based on coach schedule
  useEffect(() => {
    if (!coachSchedule) return;
    
    console.log('[DEBUG][BOOKING] Calculating available dates from schedule');
    setLoadingState({
      status: 'loading',
      context: 'CALCULATING_DATES',
      message: 'Calculating available dates...'
    });
    
    // Get tomorrow and max date for the booking window
    const tomorrow = getTomorrowDate();
    const maxDate = getMaxBookingDate();
    
    const availableDays = new Set<number>();
    
    // Collect all days the coach is available
    coachSchedule.availability.forEach(slot => {
      slot.days.forEach(day => {
        // Convert from string day name to number (0-6, where 0 is Sunday)
        const dayNumber = dayMapping[day];
        if (dayNumber !== undefined) {
          availableDays.add(dayNumber);
        }
      });
    });
    
    console.log('[DEBUG][BOOKING] Available days of week', { 
      availableDays: Array.from(availableDays),
      availableDayNames: Array.from(availableDays).map(day => 
        Object.keys(dayMapping).find(key => dayMapping[key] === day)
      )
    });
    
    // Generate dates within the allowed booking window: tomorrow up to 15 days later
    // and only include days when the coach is available
    const dates: Date[] = [];
    
    // Start from tomorrow (no same-day bookings)
    for (let i = 0; i <= 15; i++) {
      const date = addDays(tomorrow, i);
      
      // Stop if we've reached beyond the max date
      if (date > maxDate) break;
      
      const dayOfWeek = date.getDay(); // 0-6, Sunday is 0
      
      if (availableDays.has(dayOfWeek)) {
        dates.push(date);
      }
    }
    
    console.log('[DEBUG][BOOKING] Available dates calculated', { 
      numDates: dates.length,
      dateRange: dates.length > 0 ? {
        firstDate: format(dates[0], 'yyyy-MM-dd'),
        lastDate: format(dates[dates.length - 1], 'yyyy-MM-dd')
      } : 'No dates available'
    });
    
    setAvailableDates(dates);
    
    // If we have dates and no selected date yet, select the first available date
    if (dates.length > 0 && (!selectedDate || isDateDisabled(selectedDate))) {
      console.log('[DEBUG][BOOKING] Setting default selected date', { 
        date: format(dates[0], 'yyyy-MM-dd')
      });
      setSelectedDate(dates[0]);
      setLoadingState({
        status: 'success',
        context: 'CALCULATING_DATES'
      });
    } else if (dates.length === 0) {
      // No dates available in booking window
      console.warn('[DEBUG][BOOKING] No available dates found in booking window');
      setError("No available booking slots in the next 15 days");
      setLoadingState({
        status: 'error',
        context: 'CALCULATING_DATES',
        message: 'No available dates found in the booking window'
      });
    }
  }, [coachSchedule, selectedDate, isDateDisabled]);

  // NOTE: Cal.com API integration commented out for testing local functionality
  /*
  // Fetch busy times when date is selected
  useEffect(() => {
    if (!selectedDate || !coachSchedule || !actualCoachId) return;

    const fetchBusyTimes = async () => {
      try {
        setLoadingState({
          status: 'loading',
          context: 'BUSY_TIMES',
          message: 'Checking coach availability...'
        });
        
        // Use server action to fetch busy times
        const result = await getCoachBusyTimes({
          coachId: actualCoachId,
          date: selectedDate.toISOString()
        });
        
        if (result.error) {
          console.error("[FETCH_BUSY_TIMES_ERROR]", result.error);
          setLoadingState({
            status: 'warning',
            context: 'BUSY_TIMES',
            message: 'Could not fetch coach calendar - showing all available slots'
          });
          setBusyTimes([]);
          return;
        }
        
        setBusyTimes(result.data || []);
        setLoadingState({ status: 'idle', context: 'BUSY_TIMES' });
      } catch (error) {
        console.error("[FETCH_BUSY_TIMES_ERROR]", error);
        setLoadingState({
          status: 'error',
          context: 'BUSY_TIMES',
          message: 'Failed to process busy times'
        });
      }
    };

    fetchBusyTimes();
  }, [selectedDate, actualCoachId, coachSchedule]);
  */

  // Calculate available time slots based on schedule and busy times
  useEffect(() => {
    if (!selectedDate || !coachSchedule) return;
    
    console.log('[DEBUG][BOOKING] Calculating time slots for selected date', {
      date: format(selectedDate, 'yyyy-MM-dd')
    });
    
    setLoadingState({
      status: 'loading',
      context: 'TIME_SLOTS',
      message: 'Calculating available time slots...'
    });
    
    // Get the day of week for the selected date (0-6, Sunday is 0)
    const dayOfWeek = selectedDate.getDay();
    
    // Convert day number to day name for matching with availability
    const selectedDayName = getDayNameFromNumber(dayOfWeek);
    
    console.log('[DEBUG][BOOKING] Selected day info', {
      dayOfWeek,
      dayName: selectedDayName
    });
    
    if (!selectedDayName) {
      console.error('[DEBUG][BOOKING] Invalid day selection', { dayOfWeek });
      setLoadingState({
        status: 'error',
        context: 'TIME_SLOTS',
        message: 'Invalid day selection'
      });
      return;
    }
    
    // Find availability slots for the selected day
    const daySlots = coachSchedule.availability.filter(slot => 
      slot.days.includes(selectedDayName)
    );
    
    console.log('[DEBUG][BOOKING] Availability slots for selected day', {
      dayName: selectedDayName,
      slotsCount: daySlots.length,
      slots: daySlots
    });
    
    if (daySlots.length === 0) {
      console.log('[DEBUG][BOOKING] No availability slots for selected day');
      setTimeSlots([]);
      setLoadingState({
        status: 'success',
        context: 'TIME_SLOTS',
        message: 'No time slots available on this day'
      });
      return;
    }
    
    // Generate time slots for the selected day
    const slots: TimeSlot[] = [];
    const slotDuration = coachSchedule.defaultDuration || 60; // minutes
    
    console.log('[DEBUG][BOOKING] Generating time slots with duration', {
      slotDuration
    });
    
    daySlots.forEach(slot => {
      const [startHour, startMinute] = slot.startTime.split(":").map(Number);
      const [endHour, endMinute] = slot.endTime.split(":").map(Number);
      
      let currentTime = new Date(selectedDate);
      currentTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(selectedDate);
      endTime.setHours(endHour, endMinute, 0, 0);
      
      console.log('[DEBUG][BOOKING] Processing availability slot', {
        startTime: slot.startTime,
        endTime: slot.endTime,
        formattedStart: format(currentTime, 'HH:mm'),
        formattedEnd: format(endTime, 'HH:mm')
      });
      
      // Generate slots until reaching end time
      while (currentTime < endTime) {
        const slotEndTime = new Date(currentTime);
        slotEndTime.setMinutes(currentTime.getMinutes() + slotDuration);
        
        // Check if this slot ends before or at the availability end time
        if (slotEndTime <= endTime) {
          slots.push({
            startTime: new Date(currentTime),
            endTime: slotEndTime
          });
        }
        
        // Move to next slot
        currentTime = new Date(slotEndTime);
      }
    });
    
    console.log('[DEBUG][BOOKING] Generated time slots before filtering', {
      count: slots.length,
      firstSlot: slots.length > 0 ? {
        start: format(slots[0].startTime, 'HH:mm'),
        end: format(slots[0].endTime, 'HH:mm')
      } : null,
      lastSlot: slots.length > 0 ? {
        start: format(slots[slots.length - 1].startTime, 'HH:mm'),
        end: format(slots[slots.length - 1].endTime, 'HH:mm')
      } : null
    });
    
    // Filter out slots that conflict with busy times
    console.log('[DEBUG][BOOKING] Filtering slots with busy times', {
      busyTimesCount: busyTimes.length
    });
    
    // NOTE: Cal.com API integration commented out for testing local functionality
    // Using all slots without filtering for busy times
    const availableSlots = slots;
    /*
    const availableSlots = slots.filter(slot => {
      // Check for conflicts with busy times
      const conflicts = busyTimes.some(busyTime => {
        const busyStart = parseISO(busyTime.start);
        const busyEnd = parseISO(busyTime.end);
        
        // Check if slot overlaps with busy time
        const overlaps = doesTimeSlotOverlapWithBusyTime(slot, busyStart, busyEnd);
        if (overlaps) {
          console.log('[DEBUG][BOOKING] Slot conflicts with busy time', {
            slot: {
              start: format(slot.startTime, 'HH:mm'),
              end: format(slot.endTime, 'HH:mm')
            },
            busy: {
              start: format(busyStart, 'HH:mm'),
              end: format(busyEnd, 'HH:mm')
            }
          });
        }
        return overlaps;
      });
      
      return !conflicts;
    });
    */
    
    console.log('[DEBUG][BOOKING] Final available time slots', {
      count: availableSlots.length,
      slots: availableSlots.map(slot => ({
        start: format(slot.startTime, 'HH:mm'),
        end: format(slot.endTime, 'HH:mm')
      }))
    });
    
    setTimeSlots(availableSlots);
    setSelectedTimeSlot(null); // Reset selected time slot when date changes
    
    setLoadingState({
      status: 'success',
      context: 'TIME_SLOTS'
    });
  }, [selectedDate, coachSchedule, busyTimes]);

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