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
  eventTypeDuration?: number; // Duration of the selected event type in minutes
}

export function TimeSlotsSection({
  timeSlotGroups,
  selectedTimeSlot,
  onSelectTimeSlot,
  formatTime,
  coachTimezone,
  eventTypeDuration
}: TimeSlotsSectionProps) {
  const userTimezone = getUserTimezone();

  // Add debug logging to identify rendering issues
  console.log("[DEBUG][TIME_SLOTS_SECTION] Rendering time slots", {
    groupsCount: timeSlotGroups.length,
    totalSlots: timeSlotGroups.reduce((count, group) => count + group.slots.length, 0),
    eventTypeDuration,
    groups: timeSlotGroups.map(g => ({
      title: g.title,
      slotsCount: g.slots.length,
      firstSlot: g.slots[0] ? {
        startTime: g.slots[0].startTime.toISOString(),
        userTimeDisplay: formatUtcDateInTimezone(g.slots[0].startTime, userTimezone)
      } : null
    })),
    userTimezone,
    coachTimezone
  });

  const formatForUser = (date: Date) => {
    return formatUtcDateInTimezone(date, userTimezone);
  };

  // Note: Time slots should already be filtered based on event duration before reaching this component.
  // This means slots that would cause conflicts with the coach's busy times given the event duration
  // have already been removed from the timeSlotGroups.

  return (
    <div className="space-y-6">
      {timeSlotGroups.length === 0 && (
        <div className="p-4 text-center text-muted-foreground">
          No available time slots found for this date.
        </div>
      )}
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