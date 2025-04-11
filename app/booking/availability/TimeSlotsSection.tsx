import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TimeSlot, TimeSlotGroup } from "@/utils/types/booking";
import { 
  getUserTimezone,
  formatUtcDateInTimezone
} from "@/utils/timezone-utils";

interface TimeSlotsSectionProps {
  timeSlotGroups: TimeSlotGroup[];
  selectedTimeSlot: { startTime: Date; endTime: Date } | null;
  onSelectTimeSlot: (slot: { startTime: Date; endTime: Date }) => void;
  formatTime: (time: string | Date) => string;
  coachTimezone: string | undefined;
}

export function TimeSlotsSection({
  timeSlotGroups,
  selectedTimeSlot,
  onSelectTimeSlot,
  formatTime,
  coachTimezone
}: TimeSlotsSectionProps) {
  const userTimezone = getUserTimezone();

  const formatForUser = (date: Date) => {
    return formatUtcDateInTimezone(date, userTimezone);
  };

  return (
    <div className="space-y-6">
      {timeSlotGroups.map((group, index) => (
        <div key={index} className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">{group.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {group.slots.map((slot, slotIndex) => {
              const isSelected = selectedTimeSlot?.startTime.getTime() === slot.startTime.getTime();
              
              return (
                <Button
                  key={slotIndex}
                  variant={isSelected ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => onSelectTimeSlot(slot)}
                >
                  {formatForUser(slot.startTime)}
                </Button>
              );
            })}
          </div>
          {group !== timeSlotGroups[timeSlotGroups.length - 1] && (
            <Separator className="my-2" />
          )}
        </div>
      ))}
    </div>
  );
} 