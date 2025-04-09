interface BookingStepsProps {
  selectedDate?: Date | null;
  selectedTimeSlot: any | null;
}

export function BookingSteps({ selectedDate, selectedTimeSlot }: BookingStepsProps) {
  return (
    <div className="flex items-center justify-center mb-8 max-w-md mx-auto">
      <div className="flex flex-col items-center">
        <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-medium">
          1
        </div>
        <span className="text-sm mt-1">Select Date</span>
      </div>
      <div className="h-px bg-border w-16 mx-2"></div>
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
            selectedDate ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          2
        </div>
        <span className="text-sm mt-1">Choose Time</span>
      </div>
      <div className="h-px bg-border w-16 mx-2"></div>
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
            selectedTimeSlot ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          3
        </div>
        <span className="text-sm mt-1">Confirm</span>
      </div>
    </div>
  );
} 