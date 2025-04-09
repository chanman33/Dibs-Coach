import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { TimeSlotGroup, TimeSlot } from "@/utils/types/booking";
import { formatTime } from "@/utils/date-utils";

interface TimeSlotsProps {
  loading: boolean;
  selectedDate: Date | undefined;
  timeSlotGroups: TimeSlotGroup[];
  handleSelectTimeSlot: (slot: TimeSlot) => void;
  isBooking: boolean;
}

export function TimeSlotsSection({
  loading,
  selectedDate,
  timeSlotGroups,
  handleSelectTimeSlot,
  isBooking
}: TimeSlotsProps) {
  // Debug logging when timeSlotGroups changes
  console.log('[DEBUG][TIME_SLOTS] Rendering TimeSlotsSection', {
    loading,
    hasDate: !!selectedDate,
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
    groupsCount: timeSlotGroups.length,
    totalSlots: timeSlotGroups.reduce((total, group) => total + group.slots.length, 0),
    groups: timeSlotGroups.map(group => ({
      title: group.title,
      count: group.slots.length
    }))
  });

  // Handler for time slot selection with logging
  const onSelectTimeSlot = (slot: TimeSlot) => {
    console.log('[DEBUG][TIME_SLOTS] Time slot selected', {
      start: format(slot.startTime, 'HH:mm'),
      end: format(slot.endTime, 'HH:mm'),
      formatted: `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`
    });
    
    handleSelectTimeSlot(slot);
  };

  return (
    <Card className="lg:col-span-7">
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
            {timeSlotGroups.map((group, index) => {
              console.log(`[DEBUG][TIME_SLOTS] Rendering group: ${group.title} with ${group.slots.length} slots`);
              return (
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
                        onClick={() => onSelectTimeSlot(slot)}
                        disabled={isBooking}
                      >
                        {formatTime(slot.startTime)}
                      </Button>
                    ))}
                  </div>
                  {index < timeSlotGroups.length - 1 && <Separator className="my-4" />}
                </div>
              )
            })}
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
  );
} 