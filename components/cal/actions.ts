'use server';

import { createAuthClient } from '@/utils/auth';
import { calService } from '@/lib/cal/cal-service';
import { revalidatePath } from 'next/cache';

/**
 * Refreshes a user's Cal.com token
 * @param userUlid The user's ULID
 */
export async function refreshCalAccessToken(userUlid: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cal/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userUlid }),
    });
    
    const data = await response.json();
    
    // Revalidate related paths
    revalidatePath('/dashboard/settings');
    revalidatePath('/app/test/cal-webhook-test');
    
    return data;
  } catch (error) {
    console.error('[SERVER_ACTION_ERROR]', {
      context: 'REFRESH_CAL_TOKEN',
      error,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      error: 'Failed to refresh token'
    };
  }
}

/**
 * Gets a user's Cal.com integration
 * @param userUlid The user's ULID
 */
export async function getCalIntegration(userUlid: string) {
  try {
    const supabase = createAuthClient();
    const { data, error } = await supabase
      .from('CalendarIntegration')
      .select('*')
      .eq('userUlid', userUlid)
      .single();
    
    if (error) {
      console.error('[SERVER_ACTION_ERROR]', {
        context: 'GET_CAL_INTEGRATION',
        error,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        error: 'Failed to get Cal.com integration',
        integration: null
      };
    }
    
    return {
      success: true,
      integration: data
    };
  } catch (error) {
    console.error('[SERVER_ACTION_ERROR]', {
      context: 'GET_CAL_INTEGRATION',
      error,
      userUlid,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      error: 'Failed to get Cal.com integration',
      integration: null
    };
  }
}

/**
 * Gets a user's database bookings
 * @param userUlid The user's ULID
 */
export async function getUserDbBookings(userUlid: string) {
  try {
    const supabase = createAuthClient();
    const { data, error } = await supabase
      .from('CalBooking')
      .select('*')
      .eq('userUlid', userUlid);
    
    if (error) {
      console.error('[SERVER_ACTION_ERROR]', {
        context: 'GET_USER_DB_BOOKINGS',
        error,
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        error: 'Failed to get bookings from database',
        bookings: []
      };
    }
    
    return {
      success: true,
      bookings: data || []
    };
  } catch (error) {
    console.error('[SERVER_ACTION_ERROR]', {
      context: 'GET_USER_DB_BOOKINGS',
      error,
      userUlid,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      error: 'Failed to get bookings from database',
      bookings: []
    };
  }
}

/**
 * Validates bookings between Cal.com and the database
 * @param userUlid The user's ULID
 */
export async function validateUserBookings(userUlid: string) {
  try {
    // Get bookings from Cal.com
    const calResult = await calService.fetchUserCalBookings(userUlid);
    
    if (!calResult.success) {
      return {
        success: false,
        error: calResult.error || 'Failed to fetch Cal.com bookings',
        calBookings: [],
        dbBookings: [],
        mismatches: {
          calOnly: [],
          dbOnly: []
        }
      };
    }
    
    // Extract the bookings from the data property
    const calBookings = calResult.data?.bookings || [];
    
    // Get bookings from database
    const dbResult = await getUserDbBookings(userUlid);
    
    if (!dbResult.success) {
      return {
        success: false,
        error: dbResult.error || 'Failed to fetch database bookings',
        calBookings,
        dbBookings: [],
        mismatches: {
          calOnly: [],
          dbOnly: []
        }
      };
    }
    
    // Find mismatches
    const calOnly = calBookings.filter((calBooking: any) => {
      if (!calBooking || !calBooking.uid) return false;
      
      return !(dbResult.bookings || []).some(dbBooking => 
        dbBooking.calBookingUid === calBooking.uid
      );
    });
    
    const dbOnly = (dbResult.bookings || []).filter(dbBooking => {
      if (!dbBooking.calBookingUid) return false;
      
      return !calBookings.some((calBooking: any) => 
        calBooking && calBooking.uid === dbBooking.calBookingUid
      );
    });
    
    return {
      success: true,
      calBookings,
      dbBookings: dbResult.bookings || [],
      mismatches: {
        calOnly,
        dbOnly
      }
    };
  } catch (error) {
    console.error('[SERVER_ACTION_ERROR]', {
      context: 'VALIDATE_USER_BOOKINGS',
      error,
      userUlid,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate bookings',
      calBookings: [],
      dbBookings: [],
      mismatches: {
        calOnly: [],
        dbOnly: []
      }
    };
  }
} 