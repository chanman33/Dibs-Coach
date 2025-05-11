import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Clock, Calendar } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  startTime?: string;
  endTime?: string;
  coachName?: string;
  eventTypeName?: string;
  redirectCountdown: number;
}

export function SuccessModal({
  isOpen,
  startTime,
  endTime,
  coachName,
  eventTypeName,
  redirectCountdown
}: SuccessModalProps) {
  // CSS to inject at runtime to hide the close button
  const hideCloseButtonStyle = `
    .success-modal [data-dialog-close],
    .success-modal button[aria-label="Close"],
    .success-modal button:has(svg) {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
  `;

  return (
    <>
      <style>{hideCloseButtonStyle}</style>
      <Dialog open={isOpen}>
        <DialogContent className="sm:max-w-md success-modal">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" aria-hidden="true" />
            </div>
            <DialogTitle className="text-center text-lg font-medium text-gray-900 mt-4">
              Session Booked Successfully
            </DialogTitle>
            <DialogDescription className="text-center mt-2">
              Your session has been booked and added to your calendar.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="rounded-lg bg-gray-50 p-4">
              {eventTypeName && (
                <div className="font-medium">{eventTypeName}</div>
              )}
              {coachName && (
                <div className="text-sm text-gray-500 mt-1">
                  with {coachName}
                </div>
              )}
              {startTime && (
                <div className="flex items-center mt-3">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-500">
                    {startTime}
                  </span>
                </div>
              )}
              {endTime && (
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-500">
                    {endTime}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-gray-500">
            Redirecting to your sessions page in {redirectCountdown} seconds...
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 