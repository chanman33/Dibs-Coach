"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { useBookingUI } from "./useBookingUI";
import { TimeSlotsSection } from "./TimeSlotsSection";
import { DatePickerSection } from "./DatePickerSection";
import { BookingSummary } from "./BookingSummary";
import { EmptyState } from "./EmptyState";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { DebugPanel } from "./DebugPanel";

/**
 * Booking Availability Page
 * 
 * This is the main page for booking coach availability. It displays 
 * a calendar to pick a date, time slots for the selected date,
 * and a booking summary.
 */
export default function BookingAvailabilityPage() {
  const {
    loading,
    loadingState,
    error,
    coachName,
    selectedDate,
    setSelectedDate,
    availableDates,
    timeSlotGroups,
    selectedTimeSlot,
    setSelectedTimeSlot,
    isBooking,
    handleConfirmBooking,
    isDateDisabled,
    formatTime
  } = useBookingUI();

  // Format the date for display
  const formattedDate = useMemo(() => {
    if (!selectedDate) return "";
    return format(selectedDate, "EEEE, MMMM d, yyyy");
  }, [selectedDate]);

  // Determine if we can proceed with booking
  const canBook = !!selectedTimeSlot;

  if (loading) {
    return <LoadingState message={loadingState.message || "Loading availability..."} />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="container max-w-5xl py-10">
      <h1 className="text-2xl font-bold mb-6">Book a Session with {coachName}</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Date Picker Section */}
        <div>
          <DatePickerSection
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            availableDates={availableDates}
            isDateDisabled={isDateDisabled}
          />
          
          {/* Debug Panel - only shown in development */}
          <DebugPanel 
            selectedDate={selectedDate}
            availableDates={availableDates}
            isDateDisabled={isDateDisabled}
          />
        </div>

        {/* Time Slots Section */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Available Times
              </CardTitle>
              <CardDescription>
                {selectedDate
                  ? `Select a time slot for ${formattedDate}`
                  : "Please select a date first"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <EmptyState message="Select a date to see available times" />
              ) : timeSlotGroups.length === 0 ? (
                <EmptyState message="No available times on this date" />
              ) : (
                <TimeSlotsSection
                  timeSlotGroups={timeSlotGroups}
                  selectedTimeSlot={selectedTimeSlot}
                  onSelectTimeSlot={setSelectedTimeSlot}
                  formatTime={formatTime}
                />
              )}
            </CardContent>
          </Card>

          {/* Booking Summary Section */}
          <BookingSummary
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTimeSlot}
            onConfirm={handleConfirmBooking}
            canBook={canBook}
            isBooking={isBooking}
            coachName={coachName}
            formatTime={formatTime}
          />
        </div>
      </div>
    </div>
  );
}
