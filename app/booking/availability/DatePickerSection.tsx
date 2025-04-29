import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { InlineDatePicker } from "@/components/ui/date-picker-inline";
import { useCallback, useEffect } from "react";
import { format, isSameDay, getDay } from "date-fns";

interface DatePickerSectionProps {
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  // Array of dates with confirmed, bookable slots
  availableDates: Date[]; 
  // Function to check if a date is outside booking window or generally non-working
  isDateDisabled: (date: Date) => boolean; 
}

export function DatePickerSection({
  selectedDate,
  onDateChange,
  availableDates, // Renamed in hook, this is now dates *with* slots
  isDateDisabled // This is passed directly to check for disabled state
}: DatePickerSectionProps) {

  // Debug log: Show the list of dates received (should have slots)
  useEffect(() => {
    console.log('[DEBUG][DATE_PICKER_SECTION] Received availableDates prop (should have slots):', {
      count: availableDates.length,
      dates: availableDates.map(d => format(d, 'yyyy-MM-dd')),
    });
  }, [availableDates]);

  // Simplified handleDateSelect - just passes the date up
  const handleDateSelect = (date: Date | null) => {
    // Basic log on selection
    console.log('[DEBUG][DATE_PICKER_SECTION] Date selected:', {
      date: date ? format(date, 'yyyy-MM-dd') : null,
      // You could add checks here if needed, but InlineDatePicker handles styles
    });
    onDateChange(date);
  };
  
  return (
    <Card>
       <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2" />
          Select Date
        </CardTitle>
        <CardDescription>Choose an available date</CardDescription>
      </CardHeader>
      <CardContent>
        <InlineDatePicker
          date={selectedDate}
          onSelect={handleDateSelect}
          // Pass the function to disable dates outside window/off-days
          disabledDates={isDateDisabled} 
          // Pass the pre-filtered list of dates that HAVE slots
          bookableDates={availableDates} 
          className="w-full"
        />
        
        {/* Updated Legend reflecting the new CSS classes/logic */}
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          {/* State 3: Bookable (Turquoise background) */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-[#E6F4F1]"></div>
            <span>Bookable (slots available)</span>
          </div>
          {/* State 2: Clickable but not bookable (Default background) */}
          <div className="flex items-center gap-2">
            {/* Represent default clickable style (e.g., simple border or default bg) */}
            <div className="w-4 h-4 rounded-md border border-input bg-transparent"></div>
            <span>Available (no slots)</span> 
          </div>
          {/* State 1: Disabled (Grayed out text) */}
          <div className="flex items-center gap-2">
             {/* Represent disabled style (e.g., lighter text color) */}
            <div className="w-4 h-4 rounded-md border border-muted-foreground/30 flex items-center justify-center">
              <span className="text-muted-foreground/50">15</span>
            </div>
            <span>Unavailable / Outside window</span>
          </div>
           {/* Selected States */}
           <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-[#E7F5EF]"></div>
            <span>Selected (Bookable)</span>
          </div>
           <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-foreground"></div>
            <span>Selected (No Slots)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 