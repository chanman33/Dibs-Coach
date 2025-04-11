import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { InlineDatePicker } from "@/components/ui/date-picker-inline";

interface DatePickerSectionProps {
  selectedDate?: Date;
  onDateChange: (date: Date | undefined) => void;
  availableDates: Date[];
  isDateDisabled: (date: Date) => boolean;
}

export function DatePickerSection({
  selectedDate,
  onDateChange,
  availableDates,
  isDateDisabled
}: DatePickerSectionProps) {
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
          onSelect={onDateChange}
          disabledDates={isDateDisabled}
          className="w-full"
        />
      </CardContent>
    </Card>
  );
} 