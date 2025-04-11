import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="container max-w-5xl py-10">
      <div className="flex flex-col items-center justify-center py-16">
        <div className="space-y-6 w-full max-w-md">
          <div className="space-y-2 text-center">
            <Skeleton className="h-8 w-1/2 mx-auto" />
            <Skeleton className="h-4 w-2/3 mx-auto" />
          </div>
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[200px] w-full" />
          <p className="text-center text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
} 