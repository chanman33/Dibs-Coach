import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="container max-w-5xl py-10">
      <div className="flex flex-col items-center justify-center py-16">
        <div className="space-y-6 w-full max-w-md">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
} 