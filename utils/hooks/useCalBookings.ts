'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface CalBooking {
  ulid: string;
  userUlid: string;
  calBookingUid: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  attendeeEmail: string;
  attendeeName: string;
  allAttendees: string;
  status: 'CONFIRMED' | 'PENDING' | 'REJECTED' | 'CANCELLED';
  cancellationReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface UseCalBookingsOptions {
  userUlid?: string;
  includeHistory?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  refetchInterval?: number;
}

interface UseCalBookingsReturn {
  bookings: CalBooking[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  cancelBooking: (calBookingUid: string, reason?: string) => Promise<boolean>;
}

export function useCalBookings(options: UseCalBookingsOptions = {}): UseCalBookingsReturn {
  const { userUlid: optionsUserUlid, includeHistory = false, dateRange, refetchInterval } = options;
  const [bookings, setBookings] = useState<CalBooking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { isSignedIn, userUlid: authUserUlid } = useAuth();
  
  // Use the provided userUlid or fall back to the authenticated user's ULID
  const userUlid = optionsUserUlid || authUserUlid;

  // Build query params for the API
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (userUlid) {
      params.append('userUlid', userUlid);
    }
    
    if (includeHistory) {
      params.append('includeHistory', 'true');
    }
    
    if (dateRange) {
      params.append('startDate', dateRange.start.toISOString());
      params.append('endDate', dateRange.end.toISOString());
    }
    
    return params.toString();
  };

  // Fetch bookings from the API
  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams = buildQueryParams();
      const url = `/api/cal/bookings${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('[FETCH_BOOKINGS_ERROR]', err);
      setError(err instanceof Error ? err : new Error('An error occurred while fetching bookings'));
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel a booking
  const cancelBooking = async (calBookingUid: string, reason?: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/cal/bookings/${calBookingUid}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }
      
      // Update local state
      setBookings(prev => 
        prev.map(booking => 
          booking.calBookingUid === calBookingUid 
            ? { ...booking, status: 'CANCELLED', cancellationReason: reason || 'Cancelled by user' } 
            : booking
        )
      );
      
      return true;
    } catch (err) {
      console.error('[CANCEL_BOOKING_ERROR]', err);
      return false;
    }
  };

  // Fetch bookings on mount and when dependencies change
  useEffect(() => {
    if (isSignedIn && userUlid) {
      fetchBookings();
    }
    
    // Set up a refresh interval if specified
    if (refetchInterval && isSignedIn && userUlid) {
      const intervalId = setInterval(fetchBookings, refetchInterval);
      return () => clearInterval(intervalId);
    }
  }, [isSignedIn, userUlid, includeHistory, JSON.stringify(dateRange)]);

  return {
    bookings,
    isLoading,
    error,
    refetch: fetchBookings,
    cancelBooking
  };
} 