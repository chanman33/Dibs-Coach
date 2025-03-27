import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createAuthClient } from '@/utils/auth';

/**
 * API endpoint to fetch bookings from the database for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      console.error('[API_ERROR]', {
        context: 'DB_BOOKINGS_AUTH',
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Get the user's ULID from Supabase
    const supabase = createAuthClient();
    const { data: user, error } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single();

    if (error || !user?.ulid) {
      console.error('[API_ERROR]', {
        context: 'DB_BOOKINGS_USER',
        error: error || 'User not found',
        userId,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 500 });
    }

    // Fetch bookings from Supabase
    const { data: bookings, error: bookingsError } = await supabase
      .from('CalBooking')
      .select('*')
      .eq('userUlid', user.ulid);

    if (bookingsError) {
      console.error('[API_ERROR]', {
        context: 'DB_BOOKINGS_FETCH',
        error: bookingsError,
        userUlid: user.ulid,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch bookings from database',
        bookings: []
      });
    }

    console.log('[API_SUCCESS]', {
      context: 'DB_BOOKINGS',
      bookingsCount: bookings?.length || 0,
      userUlid: user.ulid,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      bookings: bookings || []
    });
    
  } catch (error) {
    console.error('[API_ERROR]', {
      context: 'DB_BOOKINGS_GENERAL',
      error,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      bookings: []
    }, { status: 500 });
  }
} 