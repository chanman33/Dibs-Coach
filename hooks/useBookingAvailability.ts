"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, redirect } from "next/navigation";
import { parseISO, format, addDays, addMinutes } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { createAuthClient } from "@/utils/auth";
import { createBooking } from "@/utils/actions/booking-actions";
import { 
  TimeSlot, 
  BusyTime, 
  CoachSchedule, 
  TimeSlotGroup,
  LoadingState
} from "@/utils/types/booking";
import {
  dayMapping,
  formatTime,
  getTomorrowDate,
  getMaxBookingDate,
  isSameDayFn,
  getDayNameFromNumber,
  doesTimeSlotOverlapWithBusyTime
} from "@/utils/date-utils";

export function useBookingAvailability() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get coach identifiers from URL
  const coachId = searchParams.get("coachId");
  const coachSlug = searchParams.get("slug");
  
  // State variables
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachSchedule, setCoachSchedule] = useState<CoachSchedule | null>(null);
  const [busyTimes, setBusyTimes] = useState<BusyTime[]>([]);
  const [calToken, setCalToken] = useState<string | null>(null);
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

  // Test function to directly validate the coach token and calendar
  const testCoachCalendarAccess = async (coachId: string) => {
    try {
      console.log('[DEBUG][BOOKING] Testing direct coach calendar access', { coachId });
      
      const supabase = createAuthClient();
      
      // Get coach's calendar token
      const { data: calData, error: calError } = await supabase
        .from("CalendarIntegration")
        .select("calAccessToken, calManagedUserId")
        .eq("userUlid", coachId)
        .single();
        
      if (calError || !calData) {
        console.error('[DEBUG][BOOKING] Test failed - no calendar integration found', {
          error: calError,
          coachId
        });
        return;
      }
      
      // Get calendar credentials
      const token = calData.calAccessToken;
      const managedUserId = calData.calManagedUserId;
      
      // Only proceed if we have both
      if (!token || !managedUserId) {
        console.error('[DEBUG][BOOKING] Test failed - missing token or managed user ID', {
          hasToken: !!token,
          hasManagedUserId: !!managedUserId
        });
        return;
      }
      
      console.log('[DEBUG][BOOKING] Test - token and managed user ID found', {
        tokenLength: token.length,
        managedUserId
      });
      
      // Call the API directly with coach-specific params
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const testUrl = `/api/cal/calendars/get-busy-times?coachUlid=${encodeURIComponent(coachId)}&loggedInUsersTz=${encodeURIComponent(timezone)}&calendarsToLoad[0][credentialId]=${managedUserId}&calendarsToLoad[0][externalId]=primary`;
      
      console.log('[DEBUG][BOOKING] Test - making API call', { url: testUrl });
      
      const response = await fetch(testUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('[DEBUG][BOOKING] Test - API response', {
        status: response.status,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DEBUG][BOOKING] Test failed - API error', {
          status: response.status,
          error: errorText
        });
        return;
      }
      
      const result = await response.json();
      console.log('[DEBUG][BOOKING] Test succeeded - busy times retrieved', {
        status: result.status,
        count: result.data?.length || 0
      });
    } catch (error) {
      console.error('[DEBUG][BOOKING] Test failed - unexpected error', error);
    }
  };

  // Redirect if no coach identifier provided
  useEffect(() => {
    if (!coachId && !coachSlug) {
      redirect("/");
    }
  }, [coachId, coachSlug]);

  // Fetch coach data and availability schedule
  useEffect(() => {
    if (!coachId && !coachSlug) return;

    const fetchCoachData = async () => {
      console.log('[DEBUG][BOOKING] Starting coach data fetch', { coachId, coachSlug });
      setLoadingState({
        status: 'loading',
        context: 'COACH_DATA',
        message: 'Fetching coach information...'
      });
      setLoading(true);
      
      try {
        // Fetch coach profile and availability schedule
        const supabase = createAuthClient();
        
        // First determine the coach's actual ULID
        let coachUlid: string;
        
        if (coachSlug) {
          // If a slug is provided, look up coach by profile slug
          console.log('[DEBUG][BOOKING] Looking up coach by slug', { slug: coachSlug });
          const { data: coachProfile, error: profileError } = await supabase
            .from("CoachProfile")
            .select("userUlid")
            .eq("profileSlug", coachSlug)
            .single();
            
          if (profileError || !coachProfile) {
            console.error("[FETCH_COACH_ERROR] Coach profile not found by slug", {
              slug: coachSlug,
              error: profileError,
              timestamp: new Date().toISOString()
            });
            
            // If not found by slug, try using the coachId as backup
            if (coachId) {
              console.log('[DEBUG][BOOKING] Falling back to coachId', { coachId });
              coachUlid = coachId;
            } else {
              setError("Coach not found");
              setLoading(false);
              setLoadingState({
                status: 'error',
                context: 'COACH_DATA',
                message: 'Coach profile not found'
              });
              return;
            }
          } else {
            coachUlid = coachProfile.userUlid;
            console.log('[DEBUG][BOOKING] Found coach by slug', { slug: coachSlug, coachUlid });
          }
        } else {
          // If only coachId provided, use it directly
          coachUlid = coachId!;
          console.log('[DEBUG][BOOKING] Using provided coachId directly', { coachUlid });
        }
        
        // Store the actual coachId for later use
        setActualCoachId(coachUlid);
        console.log('[DEBUG][BOOKING] Coach ID set for availability fetch', { coachUlid });
        
        // Test calendar integration directly
        testCoachCalendarAccess(coachUlid);
        
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
          
          setCoachSchedule({
            ...scheduleData,
            availability: availabilityData
          });
          
          // Get the cal.com token for this coach to fetch busy times
          console.log('[DEBUG][BOOKING] Fetching calendar integration token', { coachUlid });
          const { data: calData, error: calError } = await supabase
            .from("CalendarIntegration")
            .select("calAccessToken")
            .eq("userUlid", coachUlid)
            .single();
            
          if (!calError && calData) {
            console.log('[DEBUG][BOOKING] Calendar token retrieved', { 
              hasToken: !!calData.calAccessToken,
              tokenLength: calData.calAccessToken ? calData.calAccessToken.length : 0
            });
            setCalToken(calData.calAccessToken);
          } else {
            console.warn('[DEBUG][BOOKING] No calendar token found', { error: calError });
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
  }, [coachSchedule]);

  // Fetch busy times when calendar token is available and date is selected
  useEffect(() => {
    if (!calToken || !selectedDate || !coachSchedule || !actualCoachId) return;

    const fetchBusyTimes = async () => {
      console.log('[DEBUG][BOOKING] Fetching busy times', {
        date: format(selectedDate, 'yyyy-MM-dd'),
        coachId: actualCoachId
      });
      
      setLoadingState({
        status: 'loading',
        context: 'BUSY_TIMES',
        message: 'Checking coach availability...'
      });
      
      try {
        // First, get the coach's calendar token
        const supabase = createAuthClient();
        console.log('[DEBUG][BOOKING] Getting calendar integration details');
        const { data: calendarData, error: calendarError } = await supabase
          .from("CalendarIntegration")
          .select("calAccessToken")
          .eq("userUlid", actualCoachId)
          .single();
          
        if (calendarError || !calendarData) {
          console.error("[FETCH_CALENDAR_ERROR]", {
            error: calendarError,
            timestamp: new Date().toISOString()
          });
          setLoadingState({
            status: 'error',
            context: 'BUSY_TIMES',
            message: 'Failed to fetch calendar integration'
          });
          return;
        }

        const coachToken = calendarData.calAccessToken;
        
        // Now fetch the coach's connected calendars to get the credential ID
        console.log('[DEBUG][BOOKING] Fetching coach connected calendars');
        
        // Call the calendars API with the coach's token
        const calendarResponse = await fetch(`/api/cal/calendars/get-all-calendars?coachUlid=${encodeURIComponent(actualCoachId)}`, {
          headers: {
            'Authorization': `Bearer ${coachToken}`
          }
        });
        
        if (!calendarResponse.ok) {
          console.error("[FETCH_CALENDARS_ERROR]", {
            status: calendarResponse.status,
            statusText: calendarResponse.statusText,
            timestamp: new Date().toISOString()
          });
          setLoadingState({
            status: 'warning',
            context: 'BUSY_TIMES',
            message: 'Could not fetch coach calendars'
          });
          setBusyTimes([]);
          return;
        }
        
        const calendarsData = await calendarResponse.json();
        
        if (!calendarsData.success || !calendarsData.data?.calendars?.length) {
          console.warn("[FETCH_CALENDARS_WARNING] No connected calendars found", {
            coachUlid: actualCoachId,
            timestamp: new Date().toISOString()
          });
          setLoadingState({
            status: 'warning',
            context: 'BUSY_TIMES',
            message: 'Coach has no connected calendars'
          });
          setBusyTimes([]);
          return;
        }
        
        // Get the first calendar's credential ID
        const calendar = calendarsData.data.calendars[0];
        
        console.log('[DEBUG][BOOKING] Found coach calendar', {
          calendar: {
            id: calendar.id,
            name: calendar.name,
            credentialId: calendar.credentialId,
            externalId: calendar.externalId
          }
        });
        
        if (!calendar.credentialId || !calendar.externalId) {
          console.error("[FETCH_CALENDAR_ERROR] Missing credential details", {
            calendar,
            timestamp: new Date().toISOString()
          });
          setLoadingState({
            status: 'warning',
            context: 'BUSY_TIMES',
            message: 'Coach calendar not properly configured'
          });
          setBusyTimes([]);
          return;
        }
        
        // Now we have the correct credential ID, make the busy times request
        const apiUrl = `/api/cal/calendars/get-busy-times?coachUlid=${encodeURIComponent(actualCoachId)}&loggedInUsersTz=${encodeURIComponent(coachSchedule.timeZone)}&calendarsToLoad[0][credentialId]=${calendar.credentialId}&calendarsToLoad[0][externalId]=${calendar.externalId}`;
        
        console.log('[DEBUG][BOOKING] Calling busy times API', {
          url: apiUrl,
          timezone: coachSchedule.timeZone,
          coachUlid: actualCoachId,
          credentialId: calendar.credentialId,
          externalId: calendar.externalId
        });

        // Send the coach's token
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${coachToken}`
          }
        });

        if (!response.ok) {
          console.error("[FETCH_BUSY_TIMES_ERROR]", {
            statusCode: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString()
          });
          
          // Specific handling for authorization issues
          if (response.status === 401) {
            setLoadingState({
              status: 'error',
              context: 'BUSY_TIMES',
              message: 'Calendar authorization expired'
            });
            return;
          }
          
          setLoadingState({
            status: 'error',
            context: 'BUSY_TIMES',
            message: 'Failed to fetch busy times'
          });
          return;
        }

        const busyTimesData = await response.json();
        
        if (!busyTimesData.success) {
          console.error("[FETCH_BUSY_TIMES_ERROR]", busyTimesData.error || "Unknown error");
          setLoadingState({
            status: 'error',
            context: 'BUSY_TIMES',
            message: 'Error fetching busy times'
          });
          return;
        }

        const busyTimes = busyTimesData.data;
        console.log('[DEBUG][BOOKING] Busy times for selected date', {
          date: format(selectedDate, 'yyyy-MM-dd'),
          busyTimesCount: busyTimes.length,
          busyTimes: busyTimes.map((bt: BusyTime) => ({
            start: bt.start,
            end: bt.end,
            source: bt.source
          }))
        });
        
        setBusyTimes(busyTimes);
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
  }, [calToken, selectedDate, actualCoachId, coachSchedule]);

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
    const slotDuration = coachSchedule.defaultDuration; // minutes
    
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
    
    console.log('[DEBUG][BOOKING] Final available time slots after filtering', {
      before: slots.length,
      after: availableSlots.length,
      filtered: slots.length - availableSlots.length,
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
  const timeSlotGroups = useMemo(() => {
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
    
    try {
      setIsBooking(true);
      setLoadingState({
        status: 'loading',
        context: 'BOOKING',
        message: 'Creating your booking...'
      });
      
      // Get the event type for this coach
      const supabase = createAuthClient();
      const { data: eventTypes, error: eventTypeError } = await supabase
        .from("CalEventType")
        .select("calEventTypeId")
        .eq("calendarIntegrationUlid", actualCoachId)
        .eq("isDefault", true)
        .single();

      if (eventTypeError || !eventTypes?.calEventTypeId) {
        console.error("[BOOKING_ERROR] No event type found for coach", {
          error: eventTypeError,
          coachId: actualCoachId,
          timestamp: new Date().toISOString()
        });
        
        toast({
          title: "Booking Error",
          description: "Could not find booking configuration for this coach. Please try again later.",
          variant: "destructive"
        });
        
        setIsBooking(false);
        setLoadingState({
          status: 'error',
          context: 'BOOKING',
          message: 'Failed to find booking configuration'
        });
        return;
      }

      // Call the booking action with the event type ID and time slot
      const result = await createBooking({
        eventTypeId: eventTypes.calEventTypeId,
        startTime: selectedTimeSlot.startTime.toISOString(),
        endTime: selectedTimeSlot.endTime.toISOString(),
        attendeeName: "Your Name", // In a real app, you would get this from the user profile
        attendeeEmail: "your.email@example.com", // In a real app, you would get this from the user profile
        timeZone: coachSchedule?.timeZone || "UTC"
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