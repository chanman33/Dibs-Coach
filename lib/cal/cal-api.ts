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

export interface CalTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

class CalApiClient {
  private tokens: CalTokens | null = null;
  private tokenPromise: Promise<CalTokens> | null = null;
  private isConfigured: boolean;

  constructor() {
    // Check if we have the necessary configuration
    this.isConfigured = !!(
      calConfig.clientId && 
      (calConfig.clientSecret || process.env.CAL_CLIENT_SECRET) && 
      calConfig.organizationId
    );
  }

  private async ensureValidToken(): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Cal.com API is not configured. Missing required credentials.');
    }

    if (!this.tokens) {
      if (!this.tokenPromise) {
        this.tokenPromise = this.refreshTokens();
      }
      this.tokens = await this.tokenPromise;
      this.tokenPromise = null;
    } else if (this.tokens.expires_at <= Date.now()) {
      this.tokens = await this.refreshTokens();
    }
    return this.tokens.access_token;
  }

  private async refreshTokens(): Promise<CalTokens> {
    if (!this.isConfigured) {
      throw new Error('Cal.com API is not configured. Missing required credentials.');
    }

    if (!this.tokens?.refresh_token) {
      throw new Error('No refresh token available. Please authenticate first.');
    }

    const response = await fetch('https://api.cal.com/v1/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: calConfig.clientId,
        client_secret: calConfig.clientSecret,
        refresh_token: this.tokens.refresh_token,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh tokens');
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
    };
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.ensureValidToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Fetch available event types
  async getEventTypes(): Promise<CalEventType[]> {
    const headers = await this.getHeaders();
    const response = await fetch('https://api.cal.com/v1/event-types', {
      headers,
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch event types');
    }
    
    return response.json();
  }

  // Fetch available time slots for an event type
  async getAvailability(
    eventTypeId: number,
    start: string,
    end: string
  ): Promise<CalTimeSlot[]> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `https://api.cal.com/v1/availability/${eventTypeId}?start=${start}&end=${end}`,
      {
        headers,
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch availability');
    }
    
    return response.json();
  }

  // Create a new booking
  async createBooking(
    data: CreateBookingData,
    customRedirectPath?: string
  ) {
    const headers = await this.getHeaders();
    const urls = getCalUrls(customRedirectPath);
    
    const response = await fetch('https://api.cal.com/v1/bookings', {
      method: 'POST',
      headers,
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
  }

  // Set tokens (used after OAuth flow)
  setTokens(tokens: CalTokens) {
    this.tokens = tokens;
  }

  // Check if Cal.com is properly configured
  isCalConfigured(): boolean {
    return this.isConfigured;
  }
}

export const calApiClient = new CalApiClient(); 