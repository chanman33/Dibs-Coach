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
      setCoachSchedule(null);
      setAvailableDates([]);
      setTimeSlotGroups([]);
      return;
    }
    
    setLoading(true);
    setError(null); // Clear previous errors

    const fetchCoachData = async () => {
      try {
        const result = await getCoachAvailability({ coachId });
        
        if (result.error) {
          console.error("[FETCH_COACH_AVAILABILITY_ERROR]", result.error);
          setError(result.error.message || 'Failed to fetch coach information');
          setCoachSchedule(null);
          setCoachTimezone("UTC");
          setAvailableDates([]); // Clear available dates on error
        } else if (!result.data?.coach) {
          setError("Coach not found");
          setCoachSchedule(null);
          setAvailableDates([]);
        } else if (result.data.schedule) {
          setCoachSchedule(result.data.schedule);
          setCoachTimezone(result.data.schedule.timeZone || "UTC");
          console.log('[DEBUG][RESCHEDULE] Coach schedule loaded', {
            timeZone: result.data.schedule.timeZone,
            availabilityCount: result.data.schedule.availability?.length,
          });
          // Available dates will be calculated in its own effect once schedule is loaded
        } else {
          setError("Coach has no availability schedule configured.");
          setCoachSchedule(null);
          setCoachTimezone("UTC");
          setAvailableDates([]);
        }
      } catch (err) {
        console.error('[FETCH_COACH_DATA_UNEXPECTED_ERROR]', err);
        setError('An unexpected error occurred while fetching coach data.');
        setCoachSchedule(null);
        setCoachTimezone("UTC");
        setAvailableDates([]);
      } finally {
        // Defer setLoading(false) until availableDates calculation is also complete (if it runs)
        // or until slot generation (if a date is already selected)
        if (!coachSchedule && !selectedDate) { // Only stop loading if initial data fetch fails and no further steps
            setLoading(false);
        }
      }
    };
    
    fetchCoachData();
  }, [coachId]);
  
  // Effect for fetching busy times and generating time slots when selectedDate changes
  useEffect(() => {
    if (!selectedDate || !coachId || !coachSchedule) {
      setTimeSlotGroups([]);
      // If a date is deselected, or coach data isn't ready, clear slots.
      // Loading state for coachSchedule is handled by the previous effect.
      // If selectedDate becomes null, we are not loading slots for it.
      if (!selectedDate && coachSchedule) setLoading(false); 
      return;
    }

    // Immediately set loading true and clear previous slots when selectedDate is valid and coachSchedule is available
    setLoading(true);
    setTimeSlotGroups([]); 
    setSelectedTimeSlot(null); 
    setError(null); // Clear errors specific to slot generation

    const fetchBusyAndGenerateSlots = async () => {
      let currentBusyTimes: BusyTime[] = [];
      try {
        // Cache logic for busy times
        const cacheStartDate = busyTimesCache.startDate ? new Date(busyTimesCache.startDate.getFullYear(), busyTimesCache.startDate.getMonth(), busyTimesCache.startDate.getDate()) : null;
        const cacheEndDate = busyTimesCache.endDate ? new Date(busyTimesCache.endDate.getFullYear(), busyTimesCache.endDate.getMonth(), busyTimesCache.endDate.getDate()) : null;
        const selectedDayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

        const dateInCache = cacheStartDate && cacheEndDate && 
                           selectedDayStart >= cacheStartDate && 
                           selectedDayStart <= cacheEndDate;
                           
        const cacheAge = busyTimesCache.lastFetched 
          ? Math.floor((Date.now() - busyTimesCache.lastFetched.getTime()) / (1000 * 60)) 
          : Number.MAX_SAFE_INTEGER;
        const isCacheValid = dateInCache && cacheAge <= 15;

        if (isCacheValid) {
          console.log("[DEBUG][RESCHEDULE_BUSY_TIMES] Using cached busy times for", selectedDate.toISOString().split('T')[0]);
          currentBusyTimes = busyTimesCache.busyTimes.filter((bt: BusyTime) => {
            try {
              const busyStartDay = parseISO(bt.start).toISOString().split('T')[0];
              return busyStartDay === selectedDate.toISOString().split('T')[0];
            } catch { return false; }
          });
        } else {
          console.log("[DEBUG][RESCHEDULE_BUSY_TIMES] Fetching new 31-day busy time range starting from", selectedDate.toISOString().split('T')[0]);
          const result = await getCoachBusyTimes({
            coachId: coachId,
            // Fetch for a range around the selected date to build cache, but we only need selectedDate's busy times for immediate display
            date: selectedDate.toISOString(), 
            days: 31 
          });

          if (result.error) {
            console.error("[FETCH_BUSY_TIMES_ERROR]", result.error);
            setError(prevError => (prevError ? prevError + "; " : "") + (result.error?.message || "Failed to fetch busy times"));
            // Proceed with empty busy times for slot generation on error
          } else {
            const allFetchedBusyTimes = result.data || [];
            // Update cache with the full fetched range
            const rangeStartDate = new Date(selectedDate);
            const rangeEndDate = new Date(selectedDate);
            rangeEndDate.setDate(selectedDate.getDate() + 30);
            setBusyTimesCache({
              startDate: rangeStartDate,
              endDate: rangeEndDate,
              busyTimes: allFetchedBusyTimes,
              lastFetched: new Date()
            });
            // For immediate slot generation, filter down to just the selected date
            currentBusyTimes = allFetchedBusyTimes.filter((bt: BusyTime) => {
               try {
                const busyStartDay = parseISO(bt.start).toISOString().split('T')[0];
                return busyStartDay === selectedDate.toISOString().split('T')[0];
              } catch { return false; }
            });
            console.log(`[DEBUG][RESCHEDULE_BUSY_TIMES] Fetched ${allFetchedBusyTimes.length} total busy times, ${currentBusyTimes.length} for selected date.`);
          }
        }

        // Proceed to generate slots with the (potentially empty) currentBusyTimes
        if (!coachTimezone) { // coachSchedule is already confirmed by effect dependency
          console.warn("[DEBUG][RESCHEDULE_GENERATE_SLOTS] Coach timezone not available.");
          setError(prev => (prev ? prev + "; " : "") + "Coach timezone not set.");
          setTimeSlotGroups([]);
          setLoading(false);
          return;
        }
        
        console.log(`[DEBUG][RESCHEDULE_GENERATE_SLOTS] For date: ${selectedDate.toISOString().split('T')[0]}, duration: ${sessionDuration} min, using ${currentBusyTimes.length} busy items.`);

        const dayOfWeek = selectedDate.getDay();
        const dayName = getDayNameFromNumber(dayOfWeek);

        if (!dayName) {
          console.error("[DEBUG][RESCHEDULE_GENERATE_SLOTS] Invalid day for slot generation", { date: selectedDate });
          setTimeSlotGroups([]); setLoading(false); return;
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
          setTimeSlotGroups([]); setLoading(false); return;
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
                  startTime: new Date(currentIterationTime),
                  endTime: new Date(slotEndTime)
                });
              }
              currentIterationTime = slotEndTime; 
            }
          } catch(e) {
            console.error("[DEBUG][RESCHEDULE_GENERATE_SLOTS] Error processing schedule slot:", e);
          }
        });
        
        const filteredSlots = potentialSlotsThisDay.filter(slot => 
          !currentBusyTimes.some(busyTime => {
            try {
                const busyStart = parseISO(busyTime.start);
                const busyEnd = parseISO(busyTime.end);
                return doesTimeSlotOverlapWithBusyTime(slot, busyStart, busyEnd);
            } catch (e) {
                console.warn("[DEBUG][RESCHEDULE_GENERATE_SLOTS] Invalid busy time format, skipping:", busyTime, e);
                return false;
            }
          })
        );

        const morningSlots = filteredSlots.filter(slot => slot.startTime.getUTCHours() < 12);
        const afternoonSlots = filteredSlots.filter(slot => slot.startTime.getUTCHours() >= 12);

        const groups: TimeSlotGroup[] = [];
        if (morningSlots.length > 0) groups.push({ title: "Morning", slots: morningSlots });
        if (afternoonSlots.length > 0) groups.push({ title: "Afternoon", slots: afternoonSlots });
        
        setTimeSlotGroups(groups);
        console.log(`[DEBUG][RESCHEDULE_GENERATE_SLOTS] Generated ${groups.length} groups with ${filteredSlots.length} total slots.`);
        
      } catch (err) {
        console.error('[FETCH_BUSY_AND_GENERATE_SLOTS_ERROR]', err);
        setError(prevError => (prevError ? prevError + "; " : "") + "Unexpected error generating slots");
        setTimeSlotGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBusyAndGenerateSlots();

  }, [selectedDate, coachId, coachSchedule, sessionDuration, coachTimezone]); // Removed busyTimesCache, error as direct deps
  
  // Update availableDates based on coachSchedule; this is less critical for immediate slot display
  useEffect(() => {
    if (!coachSchedule || !coachId) {
      setAvailableDates([]);
      // Loading for the main schedule is handled by the first effect.
      // If coachSchedule is null and an error is set, or no coachId, we shouldn't be "loading available dates".
      if (!coachSchedule && !error && coachId) {
         // This implies coachSchedule is still being fetched by the first effect
         // Let the first effect manage the primary loading state.
      } else {
        // If coachSchedule loaded (or failed with error), or no coachId, this specific loading phase is done.
        // However, the overall loading might still be true if selectedDate is set and slots are generating.
        // We need to be careful not to prematurely set loading to false if other operations are pending.
      }
      return;
    }

    // This effect can be computationally intensive.
    // It populates the calendar's available dates based on general schedule.
    // The main 'loading' state for the UI is more tied to slot generation for a *selected* date.
    // We can set a temporary loading here if we want, but ensure it doesn't conflict.
    // For now, let it run in the background to populate 'availableDates'.
    console.log("[DEBUG][RESCHEDULE_AVAILABLE_DATES] Recalculating available dates for the booking window.");
    // Consider a separate loading state if this calculation is slow and impacts perceived performance.
    // const [loadingAvailableDates, setLoadingAvailableDates] = useState(false);

    const tomorrow = getTomorrowDate();
    const maxDate = getMaxBookingDate(); 
    const datesInRange: Date[] = [];
    let currentDate = new Date(tomorrow);

    while(currentDate <= maxDate) {
      datesInRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

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
      
      return (scheduleForDay && scheduleForDay.length > 0) ? dateToCheck : null;
    });

    Promise.all(checkDatePromises).then(results => {
      const validDates = results.filter(date => date !== null) as Date[];
      setAvailableDates(validDates);
      console.log("[DEBUG][RESCHEDULE_AVAILABLE_DATES] Found", validDates.length, "potentially available dates.");
      // This effect primarily populates availableDates for the DatePicker.
      // The overall 'loading' state seen by the page should be false if we are done with initial coach load and slot generation.
      // If no date is selected, and coach schedule is loaded, then we can say general loading is done.
      if (!selectedDate && coachSchedule) {
          setLoading(false);
      }
    }).catch(err => {
      console.error("[DEBUG][RESCHEDULE_AVAILABLE_DATES] Error checking dates", err);
      setAvailableDates([]);
       if (!selectedDate && coachSchedule) { // If it fails but we have schedule, stop general loading.
          setLoading(false);
      }
    });

  }, [coachId, coachSchedule]); // Removed 'error' as it could cause loops if error is from this effect itself

  // Function to determine if a date should be disabled
  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare dates only
    if (date < today) return true;
    
    const maxBookingDate = getMaxBookingDate();
    if (date > maxBookingDate) return true;
    
    return !availableDates.some(d => d.toDateString() === date.toDateString());
  };
  
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