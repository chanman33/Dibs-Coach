"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, addDays, parseISO } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { getCoachAvailability } from "@/utils/actions/coach-availability";
import { getCoachBusyTimes } from "@/utils/actions/coach-calendar";
import { type CoachSchedule, type CalEventType } from "@/utils/types/coach-availability";
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
import { getCoachEventTypes } from "@/utils/actions/coach-event-types";
import { useUser } from '@clerk/nextjs';

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
  const { user, isLoaded: isUserLoaded } = useUser();
  
  // Get coach identifiers from URL
  const coachId = searchParams.get("coachId") || undefined;
  const coachSlug = searchParams.get("slug") || undefined;
  
  // State variables
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [potentialDatesInWindow, setPotentialDatesInWindow] = useState<Date[]>([]);
  const [datesWithActualSlots, setDatesWithActualSlots] = useState<Date[]>([]);
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
  const [coachProfileImage, setCoachProfileImage] = useState<string | null>(null);
  const [coachSpecialty, setCoachSpecialty] = useState<string | null>(null);
  const [coachDomains, setCoachDomains] = useState<string[] | null>(null);
  const [coachSlogan, setCoachSlogan] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [actualCoachId, setActualCoachId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coachTimezone, setCoachTimezone] = useState<string | undefined>(undefined);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(4);
  const [bookingDetails, setBookingDetails] = useState<{
    startTime: string;
    endTime: string;
    eventTypeName: string;
  } | null>(null);
  
  // Event type related state
  const [eventTypes, setEventTypes] = useState<CalEventType[]>([]);
  const [selectedEventTypeId, setSelectedEventTypeId] = useState<string | null>(null);
  
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
        setCoachProfileImage(coach.profileImageUrl || null);
        setCoachSpecialty(coach.coachPrimaryDomain || null);
        setCoachDomains(coach.coachRealEstateDomains || null);
        setCoachSlogan(coach.slogan || null);
        
        // Fetch event types from our new server action
        const eventTypesResult = await getCoachEventTypes({
          coachUlid: coach.ulid
        });
        
        if (eventTypesResult.error) {
          console.error("[FETCH_EVENT_TYPES_ERROR]", {
            error: eventTypesResult.error,
            timestamp: new Date().toISOString()
          });
          
          // Set a default event type in case of error
          setEventTypes([{
            id: 'default',
            name: 'Coaching Session',
            description: 'Regular coaching session',
            duration: schedule?.defaultDuration || 30,
            schedulingType: 'MANAGED'
          }]);
        } else if (eventTypesResult.data && eventTypesResult.data.length > 0) {
          // Set the fetched event types
          setEventTypes(eventTypesResult.data);
          
          // Log the event types for debugging
          console.log('[DEBUG][BOOKING] Event types loaded', {
            count: eventTypesResult.data.length,
            eventTypes: eventTypesResult.data.map(et => ({
              id: et.id,
              name: et.title || et.name,
              duration: et.length || et.duration
            }))
          });
        } else {
          // If no event types were found, create a default one
          setEventTypes([{
            id: 'default',
            name: 'Coaching Session',
            description: 'Regular coaching session',
            duration: schedule?.defaultDuration || 30,
            schedulingType: 'MANAGED'
          }]);
        }
        
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

  // Calculate initial potential available dates based on coach schedule window
  useEffect(() => {
    if (!coachSchedule) return;
    
    console.log('[DEBUG][BOOKING] Calculating potential dates within booking window');
    setLoadingState({
      status: 'loading',
      context: 'CALCULATING_POTENTIAL_DATES',
      message: 'Identifying potential dates...' 
    });
    
    const tomorrow = getTomorrowDate();
    const maxDate = getMaxBookingDate();
    
    console.log('[DEBUG][BOOKING_WINDOW]', {
      tomorrowDate: format(tomorrow, 'yyyy-MM-dd'),
      maxDate: format(maxDate, 'yyyy-MM-dd'),
      windowDays: 15, 
      currentDate: format(new Date(), 'yyyy-MM-dd')
    });
    
    // Generate ALL dates within the allowed booking window (15 days)
    const potentialDates: Date[] = [];
    for (let i = 0; i <= 14; i++) {
      const date = addDays(tomorrow, i);
      if (date <= maxDate) { // Ensure we don't exceed max date
        // Optional: Filter out days the coach NEVER works on (optimization)
        // This requires checking coachSchedule.availability days
        const dayOfWeek = date.getDay();
        const dayName = getDayNameFromNumber(dayOfWeek);
        const isGenerallyAvailable = coachSchedule.availability.some(slot => 
          slot.days.some(day => {
            if (typeof day === 'number') return day === dayOfWeek;
            if (typeof day === 'string') return day.toUpperCase() === dayName?.toUpperCase();
            return false;
          })
        );

        if (isGenerallyAvailable) {
           console.log(`[DEBUG][POTENTIAL_DATE_GENERATION] Date ${i+1}/15: ${format(date, 'yyyy-MM-dd')} - Potential`);
           potentialDates.push(date);
        } else {
           console.log(`[DEBUG][POTENTIAL_DATE_GENERATION] Date ${i+1}/15: ${format(date, 'yyyy-MM-dd')} - Excluded (Not a working day)`);
        }
      } else {
        console.log(`[DEBUG][POTENTIAL_DATE_GENERATION] Date ${i+1}/15: ${format(date, 'yyyy-MM-dd')} - Excluded (Outside window)`);
      }
    }
    
    console.log('[DEBUG][BOOKING] Potential dates calculated', { 
      numDates: potentialDates.length,
      dateRange: potentialDates.length > 0 ? {
        firstDate: format(potentialDates[0], 'yyyy-MM-dd'),
        lastDate: format(potentialDates[potentialDates.length - 1], 'yyyy-MM-dd')
      } : 'No potential dates'
    });
    
    // Set the potential dates - the actual filtering happens later
    setPotentialDatesInWindow(potentialDates);
    
    // Auto-select logic moved to the effect that calculates datesWithActualSlots
    // to ensure the first selected date *has* slots.
    setLoadingState({
      status: 'success',
      context: 'CALCULATING_POTENTIAL_DATES'
    });

  }, [coachSchedule]); // Only depends on the schedule

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
  // Now considers event type duration for conflict checking
  useEffect(() => {
    if (!selectedDate || !coachSchedule || !coachTimezone) return;

    // Get the event type duration
    const currentEventType = eventTypes.find(et => et.id === selectedEventTypeId);
    const eventTypeDuration = currentEventType ? 
      (currentEventType.length || currentEventType.duration || coachSchedule.defaultDuration || 30) 
      : (coachSchedule.defaultDuration || 30);
    
    console.log('[DEBUG][BOOKING] Calculating time slots with event duration', {
      selectedEventTypeId,
      eventTypeDuration,
      eventTypeName: currentEventType?.title || currentEventType?.name
    });
    
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
      if (potentialDatesInWindow.length > 0) {
        console.log('[DEBUG][BOOKING] Selecting first available date as fallback');
        setSelectedDate(potentialDatesInWindow[0]);
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
    // Use a consistent slot increment of 30 min but properly check for duration conflicts
    const slotIncrement = 30; // We'll generate 30 min increments for consistency
    
    console.log('[DEBUG][BOOKING] Generating UTC time slots with duration', {
      slotIncrement,
      eventTypeDuration,
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
          // Calculate the end time based on the event duration
          const slotEndUtcTime = new Date(currentUtcTime.getTime() + slotIncrement * 60000);
          const eventEndUtcTime = new Date(currentUtcTime.getTime() + eventTypeDuration * 60000);

          // Check if we have enough time for this slot within the coach's availability
          if (eventEndUtcTime <= endUtcTime) {
            utcSlots.push({
              startTime: new Date(currentUtcTime), // Clone to avoid reference issues
              endTime: new Date(eventEndUtcTime)   // Use event duration for end time
            });
          }
          currentUtcTime = new Date(slotEndUtcTime); // Increment by standard 30 min for slot generation
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
      eventTypeDuration,
      slots: utcSlots.slice(0, 3).map(s => ({
        start: s.startTime.toISOString(),
        end: s.endTime.toISOString(),
        durationMinutes: (s.endTime.getTime() - s.startTime.getTime()) / 60000
      }))
    });

    // availableSlots now holds correct UTC Date objects
    let availableUtcSlots = utcSlots;

    // Filter slots that overlap with busy times from cache
    if (busyTimesCache.busyTimes.length > 0) {
      console.log('[DEBUG][BOOKING] Filtering slots with busy times', {
        totalSlots: utcSlots.length,
        busyTimesCount: busyTimesCache.busyTimes.length,
        eventTypeDuration
      });

      // Filter out slots that conflict with busy times, considering event duration
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
              slotDuration: (slot.endTime.getTime() - slot.startTime.getTime()) / 60000,
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
        removedCount: utcSlots.length - availableUtcSlots.length,
        eventTypeDuration
      });
    }

    // Add back the final debug log:
    console.log('[DEBUG][BOOKING] Final available UTC time slots', {
      count: availableUtcSlots.length,
      eventTypeDuration,
      slots: availableUtcSlots.map(slot => ({
        startUtc: slot.startTime.toISOString(),
        endUtc: slot.endTime.toISOString(),
        durationMinutes: (slot.endTime.getTime() - slot.startTime.getTime()) / 60000,
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
  }, [selectedDate, coachSchedule, coachTimezone, busyTimesCache, selectedEventTypeId, eventTypes]);

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
  const handleConfirmBooking = async (sessionTopic?: string) => {
    if (!selectedTimeSlot || !actualCoachId || !selectedEventTypeId) {
      toast({
        title: "Unable to book session",
        description: "Please select a time slot and session type first.",
        variant: "destructive"
      });
      return;
    }
    
    // Get the selected event type and its duration
    const selectedEventType = eventTypes.find(et => et.id === selectedEventTypeId);
    const eventTypeDuration = selectedEventType ? 
      (selectedEventType.length || selectedEventType.duration || 30) : 30;
    
    setIsBooking(true);
    
    try {
      // Check if user is authenticated using Clerk
      if (!isUserLoaded || !user || !user.emailAddresses || user.emailAddresses.length === 0) {
        throw new Error("User information not available. Please sign in again.");
      }
      
      // Get the primary email
      const primaryEmail = user.emailAddresses[0].emailAddress;
      const userTimezone = getUserTimezone();
      
      console.log("[BOOKING] Creating booking through API", {
        coachId: actualCoachId,
        startTime: selectedTimeSlot.startTime.toISOString(),
        eventTypeId: selectedEventTypeId,
        userEmail: primaryEmail
      });
      
      // Create booking through our backend API that will handle Cal.com integration
      const response = await fetch('/api/cal/booking/create-a-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventTypeId: selectedEventTypeId,
          startTime: selectedTimeSlot.startTime.toISOString(),
          endTime: selectedTimeSlot.endTime.toISOString(),
          attendeeName: user.fullName || primaryEmail,
          attendeeEmail: primaryEmail,
          timeZone: userTimezone,
          notes: sessionTopic || '',
          customInputs: {
            'session-topic': sessionTopic || 'No topic provided'
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create booking');
      }
      
      // Format times for display
      const formattedStartTime = format(selectedTimeSlot.startTime, "EEEE, MMMM d, yyyy 'at' h:mm a");
      const formattedEndTime = format(selectedTimeSlot.endTime, "h:mm a");
      
      // Set booking details for success modal
      setBookingDetails({
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        eventTypeName: selectedEventType?.title || selectedEventType?.name || "Coaching Session"
      });
      
      // Show success modal
      setShowSuccessModal(true);
      setRedirectCountdown(4);
    } catch (error) {
      console.error("[BOOKING_ERROR]", {
        error,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Booking failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
    }
  };

  // Add this useEffect below your function definitions, inside useBookingUI
  useEffect(() => {
    if (!showSuccessModal) return;
    setRedirectCountdown(4);
    const intervalId = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(intervalId);
          router.push("/dashboard/mentee/sessions");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, [showSuccessModal]);

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

  // Calculate DATES WITH ACTUAL SLOTS based on potential dates and busy times
  useEffect(() => {
    // Wait until we have potential dates, schedule, and busy times (or know they failed to load)
    if (!coachSchedule || !coachTimezone || potentialDatesInWindow.length === 0 || 
        (loadingState.context === 'BUSY_TIMES' && loadingState.status === 'loading')) {
      console.log('[DEBUG][DATES_WITH_SLOTS] Waiting for schedule/potential dates/busy times...');
      return;
    }

    console.log('[DEBUG][DATES_WITH_SLOTS] Calculating dates with actual slots...');
    setLoadingState({
      status: 'loading',
      context: 'CALCULATING_DATES_WITH_SLOTS',
      message: 'Finding dates with available slots...'
    });

    const confirmedBookableDates: Date[] = [];
    const slotDuration = 30; // Use consistent slot duration
    const currentBusyTimes = busyTimesCache.busyTimes;
    
    console.log('[DEBUG][DATES_WITH_SLOTS] Using busy times for calculation:', { count: currentBusyTimes.length });

    // Iterate through potential dates
    potentialDatesInWindow.forEach(date => {
      // Generate and filter slots for *this specific date*
      const dayOfWeek = date.getDay();
      const dayName = getDayNameFromNumber(dayOfWeek);
      
      if (!dayName) return; // Skip if day name invalid
      
      // Find schedule slots for this day
      const dayScheduleSlots = coachSchedule.availability.filter(slot => {
        if (!slot.days || !Array.isArray(slot.days)) return false;
        return slot.days.some(day => {
          if (typeof day === 'number') return day === dayOfWeek;
          if (typeof day === 'string') return day.toUpperCase() === dayName.toUpperCase();
          return false;
        });
      });
      
      if (dayScheduleSlots.length === 0) return; // Skip if no schedule for this day
      
      // Generate potential UTC slots for this day
      const potentialUtcSlots: TimeSlot[] = [];
      dayScheduleSlots.forEach(scheduleSlot => {
         if (!scheduleSlot.startTime || !scheduleSlot.endTime) return;
         try {
            let currentUtcTime = createUtcDate(date, scheduleSlot.startTime, coachTimezone);
            const endUtcTime = createUtcDate(date, scheduleSlot.endTime, coachTimezone);
            while (currentUtcTime < endUtcTime) {
              const slotEndUtcTime = new Date(currentUtcTime.getTime() + slotDuration * 60000);
              if (slotEndUtcTime <= endUtcTime) {
                potentialUtcSlots.push({ startTime: new Date(currentUtcTime), endTime: new Date(slotEndUtcTime) });
              }
              currentUtcTime = new Date(slotEndUtcTime);
            }
         } catch (err) { /* Handle error if needed */ }
      });
      
      // Filter against busy times
      const finalSlotsForDate = potentialUtcSlots.filter(slot => 
         !currentBusyTimes.some(busyTime => 
            doesTimeSlotOverlapWithBusyTime(slot, new Date(busyTime.start), new Date(busyTime.end))
         )
      );
      
      // If slots exist for this date, add it to the list
      if (finalSlotsForDate.length > 0) {
        confirmedBookableDates.push(date);
         console.log(`[DEBUG][DATES_WITH_SLOTS] Found ${finalSlotsForDate.length} slots for ${format(date, 'yyyy-MM-dd')} - Adding to bookable list.`);
      } else {
         console.log(`[DEBUG][DATES_WITH_SLOTS] No slots found for ${format(date, 'yyyy-MM-dd')} after filtering.`);
      }
    });

    console.log('[DEBUG][DATES_WITH_SLOTS] Final bookable dates calculated', {
      numDates: confirmedBookableDates.length,
      dates: confirmedBookableDates.map(d => format(d, 'yyyy-MM-dd'))
    });
    
    setDatesWithActualSlots(confirmedBookableDates);
    
    // Auto-select the first available date *with slots* if none selected or current invalid
    if (confirmedBookableDates.length > 0) {
      const isCurrentSelectionValidAndBookable = selectedDate && 
                                             !isDateDisabled(selectedDate) &&
                                             confirmedBookableDates.some(d => d.getTime() === selectedDate.getTime());

      if (!isCurrentSelectionValidAndBookable) {
        console.log('[DEBUG][BOOKING] Setting default selected date from dates *with slots*', { 
          date: format(confirmedBookableDates[0], 'yyyy-MM-dd')
        });
        setSelectedDate(confirmedBookableDates[0]); 
      }
      setLoadingState({
        status: 'success',
        context: 'CALCULATING_DATES_WITH_SLOTS'
      });
    } else {
      console.warn('[DEBUG][BOOKING] No dates with available slots found in booking window');
      setError("No available booking slots found in the next 15 days.");
      setSelectedDate(null); // Clear selection
      setDatesWithActualSlots([]); // Ensure it's empty
      setLoadingState({
        status: 'error',
        context: 'CALCULATING_DATES_WITH_SLOTS',
        message: 'No available dates with slots found'
      });
    }
    setLoading(false); // Indicate overall loading is finished *after* dates with slots are determined

  }, [potentialDatesInWindow, busyTimesCache, coachSchedule, coachTimezone]); // Dependencies that trigger recalculation of dates with slots

  // Add a wrapper for setSelectedTimeSlot to ensure consistent state
  const handleTimeSlotSelection = useCallback((timeSlot: TimeSlot | null) => {
    // Only update if the selection is actually changing
    if (JSON.stringify(timeSlot) !== JSON.stringify(selectedTimeSlot)) {
      console.log('[DEBUG][BOOKING] Selecting time slot:', timeSlot ? 
        `${timeSlot.startTime.toISOString()} - ${timeSlot.endTime.toISOString()}` : 'none');
      
      // If we're selecting a new time slot, ensure eventType is selected
      if (timeSlot && !selectedEventTypeId && eventTypes.length > 0) {
        setSelectedEventTypeId(eventTypes[0].id);
      }
      
      setSelectedTimeSlot(timeSlot);
    }
  }, [selectedTimeSlot, selectedEventTypeId, eventTypes]);

  return {
    loading,
    loadingState,
    error,
    coachName,
    coachProfileImage,
    coachSpecialty,
    coachDomains,
    coachSlogan,
    selectedDate,
    setSelectedDate: handleDateChange,
    potentialDatesInWindow,
    timeSlots, // Now contains UTC Date objects
    selectedTimeSlot,
    setSelectedTimeSlot: handleTimeSlotSelection,
    isBooking,
    coachSchedule,
    coachTimezone, // Ensure this is returned

    timeSlotGroups, // Correctly grouped by user's timezone hour

    handleConfirmBooking,
    isDateDisabled,
    formatTime, // Keep for BookingSummary

    eventTypes,
    selectedEventTypeId,
    setSelectedEventTypeId,

    // Alias the correct state variable for consumption by DatePickerSection
    availableDates: datesWithActualSlots, 

    showSuccessModal,
    redirectCountdown,
    bookingDetails
  };
} 