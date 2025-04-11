import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TimeSlot, TimeSlotGroup } from "@/utils/types/booking";
import clsx from "clsx";

interface TimeSlotsSectionProps {
  timeSlotGroups: TimeSlotGroup[];
  selectedTimeSlot: TimeSlot | null;
  onSelectTimeSlot: (slot: TimeSlot) => void;
  formatTime: (date: Date) => string;
}

export function TimeSlotsSection({
  timeSlotGroups,
  selectedTimeSlot,
  onSelectTimeSlot,
  formatTime
}: TimeSlotsSectionProps) {
  return (
    <div className="space-y-6">
      {timeSlotGroups.map((group) => (
        <div key={group.title} className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">{group.title}</h3>
          <div className="grid grid-cols-3 gap-2">
            {group.slots.map((slot, idx) => {
              const isSelected = selectedTimeSlot && 
                selectedTimeSlot.startTime.getTime() === slot.startTime.getTime();
              
              return (
                <Button
                  key={idx}
                  variant={isSelected ? "default" : "outline"}
                  className={clsx("h-auto py-2 justify-start")}
                  onClick={() => onSelectTimeSlot(slot)}
                >
                  {formatTime(slot.startTime)}
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