import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { createBooking } from '@/utils/actions/booking'
import { toast } from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

declare global {
  interface Window {
    Calendly?: any;
  }
}

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  coachName: string
  coachId: number
  calendlyUrl: string
  eventTypeUrl: string
}

export function BookingModal({
  isOpen,
  onClose,
  coachName,
  coachId,
  calendlyUrl,
  eventTypeUrl,
}: BookingModalProps) {
  const [isLoading, setIsLoading] = useState(true)

  // Load Calendly script and initialize widget
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);

    const loadCalendlyScript = () => {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = initializeWidget;
      document.head.appendChild(script);
    };

    const initializeWidget = () => {
      const container = document.getElementById('calendly-container');
      if (container && window.Calendly) {
        // Clear any existing content
        container.innerHTML = '';
        
        window.Calendly.initInlineWidget({
          url: calendlyUrl,
          parentElement: container,
          prefill: {},
          minWidth: '320px',
          height: '100%'
        });
        setIsLoading(false);
      }
    };

    // Remove any existing Calendly scripts
    const existingScript = document.querySelector('script[src*="calendly"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Clear any existing widgets
    const container = document.getElementById('calendly-container');
    if (container) {
      container.innerHTML = '';
    }

    // Reset Calendly global object
    if (window.Calendly) {
      window.Calendly = undefined;
    }

    loadCalendlyScript();

    return () => {
      // Cleanup when modal closes
      const container = document.getElementById('calendly-container');
      if (container) {
        container.innerHTML = '';
      }
      const script = document.querySelector('script[src*="calendly"]');
      if (script) {
        script.remove();
      }
      if (window.Calendly) {
        window.Calendly = undefined;
      }
    };
  }, [isOpen, calendlyUrl]);

  const handleCalendlyEvent = useCallback(async (e: any) => {
    // Verify the event is from Calendly
    if (e.origin !== 'https://calendly.com') return;
    
    if (e.data.event === 'calendly.event_scheduled') {
      try {
        const scheduledTime = e.data.payload.event.start_time;
        const inviteeEmail = e.data.payload.invitee.email;
        const eventUri = e.data.payload.event.uri;

        const toastId = toast.loading('Scheduling your session...', {
          position: 'top-center'
        });

        await createBooking({
          eventTypeUrl,
          scheduledTime,
          inviteeEmail,
          eventUri,
          coachId
        });

        // Dismiss loading toast
        toast.dismiss(toastId);

        // Show success toast after Calendly's confirmation is visible
        setTimeout(() => {
          toast.success('Session scheduled successfully! Check your email for details.', { 
            position: 'top-center',
            duration: 4000
          });
          
          // Remove the event listener after successful booking
          window.removeEventListener('message', handleCalendlyEvent);
        }, 2000);

      } catch (error: any) {
        console.error('Error creating booking:', error);
        toast.error(error.message || 'Failed to schedule session. Please try again.', { 
          position: 'top-center',
          duration: 4000
        });
      }
    }
  }, [eventTypeUrl, coachId, onClose]);

  // Add event listener when modal opens, remove when it closes
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('message', handleCalendlyEvent);
    }
    return () => {
      window.removeEventListener('message', handleCalendlyEvent);
    };
  }, [isOpen, handleCalendlyEvent]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] max-h-[800px] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Book a Call with {coachName}</DialogTitle>
            <DialogDescription>
              Select a time slot that works best for you
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
                <Loader2 className="h-8 w-8 animate-spin" data-testid="loading-spinner" />
              </div>
            )}
            <div
              id="calendly-container"
              className="w-full h-full"
              style={{ 
                minHeight: '600px'
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

