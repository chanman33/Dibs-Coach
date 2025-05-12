// Cal.com webhook event types
export enum CalWebhookEventType {
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_RESCHEDULED = 'BOOKING_RESCHEDULED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_REJECTED = 'BOOKING_REJECTED',
  BOOKING_REQUESTED = 'BOOKING_REQUESTED',
  BOOKING_PAYMENT_INITIATED = 'BOOKING_PAYMENT_INITIATED',
  BOOKING_PAYMENT_CONFIRMED = 'BOOKING_PAYMENT_CONFIRMED',
  BOOKING_UPDATED = 'BOOKING_UPDATED',
  FORM_SUBMITTED = 'FORM_SUBMITTED',
  MEETING_ENDED = 'MEETING_ENDED',
  RECORDING_READY = 'RECORDING_READY'
}

// Payload interfaces
export interface CalBookingPayload {
  uid: string;
  title: string;
  eventTypeId: number;
  startTime: string;
  endTime: string;
  description?: string;
  attendees: {
    email: string;
    name: string;
    timeZone: string;
    language: {
      locale: string;
    };
  }[];
  organizer: {
    id: number;
    name: string;
    email: string;
    username?: string;
    timeZone: string;
    language: {
      locale: string;
    };
  };
  status?: string;
  responses?: Record<string, any>;
  metadata?: Record<string, any>;
  location?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  payment?: {
    amount: number;
    currency: string;
    status: string;
  };
}

export interface CalWebhookEvent {
  triggerEvent: CalWebhookEventType;
  type?: string; // Kept for compatibility if 'type' is sometimes used instead of triggerEvent
  createdAt: string;
  payload: CalBookingPayload;
} 