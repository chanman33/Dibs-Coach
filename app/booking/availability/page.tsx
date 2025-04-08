"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { format, addDays, isWithinInterval, parseISO, isSameDay } from "date-fns";
import { InlineDatePicker } from "@/components/ui/date-picker-inline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { redirect, useRouter } from "next/navigation";
import { createAuthClient } from "@/utils/auth";
import { toast } from "@/components/ui/use-toast";
import { createBooking } from "@/utils/actions/booking-actions";
import { CalendarIcon, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Types for component
interface TimeSlot {
  startTime: Date;
  endTime: Date;
}

interface BusyTime {
  start: string;
  end: string;
  source: string;
}

interface AvailabilitySlot {
  days: string[];
  startTime: string; // Format: "HH:MM"
  endTime: string;   // Format: "HH:MM"
}

interface CoachSchedule {
  ulid: string;
  userUlid: string;
  name: string;
  timeZone: string;
  availability: AvailabilitySlot[];
  isDefault: boolean;
  active: boolean;
  defaultDuration: number;
}

// Day mapping for converting day names to numbers
const dayMapping: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 0
};

export default function BookingAvailabilityPage() {
  const searchParams = useSearchParams();
  const coachId = searchParams.get("coachId");
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
  const router = useRouter();

  // Redirect if no coachId provided
  useEffect(() => {
    if (!coachId) {
      redirect("/");
    }
  }, [coachId]);

  // Fetch coach schedule and coach information
  useEffect(() => {
    if (!coachId) return;

    const fetchCoachData = async () => {
      setLoading(true);
      try {
        // Fetch coach profile and availability schedule
        const supabase = createAuthClient();
        
        // First get coach info
        const { data: coachData, error: coachError } = await supabase
          .from("User")
          .select("firstName, lastName, ulid")
          .eq("ulid", coachId)
          .single();
        
        if (coachError || !coachData) {
          console.error("[FETCH_COACH_ERROR]", coachError);
          return;
        }
        
        setCoachName(`${coachData.firstName || ""} ${coachData.lastName || ""}`);
        
        // Then get coach's availability schedule
        const { data: scheduleData, error: scheduleError } = await supabase
          .from("CoachingAvailabilitySchedule")
          .select("*")
          .eq("userUlid", coachId)
          .eq("isDefault", true)
          .eq("active", true)
          .single();
          
        if (scheduleError) {
          console.error("[FETCH_SCHEDULE_ERROR]", scheduleError);
          return;
        }
        
        if (scheduleData) {
          setCoachSchedule({
            ...scheduleData,
            // If availability is stored as string, parse it
            availability: typeof scheduleData.availability === 'string' 
              ? JSON.parse(scheduleData.availability) 
              : scheduleData.availability
          });
          
          // Get the cal.com token for this coach to fetch busy times
          const { data: calData, error: calError } = await supabase
            .from("CalendarIntegration")
            .select("calAccessToken")
            .eq("userUlid", coachId)
            .single();
            
          if (!calError && calData) {
            setCalToken(calData.calAccessToken);
          }
        }
      } catch (error) {
        console.error("[FETCH_COACH_DATA_ERROR]", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoachData();
  }, [coachId]);

  // Calculate available dates based on coach schedule
  useEffect(() => {
    if (!coachSchedule) return;
    
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
    
    // Generate dates for the next 20 days that match available days
    const dates: Date[] = [];
    const today = new Date();
    
    for (let i = 0; i < 20; i++) {
      const date = addDays(today, i);
      const dayOfWeek = date.getDay(); // 0-6, Sunday is 0
      
      if (availableDays.has(dayOfWeek)) {
        dates.push(date);
      }
    }
    
    setAvailableDates(dates);
    
    // If we have dates and no selected date yet, select the first available date
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0]);
    }
  }, [coachSchedule, selectedDate]);

  // Fetch busy times when calendar token is available and date is selected
  useEffect(() => {
    if (!calToken || !selectedDate || !coachSchedule || !coachId) return;

    const fetchBusyTimes = async () => {
      try {
        // Get calendar credential ID from the coach
        const supabase = createAuthClient();
        const { data: calendarData, error: calendarError } = await supabase
          .from("CalendarIntegration")
          .select("*")
          .eq("userUlid", coachId)
          .single();
          
        if (calendarError || !calendarData) {
          console.error("[FETCH_CALENDAR_ERROR]", calendarError);
          return;
        }
        
        // Prepare parameters for the busy times API
        const startDateStr = format(selectedDate, "yyyy-MM-dd");
        const endDateStr = format(addDays(selectedDate, 1), "yyyy-MM-dd");

        // We need to query busyTimes for all the calendars the coach has connected
        // Assuming we have the calendar credentials available
        const response = await fetch(`/api/cal/calendars/get-busy-times?loggedInUsersTz=${encodeURIComponent(coachSchedule.timeZone)}&calendarsToLoad[0][credentialId]=${calendarData.calManagedUserId}&calendarsToLoad[0][externalId]=primary`, {
          headers: {
            Authorization: `Bearer ${calToken}`
          }
        });

        if (!response.ok) {
          console.error("[FETCH_BUSY_TIMES_ERROR]", await response.text());
          return;
        }

        const busyTimesData = await response.json();
        if (busyTimesData.status === "success" && Array.isArray(busyTimesData.data)) {
          setBusyTimes(busyTimesData.data);
        }
      } catch (error) {
        console.error("[FETCH_BUSY_TIMES_ERROR]", error);
      }
    };

    fetchBusyTimes();
  }, [calToken, selectedDate, coachId, coachSchedule]);

  // Calculate available time slots based on schedule and busy times
  useEffect(() => {
    if (!selectedDate || !coachSchedule) return;
    
    // Get the day of week for the selected date (0-6, Sunday is 0)
    const dayOfWeek = selectedDate.getDay();
    
    // Convert day number to day name for matching with availability
    const dayNames = Object.keys(dayMapping);
    const selectedDayName = dayNames.find(day => dayMapping[day] === dayOfWeek);
    
    if (!selectedDayName) return;
    
    // Find availability slots for the selected day
    const daySlots = coachSchedule.availability.filter(slot => 
      slot.days.includes(selectedDayName)
    );
    
    if (daySlots.length === 0) return;
    
    // Generate time slots for the selected day
    const slots: TimeSlot[] = [];
    const slotDuration = coachSchedule.defaultDuration; // minutes
    
    daySlots.forEach(slot => {
      const [startHour, startMinute] = slot.startTime.split(":").map(Number);
      const [endHour, endMinute] = slot.endTime.split(":").map(Number);
      
      let currentTime = new Date(selectedDate);
      currentTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(selectedDate);
      endTime.setHours(endHour, endMinute, 0, 0);
      
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
    
    // Filter out slots that conflict with busy times
    const availableSlots = slots.filter(slot => {
      // Check for conflicts with busy times
      return !busyTimes.some(busyTime => {
        const busyStart = parseISO(busyTime.start);
        const busyEnd = parseISO(busyTime.end);
        
        // Check if slot overlaps with busy time
        return (
          isWithinInterval(slot.startTime, { start: busyStart, end: busyEnd }) ||
          isWithinInterval(slot.endTime, { start: busyStart, end: busyEnd }) ||
          (slot.startTime <= busyStart && slot.endTime >= busyEnd)
        );
      });
    });
    
    setTimeSlots(availableSlots);
    setSelectedTimeSlot(null); // Reset selected time slot when date changes
  }, [selectedDate, coachSchedule, busyTimes]);

  // Format time for display
  const formatTime = (date: Date) => {
    return format(date, "h:mm a");
  };

  // Prepare times for rendering
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
    
    return [
      { title: "Morning", slots: morning },
      { title: "Afternoon", slots: afternoon },
      { title: "Evening", slots: evening }
    ].filter(group => group.slots.length > 0);
  }, [timeSlots]);
  
  // Handle time slot selection
  const handleSelectTimeSlot = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
  };
  
  // Handle booking flow
  const handleConfirmBooking = async () => {
    if (!selectedTimeSlot) return;
    
    try {
      setIsBooking(true);
      
      // Get the event type for this coach
      const supabase = createAuthClient();
      const { data: eventTypes, error: eventTypeError } = await supabase
        .from("CalEventType")
        .select("calEventTypeId")
        .eq("calendarIntegrationUlid", `${coachId}`) // Use the coach's ID to find their integration
        .eq("isDefault", true)
        .single();

      if (eventTypeError || !eventTypes?.calEventTypeId) {
        console.error("[BOOKING_ERROR] No event type found for coach", {
          error: eventTypeError,
          coachId
        });
        
        toast({
          title: "Booking Error",
          description: "Could not find booking configuration for this coach. Please try again later.",
          variant: "destructive"
        });
        
        setIsBooking(false);
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
        console.error("[BOOKING_ERROR]", result.error);
        toast({
          title: "Booking Failed",
          description: result.error.message || "Could not complete booking. Please try again later.",
          variant: "destructive"
        });
        setIsBooking(false);
        return;
      }

      if (!result.data) {
        toast({
          title: "Booking Error",
          description: "No booking data received. Please try again later.",
          variant: "destructive"
        });
        setIsBooking(false);
        return;
      }

      // Redirect to booking success page with all necessary data
      router.push(`/booking/booking-success?coachId=${coachId}&startTime=${encodeURIComponent(result.data.startTime)}&endTime=${encodeURIComponent(result.data.endTime)}&bookingUid=${encodeURIComponent(result.data.calBookingUid)}`);
    } catch (error) {
      console.error("[BOOKING_ERROR]", error);
      toast({
        title: "Booking Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive"
      });
      setIsBooking(false);
    }
  };

  // Helper function to check if a date should be disabled
  const isDateDisabled = (date: Date) => {
    return !availableDates.some(availableDate => 
      isSameDay(availableDate, date)
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">
          {loading ? <Skeleton className="h-10 w-2/3 mx-auto" /> : `Book a Session with ${coachName}`}
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {loading ? (
            <Skeleton className="h-5 w-full mx-auto mt-2" />
          ) : (
            "Select a date and time that works for you to schedule your coaching session."
          )}
        </p>
      </div>

      {/* Booking Process Steps */}
      <div className="flex items-center justify-center mb-8 max-w-md mx-auto">
        <div className="flex flex-col items-center">
          <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-medium">
            1
          </div>
          <span className="text-sm mt-1">Select Date</span>
        </div>
        <div className="h-px bg-border w-16 mx-2"></div>
        <div className="flex flex-col items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
              selectedDate ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            2
          </div>
          <span className="text-sm mt-1">Choose Time</span>
        </div>
        <div className="h-px bg-border w-16 mx-2"></div>
        <div className="flex flex-col items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
              selectedTimeSlot ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            3
          </div>
          <span className="text-sm mt-1">Confirm</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left side - Calendar */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Select a Date
            </CardTitle>
            <CardDescription>Available dates are highlighted</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <div className="flex justify-center">
                <InlineDatePicker
                  date={selectedDate}
                  onSelect={setSelectedDate}
                  disabledDates={isDateDisabled}
                  className="w-full"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right side - Time slots or confirmation */}
        <div className="lg:col-span-7">
          {selectedTimeSlot ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Confirm Your Booking
                </CardTitle>
                <CardDescription>Review your selected time and confirm</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Date</span>
                    <span>{format(selectedTimeSlot.startTime, "EEEE, MMMM d, yyyy")}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Time</span>
                    <span>
                      {formatTime(selectedTimeSlot.startTime)} - {formatTime(selectedTimeSlot.endTime)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Coach</span>
                    <span>{coachName}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Duration</span>
                    <span>{coachSchedule?.defaultDuration} minutes</span>
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <Button 
                    onClick={handleConfirmBooking} 
                    disabled={isBooking} 
                    className="w-full" 
                    size="lg"
                  >
                    {isBooking ? "Booking..." : "Confirm Booking"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedTimeSlot(null)} 
                    className="w-full"
                  >
                    Back to Time Selection
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Available Times
                </CardTitle>
                <CardDescription>
                  {selectedDate
                    ? `Select a time on ${format(selectedDate, "EEEE, MMMM d, yyyy")}`
                    : "Please select a date first"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : timeSlotGroups.length > 0 ? (
                  <div className="space-y-6">
                    {timeSlotGroups.map((group, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex items-center">
                          <h3 className="font-medium text-lg">{group.title}</h3>
                          <Badge variant="outline" className="ml-2">
                            {group.slots.length} {group.slots.length === 1 ? "slot" : "slots"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {group.slots.map((slot, slotIndex) => (
                            <Button
                              key={slotIndex}
                              variant="outline"
                              className={`justify-center py-6 h-auto hover:border-primary ${
                                isBooking ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              onClick={() => handleSelectTimeSlot(slot)}
                              disabled={isBooking}
                            >
                              {formatTime(slot.startTime)}
                            </Button>
                          ))}
                        </div>
                        {index < timeSlotGroups.length - 1 && <Separator className="my-4" />}
                      </div>
                    ))}
                  </div>
                ) : selectedDate ? (
                  <div className="py-12 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">No available times on this date</p>
                    <p className="text-muted-foreground mt-2">Please select another date from the calendar</p>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Please select a date</p>
                    <p className="text-muted-foreground mt-2">
                      Choose a date from the calendar to view available times
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
