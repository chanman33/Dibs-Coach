"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, addDays, parseISO } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { getCoachAvailability } from "@/utils/actions/coach-availability";
import { getCoachBusyTimes } from "@/utils/actions/coach-calendar";
import { type CoachSchedule } from "@/utils/types/coach-availability";
import { createBooking } from "@/utils/actions/booking-actions";
import { TimeSlot, TimeSlotGroup, LoadingState } from "@/utils/types/booking";
import {
  dayMapping,
  getTomorrowDate,
  getMaxBookingDate,
  getDayNameFromNumber,
  doesTimeSlotOverlapWithBusyTime
} from "@/utils/date-utils";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  getUserTimezone,
  createUtcDate,
  getHourInTimezone,
  formatUtcDateInTimezone
} from '@/utils/timezone-utils';

export interface BusyTime {
  start: string;
  end: string;
  source: string;
}

// Add this interface for tracking cached busy times
export interface BusyTimesCache {
  startDate: Date | null;
  endDate: Date | null;
  busyTimes: BusyTime[];
  lastFetched: Date | null;
}

export function useBookingUI() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  // Get coach identifiers from URL
  const coachId = searchParams.get("coachId") || undefined;
  const coachSlug = searchParams.get("slug") || undefined;
  
  // State variables
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachSchedule, setCoachSchedule] = useState<CoachSchedule | null>(null);
  const [busyTimesCache, setBusyTimesCache] = useState<BusyTimesCache>({
    startDate: null,
    endDate: null,
    busyTimes: [],
    lastFetched: null
  });
  const [coachName, setCoachName] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [actualCoachId, setActualCoachId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coachTimezone, setCoachTimezone] = useState<string | undefined>(undefined);
  
  // Enhanced loading state
  const [loadingState, setLoadingState] = useState<LoadingState>({
    status: 'loading',
    context: 'initial'
  });

  // Helper function to check if a date should be disabled
  const isDateDisabled = useCallback((date: Date) => {
    if (!date) return true;
    
    // Get the booking window boundaries
    const tomorrow = getTomorrowDate();
    const maxDate = getMaxBookingDate();
    
    // CRITICAL FIX: The date should be DISABLED if it's OUTSIDE the booking window
    // This was previously reversed - we were disabling dates we should enable!
    if (date >= tomorrow && date <= maxDate) {
      // Date is WITHIN the booking window - it should be ENABLED (return false to NOT disable)
      return false;
    } else {
      // Date is OUTSIDE the booking window - it should be DISABLED (return true to disable)
      return true;
    }
  }, []);

  // Wrapped setSelectedDate to add logging and validation
  const handleDateChange = (date: Date | null) => {
    console.log('[DEBUG][BOOKING_UI] Date changed:', date);
    setSelectedDate(date);
  };

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
        
        // Get the timezone, prioritizing Cal.com integration timezone
        // This fetching is handled in getCoachAvailability server action
        // Will be consistent with the timezone shown in coach's dashboard
        const coachTimezoneSrc = schedule?.timeZone;
        setCoachTimezone(coachTimezoneSrc);
        
        console.log('[DEBUG][BOOKING] Coach data loaded', { 
          coachId: coach.ulid,
          name: `${coach.firstName || ""} ${coach.lastName || ""}`,
          hasSchedule: !!schedule,
          timezone: coachTimezoneSrc || 'undefined'
        });
        
        if (schedule) {
          setCoachSchedule(schedule);
          console.log('[DEBUG][BOOKING] Schedule data loaded', {
            timeZone: schedule.timeZone,
            availabilityCount: schedule.availability.length,
            availabilityDetails: schedule.availability.map(slot => ({
              days: slot.days,
              startTime: slot.startTime,
              endTime: slot.endTime
            })),
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
          setCoachTimezone(undefined);
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
    
    // Log booking window details
    console.log('[DEBUG][BOOKING_WINDOW]', {
      tomorrowDate: format(tomorrow, 'yyyy-MM-dd'),
      maxDate: format(maxDate, 'yyyy-MM-dd'),
      windowDays: 15,
      currentDate: format(new Date(), 'yyyy-MM-dd')
    });
    
    // Track days the coach is available (for highlighting in UI)
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
    
    // Generate ALL dates within the allowed booking window (15 days)
    const dates: Date[] = [];
    
    // Start from tomorrow (no same-day bookings) and go for 15 days
    for (let i = 0; i <= 14; i++) {
      const date = addDays(tomorrow, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const withinWindow = date >= tomorrow && date <= maxDate;
      
      console.log(`[DEBUG][DATE_GENERATION] Date ${i+1}/15: ${dateStr}, within window: ${withinWindow}`);
      
      dates.push(date);
    }
    
    console.log('[DEBUG][BOOKING] Available dates calculated', { 
      numDates: dates.length,
      dateRange: dates.length > 0 ? {
        firstDate: format(dates[0], 'yyyy-MM-dd'),
        lastDate: format(dates[dates.length - 1], 'yyyy-MM-dd')
      } : 'No dates available'
    });
    
    // Keep track of all dates in the booking window
    setAvailableDates(dates);
    
    // If we have dates and no selected date yet, select the first available date
    if (dates.length > 0 && !selectedDate) {
      console.log('[DEBUG][BOOKING] Setting default selected date', { 
        date: format(dates[0], 'yyyy-MM-dd')
      });
      setSelectedDate(dates[0]);
      setLoadingState({
        status: 'success',
        context: 'CALCULATING_DATES'
      });
    } else if (dates.length === 0) {
      // This should never happen as we're including all dates in the window
      console.warn('[DEBUG][BOOKING] No available dates found in booking window');
      setError("No available booking slots in the next 15 days");
      setLoadingState({
        status: 'error',
        context: 'CALCULATING_DATES',
        message: 'No available dates found in the booking window'
      });
    }
  }, [coachSchedule, selectedDate]);

  // Fetch busy times when date is selected, but with caching
  useEffect(() => {
    if (!selectedDate || !coachSchedule || !actualCoachId) return;

    const fetchBusyTimes = async () => {
      try {
        setLoadingState({
          status: 'loading',
          context: 'BUSY_TIMES',
          message: 'Checking coach availability...'
        });
        
        // Check if we already have this date in our cache
        const dateInCache = busyTimesCache.startDate && busyTimesCache.endDate && 
                           selectedDate >= busyTimesCache.startDate && 
                           selectedDate <= busyTimesCache.endDate;
        
        // Calculate cache age in minutes
        const cacheAge = busyTimesCache.lastFetched 
          ? Math.floor((Date.now() - busyTimesCache.lastFetched.getTime()) / (1000 * 60)) 
          : Number.MAX_SAFE_INTEGER;
        
        // Cache expires after 30 minutes to ensure we have fresh calendar data
        const isCacheExpired = cacheAge > 30;
        
        // If the date is already in our cache and cache is not expired, use cached data
        if (dateInCache && !isCacheExpired) {
          console.log("[BUSY_TIMES] Using cached busy times", {
            selectedDate: selectedDate.toISOString().split('T')[0],
            cacheStartDate: busyTimesCache.startDate?.toISOString().split('T')[0],
            cacheEndDate: busyTimesCache.endDate?.toISOString().split('T')[0],
            cachedTimesCount: busyTimesCache.busyTimes.length,
            cacheAgeMinutes: cacheAge
          });
          
          setLoadingState({ status: 'success', context: 'BUSY_TIMES' });
          return;
        }
        
        // Fetch a month's worth of busy times starting from the selected date
        console.log("[BUSY_TIMES] Fetching new 31-day range", {
          startDate: selectedDate.toISOString().split('T')[0],
          reason: isCacheExpired ? "Cache expired" : "Date not in cache"
        });
        
        // Use server action to fetch busy times for a month
        const result = await getCoachBusyTimes({
          coachId: actualCoachId,
          date: selectedDate.toISOString(),
          days: 31 // Fetch a full month of busy times to cover the entire booking window
        });
        
        if (result.error) {
          console.error("[FETCH_BUSY_TIMES_ERROR]", result.error);
          setLoadingState({
            status: 'success',
            context: 'BUSY_TIMES',
            message: 'Could not fetch coach calendar - showing all available slots'
          });
          
          // Clear the cache on error
          setBusyTimesCache({
            startDate: null,
            endDate: null,
            busyTimes: [],
            lastFetched: null
          });
          return;
        }
        
        const busyTimes = result.data || [];
        console.log("[BUSY_TIMES] Successfully fetched", {
          count: busyTimes.length, 
          sampleTimes: busyTimes.slice(0, 2) || [],
          dateRange: "Month-long range"
        });
        
        // Calculate end date (31 days from selected date)
        const endDate = new Date(selectedDate);
        endDate.setDate(endDate.getDate() + 30); // 31 days total including start date
        
        // Update the cache with the new data
        setBusyTimesCache({
          startDate: selectedDate,
          endDate: endDate,
          busyTimes: busyTimes,
          lastFetched: new Date()
        });
        
        setLoadingState({ status: 'success', context: 'BUSY_TIMES' });
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

  // Calculate available time slots based on schedule and busy times from cache
  useEffect(() => {
    if (!selectedDate || !coachSchedule || !coachTimezone) return;
    
    // Validate selected date is within booking window
    const tomorrow = getTomorrowDate();
    const maxDate = getMaxBookingDate();
    
    if (selectedDate < tomorrow || selectedDate > maxDate) {
      console.error('[DEBUG][BOOKING] Selected date is outside booking window', {
        selectedDate: format(selectedDate, 'yyyy-MM-dd'),
        tomorrow: format(tomorrow, 'yyyy-MM-dd'),
        maxDate: format(maxDate, 'yyyy-MM-dd')
      });
      
      // If somehow an invalid date got through, fix it by selecting first available date
      if (availableDates.length > 0) {
        console.log('[DEBUG][BOOKING] Selecting first available date as fallback');
        setSelectedDate(availableDates[0]);
      }
      return;
    }
    
    console.log('[DEBUG][BOOKING] Calculating UTC time slots for selected date', {
      date: format(selectedDate, 'yyyy-MM-dd'),
      coachTimezone,
      userTimezone: getUserTimezone(),
      isDateDisabled: isDateDisabled(selectedDate)
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
      dayName: selectedDayName,
      dayOfWeekType: typeof dayOfWeek
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
    // IMPORTANT FIX: Ensure we're handling number days as well as string days
    const daySlots = coachSchedule.availability.filter(slot => {
      if (!slot.days || !Array.isArray(slot.days)) return false;
      
      // Handle both number and string day formats
      return slot.days.some(day => {
        if (typeof day === 'number') {
          // If day is stored as number (0-6), compare directly with dayOfWeek
          return day === dayOfWeek;
        } else if (typeof day === 'string') {
          // If day is stored as string, compare with selectedDayName
          return day.toUpperCase() === selectedDayName;
        }
        return false;
      });
    });
    
    console.log('[DEBUG][BOOKING] Availability slots for selected day', {
      dayName: selectedDayName,
      slotsCount: daySlots.length,
      slots: daySlots, // Log the raw string times from schedule
      fullCoachSchedule: coachSchedule.availability.map(slot => ({
        days: slot.days,
        startTime: slot.startTime,
        endTime: slot.endTime,
        dayTypes: slot.days.map(d => typeof d)
      }))
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
    
    // Array to hold TimeSlot objects with correct UTC Date instances
    const utcSlots: TimeSlot[] = [];
    const slotDuration = 30; // minutes - hardcoded to ensure consistent available slots
    
    console.log('[DEBUG][BOOKING] Generating UTC time slots with duration', {
      slotDuration,
      originalDefaultDuration: coachSchedule.defaultDuration || 60
    });

    daySlots.forEach(slot => {
      // Verify the slot has valid startTime and endTime
      if (!slot.startTime || !slot.endTime) {
        console.warn('[DEBUG][BOOKING] Invalid slot', { slot });
        return;
      }
      
      // Create correct UTC Date objects based on coach's time string and timezone
      try {
        let currentUtcTime = createUtcDate(selectedDate, slot.startTime, coachTimezone);
        const endUtcTime = createUtcDate(selectedDate, slot.endTime, coachTimezone);

        console.log('[DEBUG][BOOKING] Processing availability slot (UTC)', {
          coachStartTimeStr: slot.startTime,
          coachEndTimeStr: slot.endTime,
          coachTimezone,
          generatedStartUtc: currentUtcTime.toISOString(),
          generatedEndUtc: endUtcTime.toISOString()
        });

        // Iterate using UTC Date objects
        while (currentUtcTime < endUtcTime) {
          const slotEndUtcTime = new Date(currentUtcTime.getTime() + slotDuration * 60000);

          if (slotEndUtcTime <= endUtcTime) {
            utcSlots.push({
              startTime: new Date(currentUtcTime), // Clone to avoid reference issues
              endTime: new Date(slotEndUtcTime)    // Clone to avoid reference issues
            });
          }
          currentUtcTime = new Date(slotEndUtcTime); // Clone to avoid reference issues
        }
      } catch (err) {
        console.error('[DEBUG][BOOKING] Error creating UTC dates', {
          error: err,
          slot,
          selectedDate: selectedDate.toISOString()
        });
      }
    });

    console.log('[DEBUG][BOOKING] Generated UTC slots before filtering', {
      count: utcSlots.length,
      slots: utcSlots.slice(0, 3).map(s => ({
        start: s.startTime.toISOString(),
        end: s.endTime.toISOString()
      }))
    });

    // availableSlots now holds correct UTC Date objects
    let availableUtcSlots = utcSlots;

    // Filter slots that overlap with busy times from cache
    if (busyTimesCache.busyTimes.length > 0) {
      console.log('[DEBUG][BOOKING] Filtering slots with busy times', {
        totalSlots: utcSlots.length,
        busyTimesCount: busyTimesCache.busyTimes.length
      });

      // Filter out slots that conflict with busy times
      availableUtcSlots = utcSlots.filter(slot => {
        // Check each busy time for conflicts
        return !busyTimesCache.busyTimes.some(busyTime => {
          const busyStart = new Date(busyTime.start);
          const busyEnd = new Date(busyTime.end);
          
          // Use the utility function to check for overlap
          const overlaps = doesTimeSlotOverlapWithBusyTime(slot, busyStart, busyEnd);
          
          if (overlaps) {
            console.log('[DEBUG][BOOKING] Excluding slot due to calendar conflict', {
              slotStart: slot.startTime.toISOString(),
              slotEnd: slot.endTime.toISOString(),
              busyStart: busyStart.toISOString(),
              busyEnd: busyEnd.toISOString(),
              source: busyTime.source || 'External Calendar'
            });
          }
          
          return overlaps;
        });
      });

      console.log('[DEBUG][BOOKING] Filtering results', { 
        originalCount: utcSlots.length,
        filteredCount: availableUtcSlots.length,
        removedCount: utcSlots.length - availableUtcSlots.length
      });
    }

    // Add back the final debug log:
    console.log('[DEBUG][BOOKING] Final available UTC time slots', {
      count: availableUtcSlots.length,
      slots: availableUtcSlots.map(slot => ({
        startUtc: slot.startTime.toISOString(),
        endUtc: slot.endTime.toISOString(),
        // Format for display log in user's timezone
        userDisplayTime: formatUtcDateInTimezone(slot.startTime, getUserTimezone()),
        // Format for display log in coach's timezone
        coachDisplayTime: formatUtcDateInTimezone(slot.startTime, coachTimezone)
      }))
    });

    // Set state with the array of correct UTC TimeSlots
    setTimeSlots(availableUtcSlots);
    setSelectedTimeSlot(null);
    setLoadingState({ status: 'success', context: 'TIME_SLOTS' });
  }, [selectedDate, coachSchedule, coachTimezone, busyTimesCache]);

  // Prepare times for rendering by grouping based on user's timezone hour
  const timeSlotGroups = useMemo<TimeSlotGroup[]>(() => {
    if (!timeSlots.length || !coachTimezone) return [];

    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];
    const userTimezone = getUserTimezone();

    timeSlots.forEach(slot => {
      // Get the hour in the user's local timezone from the UTC Date object
      const hourInUserTz = getHourInTimezone(slot.startTime, userTimezone);

      if (hourInUserTz < 12) {
        morning.push(slot);
      } else if (hourInUserTz < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    // Sort slots within each group based on UTC time (which is reliable)
    const sortByUtcStartTime = (a: TimeSlot, b: TimeSlot) => {
      return a.startTime.getTime() - b.startTime.getTime();
    };

    morning.sort(sortByUtcStartTime);
    afternoon.sort(sortByUtcStartTime);
    evening.sort(sortByUtcStartTime);

    const groups = [
      { title: "Morning", slots: morning },
      { title: "Afternoon", slots: afternoon },
      { title: "Evening", slots: evening }
    ].filter(group => group.slots.length > 0);

    console.log('[DEBUG][BOOKING] Time slot groups for UI (based on user timezone)', {
      morning: morning.length,
      afternoon: afternoon.length,
      evening: evening.length,
      totalGroups: groups.length,
      // Log formatted times for verification
      morningTimes: morning.map(slot => formatUtcDateInTimezone(slot.startTime, userTimezone)),
      afternoonTimes: afternoon.map(slot => formatUtcDateInTimezone(slot.startTime, userTimezone)),
      eveningTimes: evening.map(slot => formatUtcDateInTimezone(slot.startTime, userTimezone))
    });

    return groups;
  }, [timeSlots, coachTimezone]);

  // Handle booking confirmation - Pass UTC ISO strings if needed by API
  const handleConfirmBooking = useCallback(async () => {
    if (!selectedTimeSlot || !actualCoachId || !coachTimezone) return;

    const startTimeUtcIso = selectedTimeSlot.startTime.toISOString();
    const endTimeUtcIso = selectedTimeSlot.endTime.toISOString();

    console.log('[DEBUG][BOOKING] Starting booking confirmation (UTC)', {
      coachId: actualCoachId,
      startTimeUtc: startTimeUtcIso,
      endTimeUtc: endTimeUtcIso,
      coachTimezone, // Coach's original TZ for reference
      userTimezone: getUserTimezone() // User's TZ for reference
    });

    setIsBooking(true);
    setLoadingState({ status: 'loading', context: 'BOOKING', message: 'Creating your booking...' });

    try {
      // --- TEST MODE --- //
      setTimeout(() => {
        setLoadingState({ status: 'success', context: 'BOOKING', message: 'Booking created successfully! (TEST MODE)'});
        toast({ title: "Booking Confirmed (Test Mode)", description: "This is a test booking and was not actually created. In production, this would create a real booking." });
        setIsBooking(false);
        const coachIdentifier = coachSlug ? `slug=${coachSlug}` : `coachId=${actualCoachId}`;
        // Pass the reliable UTC ISO strings
        router.push(`/booking/booking-success?${coachIdentifier}&startTime=${encodeURIComponent(startTimeUtcIso)}&endTime=${encodeURIComponent(endTimeUtcIso)}&bookingUid=test-booking&testMode=true`);
      }, 1500);
      // --- END TEST MODE --- //

      /* --- PRODUCTION CODE (Requires API update if not expecting UTC) --- //
      const result = await createBooking({
        eventTypeId: 12345, // Placeholder
        startTime: startTimeUtcIso, // Send UTC ISO string
        endTime: endTimeUtcIso,     // Send UTC ISO string
        attendeeName: "Test User", // Placeholder
        attendeeEmail: "test@example.com", // Placeholder
        timeZone: coachTimezone, // Maybe needed by API? Consult Cal.com docs
        notes: "Booked via local testing"
      });
      // ... [rest of production error handling/redirect] ...
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
  }, [selectedTimeSlot, actualCoachId, coachSchedule, coachSlug, router, coachTimezone]);

  // Format time for display (kept for BookingSummary, should ideally be updated there too)
  const formatTime = useCallback((time: string | Date) => {
    try {
      const date = typeof time === "string" ? parseISO(time) : time;
      // Format using user's local timezone for BookingSummary
      // This assumes the Date object passed *to BookingSummary* is already correct for user's locale
      return format(date, "h:mm a");
    } catch (error) {
        console.error("[FORMAT_TIME_ERROR] Failed to format time for BookingSummary", { time, error });
        return "Invalid Time";
    }
  }, []);

  return {
    loading,
    loadingState,
    error,
    coachName,
    selectedDate,
    setSelectedDate: handleDateChange,
    availableDates,
    timeSlots, // Now contains UTC Date objects
    selectedTimeSlot,
    setSelectedTimeSlot,
    isBooking,
    coachSchedule,
    coachTimezone, // Ensure this is returned

    timeSlotGroups, // Correctly grouped by user's timezone hour

    handleConfirmBooking,
    isDateDisabled,
    formatTime // Keep for BookingSummary
  };
} 