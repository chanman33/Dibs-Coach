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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useBookingAvailability } from "@/hooks/useBookingAvailability";
import { DatePickerSection } from "@/components/booking/DatePickerSection";
import { TimeSlotsSection } from "@/components/booking/TimeSlotsSection";
import { BookingSummary } from "@/components/booking/BookingSummary";

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
  const {
    loading,
    loadingState,
    error,
    coachName,
    selectedDate,
    setSelectedDate,
    timeSlotGroups,
    selectedTimeSlot,
    setSelectedTimeSlot,
    isBooking,
    coachSchedule,
    handleConfirmBooking,
    isDateDisabled
  } = useBookingAvailability();
  
  // Debug logging for loading state changes
  useEffect(() => {
    console.log('[DEBUG][BOOKING_PAGE] Loading state changed', loadingState);
  }, [loadingState]);

  // Prepare coach information for the summary
  const coach = coachName ? {
    name: coachName,
    sessionType: "1:1 Coaching Session",
    sessionDuration: coachSchedule?.defaultDuration,
  } : null;

  // Display warning if there are calendar sync issues
  const hasCalendarWarning = loadingState.status === 'warning' && 
                            loadingState.context === 'BUSY_TIMES';
                            
  // Debug logging for key state changes
  useEffect(() => {
    if (selectedTimeSlot) {
      console.log('[DEBUG][BOOKING_PAGE] Time slot selected', {
        startTime: format(selectedTimeSlot.startTime, 'yyyy-MM-dd HH:mm'),
        endTime: format(selectedTimeSlot.endTime, 'yyyy-MM-dd HH:mm'),
      });
    }
  }, [selectedTimeSlot]);
  
  useEffect(() => {
    if (selectedDate) {
      console.log('[DEBUG][BOOKING_PAGE] Date selected', {
        date: format(selectedDate, 'yyyy-MM-dd'),
        timeSlotCount: timeSlotGroups.reduce((acc, group) => acc + group.slots.length, 0)
      });
    }
  }, [selectedDate, timeSlotGroups]);

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

      {/* Calendar connection warning */}
      {hasCalendarWarning && (
        <Alert variant="default" className="mb-6">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>Calendar Sync Warning</AlertTitle>
          <AlertDescription>
            We couldn't sync with the coach's calendar. Some displayed times might not reflect their actual availability.
          </AlertDescription>
        </Alert>
      )}

      {/* Error state */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left side - Calendar */}
        <DatePickerSection
          loading={loading}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          isDateDisabled={isDateDisabled}
        />

        {/* Right side - Time slots */}
        {selectedTimeSlot ? (
          <BookingSummary
            loading={loading}
            coach={coach}
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTimeSlot}
            handleBookSession={handleConfirmBooking}
            isBooking={isBooking}
          />
        ) : (
          <TimeSlotsSection
            loading={loading}
            selectedDate={selectedDate}
            timeSlotGroups={timeSlotGroups}
            handleSelectTimeSlot={setSelectedTimeSlot}
            isBooking={isBooking}
          />
        )}
      </div>
    </div>
  );
}
