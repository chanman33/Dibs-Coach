import { calConfig, getCalUrls } from './cal';

// Types for Cal.com API
export interface CalEventType {
  id: number;
  title: string;
  description: string | null;
  length: number;
  slug: string;
  hidden: boolean;
}

export interface CalTimeSlot {
  time: string;
  attendees: number;
  bookingId: string | null;
}

export interface CreateBookingData {
  eventTypeId: number;
  start: string;
  end: string;
  name: string;
  email: string;
  notes?: string;
  guests?: string[];
  customInputs?: Record<string, any>;
}

export const calApiClient = {
  headers: {
    'Authorization': `Bearer ${calConfig.apiKey}`,
    'Content-Type': 'application/json',
  },

  // Fetch available event types
  async getEventTypes(): Promise<CalEventType[]> {
    const response = await fetch('https://api.cal.com/v1/event-types', {
      headers: this.headers,
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch event types');
    }
    
    return response.json();
  },

  // Fetch available time slots for an event type
  async getAvailability(
    eventTypeId: number,
    start: string,
    end: string
  ): Promise<CalTimeSlot[]> {
    const response = await fetch(
      `https://api.cal.com/v1/availability/${eventTypeId}?start=${start}&end=${end}`,
      {
        headers: this.headers,
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch availability');
    }
    
    return response.json();
  },

  // Create a new booking
  async createBooking(
    data: CreateBookingData,
    customRedirectPath?: string
  ) {
    const urls = getCalUrls(customRedirectPath);
    
    const response = await fetch('https://api.cal.com/v1/bookings', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        ...data,
        redirectUrl: urls.redirect,
        success_url: urls.success,
        cancel_url: urls.cancel,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create booking');
    }
    
    return response.json();
  },
}; 