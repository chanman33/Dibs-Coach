import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { InlineDatePicker } from "@/components/ui/date-picker-inline";
import { useCallback } from "react";
import { format, isSameDay } from "date-fns";

interface DatePickerSectionProps {
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  availableDates: Date[];
  isDateDisabled: (date: Date) => boolean;
}

export function DatePickerSection({
  selectedDate,
  onDateChange,
  availableDates,
  isDateDisabled
}: DatePickerSectionProps) {
  // Create a wrapper for the isDateDisabled function to add debugging
  const handleDateDisabled = useCallback((date: Date) => {
    // Call the original function
    const isDisabled = isDateDisabled(date);
    
    // Log important dates with detailed info
    // if (date.getDate() === 1 || date.getDate() === 15) {
    //   console.log('[DEBUG][DATE_PICKER_SECTION]', {
    //     date: format(date, 'yyyy-MM-dd'),
    //     isDisabled,
    //     inAvailableDates: availableDates.some(d => 
    //       d.getFullYear() === date.getFullYear() &&
    //       d.getMonth() === date.getMonth() &&
    //       d.getDate() === date.getDate()
    //     )
    //   });
    // }
    
    return isDisabled;
  }, [isDateDisabled, availableDates]);
  
  const handleDateSelect = (date: Date | null) => {
    if (!date) return;
    
    // Only log when date actually changes
    if (!selectedDate || date.getTime() !== selectedDate.getTime()) {
      console.log('[DEBUG][DATE_PICKER] Date selected:', {
        date: format(date, 'yyyy-MM-dd'),
        isDisabled: isDateDisabled(date),
        inAvailableDates: availableDates.some(d => isSameDay(d, date))
      });
    }
    
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
          disabledDates={handleDateDisabled}
          className="w-full"
        />
      </CardContent>
    </Card>
  );
} 