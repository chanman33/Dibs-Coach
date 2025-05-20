'use client'

import { useState, useEffect, useMemo } from 'react'
import { addDays, addHours, format, parseISO } from 'date-fns'
import { createAuthClient } from '@/utils/auth'
import { TimeSlot, TimeSlotGroup } from '@/utils/types/booking'
import { getUserTimezone, createUtcDate, formatUtcDateInTimezone } from '@/utils/timezone-utils'
import { getCoachAvailability } from "@/utils/actions/coach-availability";
import { getCoachBusyTimes } from "@/utils/actions/coach-calendar";
import { type CoachSchedule } from "@/utils/types/coach-availability";
import { 
  getDayNameFromNumber,
  doesTimeSlotOverlapWithBusyTime,
  getTomorrowDate,
  getMaxBookingDate 
} from "@/utils/date-utils";

// Copied from useBookingUI - consider moving to a shared types file
export interface BusyTime {
  start: string;
  end: string;
  source: string;
}

export interface BusyTimesCache {
  startDate: Date | null;
  endDate: Date | null;
  busyTimes: BusyTime[];
  lastFetched: Date | null;
}

interface UseRescheduleOptions {
  coachId: string
  sessionDuration: number
}

export function useReschedule({ coachId, sessionDuration }: UseRescheduleOptions) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [availableDates, setAvailableDates] = useState<Date[]>([])
  const [timeSlotGroups, setTimeSlotGroups] = useState<TimeSlotGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coachTimezone, setCoachTimezone] = useState("UTC")
  const [coachSchedule, setCoachSchedule] = useState<CoachSchedule | null>(null);
  const [busyTimesCache, setBusyTimesCache] = useState<BusyTimesCache>({
    startDate: null,
    endDate: null,
    busyTimes: [],
    lastFetched: null
  });
  
  // Fetch coach data and schedule from server action
  useEffect(() => {
    if (!coachId) {
      setError("Coach ID is required for fetching availability.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const fetchCoachData = async () => {
      try {
        const result = await getCoachAvailability({ coachId });
        
        if (result.error) {
          console.error("[FETCH_COACH_AVAILABILITY_ERROR]", result.error);
          setError(result.error.message || 'Failed to fetch coach information');
          setCoachSchedule(null); // Ensure schedule is cleared on error
          setCoachTimezone("UTC"); // Reset timezone or handle appropriately
          return;
        }
        
        if (!result.data?.coach) {
          setError("Coach not found");
          setCoachSchedule(null);
          return;
        }
        
        if (result.data.schedule) {
          setCoachSchedule(result.data.schedule);
          setCoachTimezone(result.data.schedule.timeZone || "UTC");
          console.log('[DEBUG][RESCHEDULE] Coach schedule loaded', {
            timeZone: result.data.schedule.timeZone,
            availabilityCount: result.data.schedule.availability?.length,
            defaultDuration: result.data.schedule.defaultDuration
          });
        } else {
          setError("Coach has no availability schedule configured.");
          setCoachSchedule(null);
          setCoachTimezone("UTC"); // Reset timezone
        }
      } catch (err) {
        console.error('[FETCH_COACH_DATA_UNEXPECTED_ERROR]', err);
        setError('An unexpected error occurred while fetching coach data.');
        setCoachSchedule(null);
        setCoachTimezone("UTC");
      } finally {
        // Defer setLoading(false) to be handled by subsequent effects (busy times, slot generation)
      }
    };
    
    fetchCoachData();
  }, [coachId]);
  
  // Fetch busy times when date is selected or coach schedule changes
  useEffect(() => {
    if (!selectedDate || !coachSchedule || !coachId) {
      // If no selected date, or no schedule, or no coachId, we can't fetch busy times for a specific context,
      // but we might want to pre-fetch for the initial view or a default range.
      // For now, let's only fetch if a date is selected.
      // Consider pre-fetching a general range if selectedDate is null initially.
      if (!selectedDate) {
        setTimeSlotGroups([]); // Clear time slots if no date is selected
        // setLoading(false); // Potentially stop loading if only date selection is pending
      }
      return;
    }

    const fetchBusyTimes = async () => {
      setLoading(true); // Indicate loading for busy times
      try {
        // Cache logic similar to useBookingUI
        const dateInCache = busyTimesCache.startDate && busyTimesCache.endDate && 
                           selectedDate >= busyTimesCache.startDate && 
                           selectedDate <= busyTimesCache.endDate;
        const cacheAge = busyTimesCache.lastFetched 
          ? Math.floor((Date.now() - busyTimesCache.lastFetched.getTime()) / (1000 * 60)) 
          : Number.MAX_SAFE_INTEGER;
        const isCacheExpired = cacheAge > 15; // Cache for 15 minutes for busy times

        if (dateInCache && !isCacheExpired) {
          console.log("[DEBUG][RESCHEDULE_BUSY_TIMES] Using cached busy times for", selectedDate.toISOString().split('T')[0]);
          // Busy times are already cached and valid, slot generation will use them.
          // setLoading(false) will be handled by slot generation effect if it runs.
          return; 
        }

        console.log("[DEBUG][RESCHEDULE_BUSY_TIMES] Fetching new 31-day busy time range from", selectedDate.toISOString().split('T')[0]);
        const result = await getCoachBusyTimes({
          coachId: coachId,
          date: selectedDate.toISOString(), // Use selectedDate as the start for the range
          days: 31 // Fetch a month of busy times
        });

        if (result.error) {
          console.error("[FETCH_BUSY_TIMES_ERROR]", result.error);
          setError(prevError => prevError ? prevError + "; Failed to fetch busy times" : "Failed to fetch busy times");
          // Proceed with empty busy times, slots will be generated based on schedule only
          setBusyTimesCache({ startDate: null, endDate: null, busyTimes: [], lastFetched: null });
        } else {
          const newBusyTimes = result.data || [];
          const endDate = new Date(selectedDate);
          endDate.setDate(selectedDate.getDate() + 30);
          setBusyTimesCache({
            startDate: new Date(selectedDate), // Ensure it's a new Date object for cache start
            endDate: endDate,
            busyTimes: newBusyTimes,
            lastFetched: new Date()
          });
          console.log("[DEBUG][RESCHEDULE_BUSY_TIMES] Successfully fetched/updated busy times cache", { count: newBusyTimes.length });
        }
      } catch (err) {
        console.error('[FETCH_BUSY_TIMES_UNEXPECTED_ERROR]', err);
        setError(prevError => prevError ? prevError + "; Unexpected error fetching busy times" : "Unexpected error fetching busy times");
        setBusyTimesCache({ startDate: null, endDate: null, busyTimes: [], lastFetched: null });
      } finally {
        // setLoading(false) will be handled by the slot generation effect
      }
    };

    fetchBusyTimes();
  }, [selectedDate, coachId, coachSchedule]); // Removed busyTimesCache from deps to avoid loops, cache check handles it
  
  // Generate time slots when selectedDate, coachSchedule, busyTimesCache, or sessionDuration changes
  useEffect(() => {
    if (!selectedDate || !coachSchedule || !coachTimezone) {
      setTimeSlotGroups([]);
      if (!coachSchedule && coachId && !error) {
         // Still waiting for schedule to load, or schedule fetch failed
         // setLoading(true) should be managed by coach data fetching effect
      } else {
        setLoading(false); // Not enough data to generate slots, not actively loading schedule
      }
      return;
    }

    setLoading(true);
    console.log(`[DEBUG][RESCHEDULE_GENERATE_SLOTS] For date: ${selectedDate.toISOString().split('T')[0]}, duration: ${sessionDuration} min`);

    const dayOfWeek = selectedDate.getDay();
    const dayName = getDayNameFromNumber(dayOfWeek);

    if (!dayName) {
      console.error("[DEBUG][RESCHEDULE_GENERATE_SLOTS] Invalid day for slot generation", { date: selectedDate });
      setTimeSlotGroups([]);
      setLoading(false);
      return;
    }

    const scheduleForDay = coachSchedule.availability?.filter(slot => 
      slot.days?.some(d => {
        if (typeof d === 'number') return d === dayOfWeek;
        if (typeof d === 'string') return d.toUpperCase() === dayName.toUpperCase();
        return false;
      })
    );

    if (!scheduleForDay || scheduleForDay.length === 0) {
      console.log("[DEBUG][RESCHEDULE_GENERATE_SLOTS] No schedule defined for this day:", dayName);
      setTimeSlotGroups([]);
      setLoading(false);
      return;
    }
    
    const potentialSlotsThisDay: TimeSlot[] = [];
    scheduleForDay.forEach(scheduleSlot => {
      if (!scheduleSlot.startTime || !scheduleSlot.endTime) return;
      try {
        let currentIterationTime = createUtcDate(selectedDate, scheduleSlot.startTime, coachTimezone);
        const slotGroupEndTime = createUtcDate(selectedDate, scheduleSlot.endTime, coachTimezone);

        while (currentIterationTime < slotGroupEndTime) {
          const slotEndTime = new Date(currentIterationTime.getTime() + sessionDuration * 60000);
          if (slotEndTime <= slotGroupEndTime) {
            potentialSlotsThisDay.push({
              startTime: new Date(currentIterationTime), // Ensure new Date objects
              endTime: new Date(slotEndTime)
            });
          }
          currentIterationTime = slotEndTime; // Move to the end of the current slot for the next iteration
        }
      } catch(e) {
        console.error("[DEBUG][RESCHEDULE_GENERATE_SLOTS] Error processing schedule slot:", e);
      }
    });
    
    const currentBusyTimes = busyTimesCache.busyTimes || [];
    const filteredSlots = potentialSlotsThisDay.filter(slot => 
      !currentBusyTimes.some(busyTime => {
        // Ensure busyTime.start and busyTime.end are valid date strings for parseISO
        try {
            const busyStart = parseISO(busyTime.start);
            const busyEnd = parseISO(busyTime.end);
            return doesTimeSlotOverlapWithBusyTime(slot, busyStart, busyEnd);
        } catch (e) {
            console.warn("[DEBUG][RESCHEDULE_GENERATE_SLOTS] Invalid busy time format, skipping:", busyTime, e);
            return false; // If busy time is invalid, treat as no overlap
        }
      })
    );

    // Group slots by AM/PM
    const morningSlots = filteredSlots.filter(slot => slot.startTime.getUTCHours() < 12); // Use getUTCHours as slots are UTC
    const afternoonSlots = filteredSlots.filter(slot => slot.startTime.getUTCHours() >= 12);

    const groups: TimeSlotGroup[] = [];
    if (morningSlots.length > 0) {
      groups.push({ title: "Morning", slots: morningSlots });
    }
    if (afternoonSlots.length > 0) {
      groups.push({ title: "Afternoon", slots: afternoonSlots });
    }
    
    setTimeSlotGroups(groups);
    console.log("[DEBUG][RESCHEDULE_GENERATE_SLOTS] Generated groups:", groups.length, "groups with", filteredSlots.length, "total slots");
    setLoading(false);

  }, [selectedDate, coachSchedule, busyTimesCache, sessionDuration, coachTimezone, error]); // Added error to re-evaluate if it clears
  
  // Update availableDates based on generated slots over a range of days
  useEffect(() => {
    if (!coachSchedule || !coachId) {
      setAvailableDates([]);
      return;
    }

    // This effect can be computationally intensive if run too broadly or too often.
    // It recalculates available dates for a window when the underlying schedule or main coachId changes.
    console.log("[DEBUG][RESCHEDULE_AVAILABLE_DATES] Recalculating available dates for the booking window.");
    setLoading(true); // Indicate loading for available dates calculation

    const tomorrow = getTomorrowDate();
    const maxDate = getMaxBookingDate(); // Look ahead 90 days for rescheduling
    const datesInRange: Date[] = [];
    let currentDate = new Date(tomorrow);

    while(currentDate <= maxDate) {
      datesInRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Asynchronously check each date for availability.
    // This is a simplified check. For full accuracy, it would involve parts of the slot generation logic.
    // For now, we assume a date is available if the coach has *any* general availability on that day of the week.
    // A more robust check would quickly simulate slot generation for each date.
    const checkDatePromises = datesInRange.map(async (dateToCheck) => {
      const dayOfWeek = dateToCheck.getDay();
      const dayName = getDayNameFromNumber(dayOfWeek);
      if (!dayName) return null;

      const scheduleForDay = coachSchedule.availability?.filter(slot =>
        slot.days?.some(d => {
          if (typeof d === 'number') return d === dayOfWeek;
          if (typeof d === 'string') return d.toUpperCase() === dayName.toUpperCase();
          return false;
        })
      );
      
      if (scheduleForDay && scheduleForDay.length > 0) {
        // Simplified: if there's any schedule, assume it *might* have slots.
        // A full check would generate potential slots and filter by a pre-fetched busy time range.
        // For performance, we're keeping this light. The detailed check happens when a date is selected.
        return dateToCheck;
      }
      return null;
    });

    Promise.all(checkDatePromises).then(results => {
      const validDates = results.filter(date => date !== null) as Date[];
      setAvailableDates(validDates);
      console.log("[DEBUG][RESCHEDULE_AVAILABLE_DATES] Found", validDates.length, "potentially available dates in window.");
      // Only set loading to false if this is the primary loading indicator. 
      // If slot generation is also happening, it will control the final loading state.
      // If selectedDate is null, this might be the main loading task.
      if (!selectedDate) {
         setLoading(false);
      }
    }).catch(err => {
      console.error("[DEBUG][RESCHEDULE_AVAILABLE_DATES] Error checking dates", err);
      setAvailableDates([]);
      if (!selectedDate) {
         setLoading(false);
      }
    });

  }, [coachId, coachSchedule]); // Runs when coach or their schedule changes

  // Function to determine if a date should be disabled
  const isDateDisabled = (date: Date): boolean => {
    // Check if date is in the past
    if (date < new Date()) return true
    
    // Check if date is too far in the future (more than 3 months)
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
    if (date > threeMonthsFromNow) return true
    
    // Check if date is in availableDates
    return !availableDates.some(d => d.toDateString() === date.toDateString())
  }
  
  // Format time helper function
  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, 'h:mm a')
  }
  
  return {
    loading,
    error,
    selectedDate,
    setSelectedDate,
    selectedTimeSlot,
    setSelectedTimeSlot,
    availableDates,
    isDateDisabled,
    timeSlotGroups,
    coachTimezone,
    formatTime
  }
} 