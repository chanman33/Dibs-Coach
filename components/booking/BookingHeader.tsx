import { Skeleton } from "@/components/ui/skeleton";

interface BookingHeaderProps {
  loading: boolean;
  coachName: string;
}

export function BookingHeader({ loading, coachName }: BookingHeaderProps) {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-bold mb-2">
        {loading ? <Skeleton className="h-10 w-2/3 mx-auto" /> : `Book a Session with ${coachName}`}
      </h1>
      <p className="text-muted-foreground max-w-xl mx-auto">
        {loading ? (
          <Skeleton className="h-5 w-full mx-auto mt-2" />
        ) : (
          "Select a date and time that works for you to schedule your coaching session."
        )}
      </p>
    </div>
  );
} 