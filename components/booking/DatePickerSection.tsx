import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon } from "lucide-react";
import { InlineDatePicker } from "@/components/ui/date-picker-inline";
import { format } from "date-fns";

interface DatePickerSectionProps {
  loading: boolean;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  isDateDisabled: (date: Date) => boolean;
}

export function DatePickerSection({ 
  loading, 
  selectedDate, 
  setSelectedDate, 
  isDateDisabled 
}: DatePickerSectionProps) {
  console.log('[DEBUG][DATE_PICKER] Rendering DatePickerSection', {
    loading,
    selectedDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
  });

  // Custom date disable checker with logging
  const handleIsDateDisabled = (date: Date) => {
    const disabled = isDateDisabled(date);
    // Log only occasionally to avoid console spam - we'll log the first of each month
    if (date.getDate() === 1) {
      console.log(`[DEBUG][DATE_PICKER] Date ${format(date, 'yyyy-MM-dd')} disabled: ${disabled}`);
    }
    return disabled;
  };

  // Handle date selection with logging
  const handleDateSelection = (date: Date | null) => {
    console.log('[DEBUG][DATE_PICKER] Date selected', {
      date: date ? format(date, 'yyyy-MM-dd') : null,
      day: date ? format(date, 'EEEE') : null
    });
    setSelectedDate(date || undefined);
  };

  return (
    <Card className="lg:col-span-5">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarIcon className="mr-2 h-5 w-5" />
          Select a Date
        </CardTitle>
        <CardDescription>
          You can book from tomorrow up to 15 days in advance. Same-day bookings are not available.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-80 w-full" />
        ) : (
          <div className="flex justify-center">
            <InlineDatePicker
              date={selectedDate || null}
              onSelect={handleDateSelection}
              disabledDates={handleIsDateDisabled}
              className="w-full"
              aria-label="Select a booking date"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
} 