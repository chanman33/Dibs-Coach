'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface CalBooking {
  uid: string;
  title: string;
  startTime?: string;
  start?: string;
  status?: string;
}

export interface DbBooking {
  calBookingUid: string;
  title: string;
  startTime?: string;
  status?: string;
}

export interface BookingValidationResult {
  isLoading: boolean;
  calBookings: CalBooking[];
  mismatches: {
    calOnly: CalBooking[];
    dbOnly: DbBooking[];
  };
  error: string | null;
}

/**
 * Fetches and validates bookings between Cal.com API and the database
 * @returns The validation result
 */
export async function fetchAndValidateBookings(): Promise<Partial<BookingValidationResult>> {
  try {
    // Fetch bookings from the Cal.com API
    const calResponse = await fetch('/api/cal/test/fetch-bookings');
    
    if (!calResponse.ok) {
      const errorData = await calResponse.json();
      return {
        calBookings: [],
        mismatches: {
          calOnly: [],
          dbOnly: []
        },
        error: errorData.error || `API returned ${calResponse.status}`
      };
    }
    
    const calData = await calResponse.json();
    
    if (!calData.success) {
      return {
        calBookings: [],
        mismatches: {
          calOnly: [],
          dbOnly: []
        },
        error: calData.error || 'Failed to fetch Cal.com bookings'
      };
    }
    
    // Safety check for bookings array
    const calBookings: CalBooking[] = Array.isArray(calData.bookings) ? calData.bookings : [];
    
    if (calBookings.length === 0) {
      return {
        calBookings: [],
        mismatches: {
          calOnly: [],
          dbOnly: []
        },
        error: 'No bookings found in Cal.com'
      };
    }
    
    // Fetch bookings from our database
    const supabase = createClientComponentClient();
    const { data: dbBookings, error: dbError } = await supabase
      .from('Booking')
      .select('*');
    
    if (dbError) {
      return {
        calBookings,
        mismatches: {
          calOnly: [],
          dbOnly: []
        },
        error: `Database error: ${dbError.message}`
      };
    }
    
    // Find bookings that exist in Cal.com but not in our DB
    const calOnly = calBookings.filter((calBooking: CalBooking) => {
      // Handle potential null/undefined calBooking
      if (!calBooking || !calBooking.uid) return false;
      
      // Find matching booking in DB by Cal.com UID
      return !dbBookings.some((dbBooking: DbBooking) => 
        dbBooking.calBookingUid === calBooking.uid
      );
    });
    
    // Find bookings that exist in our DB but not in Cal.com
    const dbOnly = dbBookings.filter((dbBooking: DbBooking) => {
      // Skip bookings without a Cal.com UID
      if (!dbBooking.calBookingUid) return false;
      
      // Find matching booking in Cal.com by UID
      return !calBookings.some((calBooking: CalBooking) => 
        calBooking && calBooking.uid === dbBooking.calBookingUid
      );
    });
    
    return {
      calBookings,
      mismatches: {
        calOnly,
        dbOnly
      },
      error: null
    };
    
  } catch (error: any) {
    console.error('Booking validation error:', error);
    return {
      calBookings: [],
      mismatches: {
        calOnly: [],
        dbOnly: []
      },
      error: error.message || 'Failed to validate bookings'
    };
  }
}

export function validateBookings(calBookings: CalBooking[], dbBookings: DbBooking[]): BookingValidationResult {
  const calOnly: CalBooking[] = [];
  const dbOnly: DbBooking[] = [];

  // Find bookings in Cal.com that aren't in DB
  for (const calBooking of calBookings) {
    if (!dbBookings.some(db => db.calBookingUid === calBooking.uid)) {
      calOnly.push(calBooking);
    }
  }

  // Find bookings in DB that aren't in Cal.com
  for (const dbBooking of dbBookings) {
    if (!calBookings.some(cal => cal.uid === dbBooking.calBookingUid)) {
      dbOnly.push(dbBooking);
    }
  }

  return {
    isLoading: false,
    calBookings,
    mismatches: {
      calOnly,
      dbOnly
    },
    error: null
  };
} 