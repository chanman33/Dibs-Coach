import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, CheckCircle, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Coach, TimeSlot } from "@/utils/types/booking";
import { formatTime, formatDuration } from "@/utils/date-utils";

interface BookingSummaryProps {
  loading: boolean;
  coach: Coach | null;
  selectedDate: Date | undefined;
  selectedTimeSlot: TimeSlot | null;
  handleBookSession: () => void;
  isBooking: boolean;
}

export function BookingSummary({
  loading,
  coach,
  selectedDate,
  selectedTimeSlot,
  handleBookSession,
  isBooking
}: BookingSummaryProps) {
  console.log('[DEBUG][BOOKING_SUMMARY] Rendering BookingSummary', {
    loading,
    coachInfo: coach ? {
      name: coach.name,
      sessionType: coach.sessionType,
      hasDuration: !!coach.sessionDuration
    } : null,
    selectedDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
    hasTimeSlot: !!selectedTimeSlot,
    timeSlot: selectedTimeSlot ? {
      start: formatTime(selectedTimeSlot.startTime),
      end: formatTime(selectedTimeSlot.endTime)
    } : null,
    isBooking
  });

  const canBook = selectedDate && selectedTimeSlot;
  
  // Handle booking with debug logging
  const handleBookingRequest = () => {
    console.log('[DEBUG][BOOKING_SUMMARY] Book session clicked', {
      date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
      timeSlot: selectedTimeSlot ? {
        start: formatTime(selectedTimeSlot.startTime),
        end: formatTime(selectedTimeSlot.endTime)
      } : null,
      coach: coach?.name
    });
    
    handleBookSession();
  };
  
  return (
    <Card className="lg:col-span-5">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarClock className="mr-2 h-5 w-5" />
          Booking Summary
        </CardTitle>
        <CardDescription>Review your session details before booking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Coach</h3>
                <p className="font-medium">{coach?.name || "Loading coach info..."}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Session Type</h3>
                <p className="font-medium">{coach?.sessionType || "1:1 Coaching Session"}</p>
                {coach?.sessionDuration && (
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Clock className="mr-1 h-3 w-3" />
                    <p>{formatDuration(coach.sessionDuration)}</p>
                  </div>
                )}
              </div>
              
              {selectedDate && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Date</h3>
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <p>{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
                  </div>
                </div>
              )}
              
              {selectedTimeSlot && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Time</h3>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <p>{formatTime(selectedTimeSlot.startTime)} - {formatTime(selectedTimeSlot.endTime)}</p>
                  </div>
                </div>
              )}
            </div>
            
            {canBook && (
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-start">
                  <CheckCircle className="mt-0.5 mr-2 h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Ready to book</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your session with {coach?.name} is ready to be scheduled.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          disabled={!canBook || isBooking} 
          onClick={handleBookingRequest}
        >
          {isBooking ? "Booking..." : "Book Session"}
        </Button>
      </CardFooter>
    </Card>
  );
} 