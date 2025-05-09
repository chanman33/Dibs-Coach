"use client";

import { useMemo, useState, useEffect } from "react";
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
import { CoachProfileSection } from "./CoachProfileSection";
import { EventTypeSelector } from "./EventTypeSelector";

/**
 * Booking Availability Page
 * 
 * This is the main page for booking coach availability. It displays 
 * a calendar to pick a date, time slots for the selected date,
 * and a booking summary.
 */
export default function BookingAvailabilityPage() {
  // Add state to track if styles are fully loaded
  const [stylesLoaded, setStylesLoaded] = useState(false);
  
  // Ensure styles are loaded and apply a short delay to prevent UI flicker
  useEffect(() => {
    // Mark styles as loaded after a short delay
    const timer = setTimeout(() => {
      setStylesLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const {
    loading,
    loadingState,
    error,
    coachName,
    coachProfileImage,
    coachSpecialty,
    coachDomains,
    selectedDate,
    setSelectedDate,
    availableDates,
    timeSlotGroups,
    selectedTimeSlot,
    setSelectedTimeSlot,
    isBooking,
    handleConfirmBooking,
    isDateDisabled,
    formatTime,
    coachTimezone,
    eventTypes,
    selectedEventTypeId,
    setSelectedEventTypeId
  } = useBookingUI();

  // Format the date for display
  const formattedDate = useMemo(() => {
    if (!selectedDate) return "";
    return format(selectedDate, "EEEE, MMMM d, yyyy");
  }, [selectedDate]);

  // Determine if we can proceed with booking
  const canBook = !!selectedTimeSlot && !!selectedEventTypeId;

  const selectedEventType = useMemo(() => {
    if (!selectedEventTypeId || !eventTypes || eventTypes.length === 0) return null;
    return eventTypes.find(et => et.id === selectedEventTypeId) || null;
  }, [selectedEventTypeId, eventTypes]);

  // Extract event type duration for duration-aware availability filtering
  const eventTypeDuration = useMemo(() => {
    if (!selectedEventType) return undefined;
    return selectedEventType.length || selectedEventType.duration || 30; // Default to 30 min if not specified
  }, [selectedEventType]);

  // Add useEffect to log when event types or selected event type changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG][EVENT_TYPES] Available event types:', 
        eventTypes?.map(et => ({
          id: et.id,
          name: et.title || et.name,
          duration: et.length || et.duration,
          type: et.schedulingType
        })) || []
      );
    }
  }, [eventTypes]);

  useEffect(() => {
    if (selectedEventTypeId && process.env.NODE_ENV === 'development') {
      console.log('[DEBUG][EVENT_TYPES] Selected event type:', 
        selectedEventTypeId,
        eventTypes?.find(et => et.id === selectedEventTypeId)
      );
    }
  }, [selectedEventTypeId, eventTypes]);

  // Show loading state if either the booking data is loading or styles aren't loaded yet
  if (loading || !stylesLoaded) {
    return <LoadingState message={loadingState?.message || "Loading availability..."} />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="container max-w-5xl py-10">
      <h1 className="text-2xl font-bold mb-6">Book a Session with {coachName}</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Coach Profile & Date Selection */}
        <div>
          {/* Coach Profile Section */}
          <CoachProfileSection 
            coachName={coachName} 
            profileImageUrl={coachProfileImage}
            specialty={coachSpecialty}
            domains={coachDomains}
          />
          
          {/* Date Picker Section */}
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
            coachTimezone={coachTimezone}
            selectedEventType={selectedEventType}
            eventTypes={eventTypes}
          />
          
          {/* Add timezone display in booking UI */}
          {coachTimezone && (
            <div className="mt-2 text-xs text-muted-foreground">
              <p>Coach's timezone: {coachTimezone}</p>
              <p className="mt-1 text-xs">Times will adjust to your local timezone when displayed.</p>
            </div>
          )}
        </div>

        {/* Right Column - Event Type Selection, Time Slots, and Booking Summary */}
        <div className="md:col-span-2">
          {/* Event Type Selection */}
          <EventTypeSelector
            eventTypes={eventTypes || []}
            selectedEventTypeId={selectedEventTypeId}
            onSelectEventType={setSelectedEventTypeId}
            isLoading={loading && loadingState.context === 'COACH_DATA'}
          />
          
          {/* Time Slots Section */}
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
              ) : !selectedEventTypeId && eventTypes && eventTypes.length > 0 ? (
                <EmptyState message="Please select a session type first ☝️" />
              ) : timeSlotGroups.length === 0 ? (
                <EmptyState message="No available times on this date, please try a different day 👈" />
              ) : (
                <TimeSlotsSection
                  timeSlotGroups={timeSlotGroups}
                  selectedTimeSlot={selectedTimeSlot}
                  onSelectTimeSlot={setSelectedTimeSlot}
                  formatTime={formatTime}
                  coachTimezone={coachTimezone}
                  eventTypeDuration={eventTypeDuration}
                />
              )}
            </CardContent>
          </Card>

          {/* Booking Summary Section - Only show if all required selections are made */}
          {selectedTimeSlot && selectedEventTypeId && coachTimezone && (
            <BookingSummary
              selectedDate={selectedDate}
              selectedTimeSlot={selectedTimeSlot}
              onConfirm={handleConfirmBooking}
              canBook={canBook}
              isBooking={isBooking}
              coachName={coachName}
              formatTime={formatTime}
              coachTimezone={coachTimezone}
              eventTypeId={selectedEventTypeId}
              eventTypeName={selectedEventType?.title || selectedEventType?.name || "Coaching Session"}
              eventTypeDuration={eventTypeDuration}
            />
          )}
        </div>
      </div>
    </div>
  );
}
