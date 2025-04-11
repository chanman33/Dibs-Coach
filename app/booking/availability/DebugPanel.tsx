"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTomorrowDate, getMaxBookingDate } from "@/utils/date-utils";
import { useEffect } from "react";

interface DebugPanelProps {
  selectedDate?: Date;
  availableDates: Date[];
  isDateDisabled?: (date: Date) => boolean;
}

export function DebugPanel({ selectedDate, availableDates, isDateDisabled }: DebugPanelProps) {
  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const tomorrow = getTomorrowDate();
  const maxDate = getMaxBookingDate();
  
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
        <CardTitle className="text-sm font-medium text-yellow-600">Debug: Date Information</CardTitle>
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
      </CardContent>
    </Card>
  );
} 