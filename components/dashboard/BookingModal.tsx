import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { createBooking } from '@/utils/actions/booking'
import { toast } from 'react-hot-toast'

declare global {
  interface Window {
    Calendly: any;
  }
}

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  coachName: string
  coachId: number
  calendlyUrl: string | null
  eventTypeUrl: string | null
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

  // Validate Calendly URL
  const isValidCalendlyUrl = (url: string | null) => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.hostname === 'calendly.com';
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!isOpen || !calendlyUrl) return;
    
    // Validate URL before initializing
    if (!isValidCalendlyUrl(calendlyUrl)) {
      console.error('[CALENDLY_ERROR] Invalid Calendly URL:', calendlyUrl);
      toast.error('Invalid booking URL configuration');
      setIsLoading(false);
      return;
    }

    // Load Calendly script
    const loadCalendlyScript = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if script already exists
        if (document.querySelector('script[src*="calendly"]')) {
          if (window.Calendly) {
            resolve();
          } else {
            // Script exists but not loaded yet, wait for it
            const checkCalendly = setInterval(() => {
              if (window.Calendly) {
                clearInterval(checkCalendly);
                resolve();
              }
            }, 100);
          }
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
          console.error('[CALENDLY_ERROR] Failed to load script');
          reject(new Error('Failed to load Calendly script'));
        };
        document.head.appendChild(script);
      });
    };

    const initializeWidget = async () => {
      try {
        await loadCalendlyScript();
        
        const container = document.getElementById('calendly-container');
        if (container && window.Calendly) {
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
      } catch (error) {
        console.error('[CALENDLY_ERROR] Failed to initialize widget:', error);
        setIsLoading(false);
        toast.error('Failed to load booking widget. Please try again.');
      }
    };

    initializeWidget();

    return () => {
      const container = document.getElementById('calendly-container');
      if (container) {
        container.innerHTML = '';
      }
      setIsLoading(true);
    };
  }, [isOpen, calendlyUrl]);

  const handleCalendlyEvent = useCallback(async (e: any) => {
    if (e.origin !== 'https://calendly.com') return;
    
    if (e.data.event === 'calendly.event_scheduled') {
      try {
        if (!eventTypeUrl) {
          throw new Error('Booking URL not configured');
        }

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

        toast.dismiss(toastId);

        setTimeout(() => {
          toast.success('Session scheduled successfully! Check your email for details.', { 
            position: 'top-center',
            duration: 4000
          });
          onClose();
        }, 2000);

      } catch (error: any) {
        console.error('[CALENDLY_ERROR] Error creating booking:', error);
        toast.error(error.message || 'Failed to schedule session. Please try again.', { 
          position: 'top-center',
          duration: 4000
        });
      }
    }
  }, [eventTypeUrl, coachId, onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('message', handleCalendlyEvent);
    }
    return () => {
      window.removeEventListener('message', handleCalendlyEvent);
    };
  }, [isOpen, handleCalendlyEvent]);

  return (
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
            style={{ minHeight: '600px' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

