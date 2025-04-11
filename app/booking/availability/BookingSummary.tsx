import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { TimeSlot } from "@/utils/types/booking";
import { Loader2 } from "lucide-react";
import { convertTimeSlotToUserTimezone, getUserTimezone } from "@/utils/timezone-utils";

interface BookingSummaryProps {
  selectedDate: Date | null;
  selectedTimeSlot: { startTime: Date; endTime: Date } | null;
  onConfirm: () => void;
  canBook: boolean;
  isBooking: boolean;
  coachName: string;
  formatTime: (time: string) => string;
  coachTimezone: string;
}

export function BookingSummary({
  selectedDate,
  selectedTimeSlot,
  onConfirm,
  canBook,
  isBooking,
  coachName,
  formatTime,
  coachTimezone
}: BookingSummaryProps) {
  const userTimezone = getUserTimezone();
  const userTimeSlot = selectedTimeSlot 
    ? convertTimeSlotToUserTimezone(selectedTimeSlot, coachTimezone, userTimezone)
    : null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Booking Summary</CardTitle>
        <CardDescription>
          Review your booking details before confirming
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {selectedDate && (
          <div>
            <h4 className="font-medium">Date</h4>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        )}
        
        {userTimeSlot && (
          <div>
            <h4 className="font-medium">Time</h4>
            <p className="text-sm text-muted-foreground">
              {formatTime(userTimeSlot.startTime.toISOString())} - {formatTime(userTimeSlot.endTime.toISOString())}
              <br />
              <span className="text-xs">
                (Your timezone: {userTimezone})
              </span>
            </p>
          </div>
        )}

        <Alert variant="default" className="bg-muted/50">
          <AlertTitle>Test Mode</AlertTitle>
          <AlertDescription>
            This is running in test mode. No actual bookings will be created.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={onConfirm} 
          disabled={!canBook || isBooking}
        >
          {isBooking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming...
            </>
          ) : (
            "Confirm Booking"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 