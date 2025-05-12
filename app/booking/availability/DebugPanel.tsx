"use client"

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTomorrowDate, getMaxBookingDate } from "@/utils/date-utils";
import { useEffect } from "react";
import { getUserTimezone } from "@/utils/timezone-utils";
import { CalEventType } from "@/utils/types/coach-availability";

interface DebugPanelProps {
  selectedDate: Date | null;
  availableDates: Date[];
  isDateDisabled: (date: Date) => boolean;
  coachTimezone?: string;
  selectedEventType?: CalEventType | null;
  eventTypes?: CalEventType[];
}

export function DebugPanel({ 
  selectedDate, 
  availableDates, 
  isDateDisabled,
  coachTimezone,
  selectedEventType,
  eventTypes
}: DebugPanelProps) {
  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const tomorrow = getTomorrowDate();
  const maxDate = getMaxBookingDate();
  const userTimezone = getUserTimezone();
  
  // Test the isDateDisabled function with specific dates
  useEffect(() => {
    if (!isDateDisabled) return;
    
    // Test dates: today, tomorrow, maxDate, and one day beyond each boundary
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dayAfterMax = new Date(maxDate);
    dayAfterMax.setDate(maxDate.getDate() + 1);
    
    const testDates = [
      { name: "Today", date: today },
      { name: "Tomorrow", date: tomorrow },
      { name: "Max Date", date: maxDate },
      { name: "Day After Max", date: dayAfterMax }
    ];
    
    console.log('[DEBUG][DATE_DISABLED_TEST] Testing isDateDisabled function:');
    testDates.forEach(test => {
      const isDisabled = isDateDisabled(test.date);
      console.log(`  - ${test.name} (${format(test.date, 'yyyy-MM-dd')}): ${isDisabled ? "DISABLED ❌" : "ENABLED ✅"}`);
    });
    
  }, [isDateDisabled, tomorrow, maxDate]);

  return (
    <Card className="mt-4 border-dashed border-yellow-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-yellow-600">Debug: Booking Information</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>Booking Window:</strong> {format(tomorrow, "yyyy-MM-dd")} to {format(maxDate, "yyyy-MM-dd")}
        </div>
        <div>
          <strong>Current Date:</strong> {format(new Date(), "yyyy-MM-dd")}
        </div>
        <div>
          <strong>Selected Date:</strong> {selectedDate ? format(selectedDate, "yyyy-MM-dd") : "None"}
        </div>
        <div>
          <strong>First Available Date:</strong> {availableDates.length > 0 ? format(availableDates[0], "yyyy-MM-dd") : "None"}
        </div>
        <div>
          <strong>Last Available Date:</strong> {availableDates.length > 0 ? format(availableDates[availableDates.length - 1], "yyyy-MM-dd") : "None"}
        </div>
        <div>
          <strong>Available Dates Count:</strong> {availableDates.length}
        </div>
        <div>
          <strong>User Timezone:</strong> {userTimezone}
        </div>
        {coachTimezone && (
          <div>
            <strong>Coach Timezone:</strong> {coachTimezone}
          </div>
        )}
        
        {/* Event Type Debug Information */}
        {eventTypes && eventTypes.length > 0 && (
          <div className="pt-2 border-t border-dashed border-yellow-300 mt-2">
            <strong>Available Event Types:</strong> {eventTypes.length}
            <ul className="mt-1 pl-2">
              {eventTypes.map((et) => (
                <li key={et.id} className={selectedEventType?.id === et.id ? "font-medium" : ""}>
                  {et.title || et.name} ({et.length || et.duration} min) - ID: {et.id}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {selectedEventType && (
          <div className="pt-2 border-t border-dashed border-yellow-300 mt-2">
            <strong>Selected Event Type:</strong>
            <div className="mt-1 pl-2">
              <div><span className="opacity-70">Name:</span> {selectedEventType.title || selectedEventType.name}</div>
              <div><span className="opacity-70">Duration:</span> {selectedEventType.length || selectedEventType.duration} minutes</div>
              <div><span className="opacity-70">Type:</span> {selectedEventType.schedulingType || "MANAGED"}</div>
              <div><span className="opacity-70">ID:</span> {selectedEventType.id}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
