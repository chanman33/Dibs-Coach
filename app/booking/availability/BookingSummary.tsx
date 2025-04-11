import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { TimeSlot } from "@/utils/types/booking";

interface BookingSummaryProps {
  selectedDate?: Date;
  selectedTimeSlot: TimeSlot | null;
  onConfirm: () => void;
  canBook: boolean;
  isBooking: boolean;
  coachName: string;
  formatTime: (date: Date) => string;
}

export function BookingSummary({
  selectedDate,
  selectedTimeSlot,
  onConfirm,
  canBook,
  isBooking,
  coachName,
  formatTime
}: BookingSummaryProps) {
  if (!selectedDate || !selectedTimeSlot) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Booking Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-4">
              <AvatarImage src="" />
              <AvatarFallback>{coachName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{coachName}</p>
              <p className="text-sm text-muted-foreground">Coach</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Date</p>
              <p className="text-sm">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Time</p>
              <p className="text-sm">
                {formatTime(selectedTimeSlot.startTime)} - {formatTime(selectedTimeSlot.endTime)}
              </p>
            </div>
          </div>

          <Alert variant="default" className="bg-muted/50">
            <AlertTitle>Test Mode</AlertTitle>
            <AlertDescription>
              This is running in test mode. No actual bookings will be created.
            </AlertDescription>
          </Alert>

          <Button
            className="w-full"
            onClick={onConfirm}
            disabled={!canBook || isBooking}
          >
            {isBooking ? "Booking..." : "Confirm Booking"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 