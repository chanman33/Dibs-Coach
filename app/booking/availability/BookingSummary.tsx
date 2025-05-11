import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { TimeSlot } from "@/utils/types/booking";
import { Clock, Loader2 } from "lucide-react";
import { convertTimeSlotToUserTimezone, getUserTimezone } from "@/utils/timezone-utils";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BookingSummaryProps {
  selectedDate: Date | null;
  selectedTimeSlot: { startTime: Date; endTime: Date } | null;
  onConfirm: (sessionTopic?: string) => void;
  canBook: boolean;
  isBooking: boolean;
  coachName: string;
  formatTime: (time: string | Date) => string;
  coachTimezone: string;
  eventTypeId?: string;
  eventTypeName?: string;
  eventTypeDuration?: number;
}

export function BookingSummary({
  selectedDate,
  selectedTimeSlot,
  onConfirm,
  canBook,
  isBooking,
  coachName,
  formatTime,
  coachTimezone,
  eventTypeId,
  eventTypeName,
  eventTypeDuration
}: BookingSummaryProps) {
  const userTimezone = getUserTimezone();
  const userTimeSlot = selectedTimeSlot 
    ? convertTimeSlotToUserTimezone(selectedTimeSlot, coachTimezone, userTimezone)
    : null;
  
  // State for session topic
  const [sessionTopic, setSessionTopic] = useState("");

  // Calculate duration in minutes - use eventTypeDuration if provided, otherwise calculate from time slot
  const durationMinutes = eventTypeDuration || (userTimeSlot 
    ? Math.round((userTimeSlot.endTime.getTime() - userTimeSlot.startTime.getTime()) / (1000 * 60)) 
    : 0);

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

        {eventTypeName && (
          <div>
            <h4 className="font-medium">Session Type</h4>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              <span>
                {eventTypeName} ({durationMinutes} minutes)
              </span>
            </div>
          </div>
        )}

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
              {formatTime(userTimeSlot.startTime)} - {formatTime(userTimeSlot.endTime)}
              <br />
              <span className="text-xs">
                (Your timezone: {userTimezone})
              </span>
            </p>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="session-topic" className="font-medium">Session Topic</Label>
          <Textarea 
            id="session-topic" 
            placeholder="Briefly describe your topic..."
            value={sessionTopic}
            onChange={(e) => setSessionTopic(e.target.value)}
            className="resize-none h-8 min-h-0 py-1"
            rows={1}
          />
          <p className="text-xs text-muted-foreground">
            This helps your coach prepare for the session
          </p>
        </div>

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
          onClick={() => onConfirm(sessionTopic)}
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