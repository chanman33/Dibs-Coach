import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/utils/format";
import { formatTime } from "@/utils/date-time";
import { PublicCoach } from "@/utils/types/coach";

interface TimeSlot {
  startTime: string;
  endTime: string;
  rate: number;
  currency: string;
}

// Format duration in minutes to readable format
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  } else if (minutes === 60) {
    return '1 hour';
  } else if (minutes % 60 === 0) {
    return `${minutes / 60} hours`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
  }
}

interface BookingSummaryProps {
  loading?: boolean;
  coach?: PublicCoach;
  selectedDate?: Date | string;
  selectedTimeSlot?: TimeSlot;
  handleBookSession: () => void;
  isBooking?: boolean;
}

export function BookingSummary({
  loading = false,
  coach,
  selectedDate,
  selectedTimeSlot,
  handleBookSession,
  isBooking = false,
}: BookingSummaryProps) {
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-[250px]" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[180px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[180px]" />
            <Skeleton className="h-4 w-[160px]" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  // Format date from string or Date object
  const formattedDate = selectedDate 
    ? typeof selectedDate === 'string' 
      ? formatDate(selectedDate) 
      : formatDate(selectedDate.toISOString())
    : '';

  // Format start and end times
  const formattedTime = selectedTimeSlot 
    ? `${formatTime(selectedTimeSlot.startTime)} - ${formatTime(selectedTimeSlot.endTime)}`
    : '';

  // Calculate and format the duration
  const calculateDuration = () => {
    if (!selectedTimeSlot) return '';
    
    // Parse times and calculate duration in minutes
    const start = new Date(`1970-01-01T${selectedTimeSlot.startTime}`);
    const end = new Date(`1970-01-01T${selectedTimeSlot.endTime}`);
    const durationInMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    
    return formatDuration(durationInMinutes);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {coach && (
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={coach.profileImageUrl || undefined} alt={coach.displayName || "Coach"} />
              <AvatarFallback>
                {coach.firstName?.[0] || ''}{coach.lastName?.[0] || ''}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">
                {coach.displayName || `${coach.firstName || ''} ${coach.lastName || ''}`}
              </h3>
              <p className="text-sm text-muted-foreground">Coaching Session</p>
            </div>
          </div>
        )}
        <div className="space-y-2">
          {selectedDate && (
            <div className="flex flex-col text-sm">
              <span className="text-muted-foreground">Date:</span>
              <span>{formattedDate}</span>
            </div>
          )}
          {selectedTimeSlot && (
            <>
              <div className="flex flex-col text-sm">
                <span className="text-muted-foreground">Time:</span>
                <span>{formattedTime}</span>
              </div>
              <div className="flex flex-col text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <span>{calculateDuration()}</span>
              </div>
              <div className="flex flex-col text-sm">
                <span className="text-muted-foreground">Price:</span>
                <span>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: selectedTimeSlot.currency,
                  }).format(selectedTimeSlot.rate)}
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleBookSession}
          disabled={isBooking || !selectedTimeSlot || !selectedDate}
          className="w-full"
        >
          {isBooking ? "Processing..." : "Book Session"}
        </Button>
      </CardFooter>
    </Card>
  );
} 