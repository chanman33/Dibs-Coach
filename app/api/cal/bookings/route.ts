import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/utils/auth';
import { auth } from '@clerk/nextjs/server';
import type { Database } from '@/types/supabase';

type CalBooking = Database['public']['Tables']['CalBooking']['Row'];

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userUlid = searchParams.get('userUlid');
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    
    // Initialize Supabase client
    const supabase = createAuthClient();
    
    // Get the current user's ULID if not specified
    let queryUserUlid = userUlid;
    if (!queryUserUlid) {
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('ulid')
        .eq('userId', userId)
        .single();
      
      if (userError) {
        console.error('[GET_BOOKINGS_ERROR] Failed to get user ULID:', userError);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      queryUserUlid = userData.ulid;
    }
    
    // Build the query
    let query = supabase
      .from('CalBooking')
      .select('*')
      .eq('userUlid', queryUserUlid);
    
    // Apply filters
    if (!includeHistory) {
      // Only return future bookings or recent past bookings (within the last day)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      query = query.gte('endTime', oneDayAgo.toISOString());
    }
    
    if (startDate) {
      query = query.gte('startTime', startDate);
    }
    
    if (endDate) {
      query = query.lte('endTime', endDate);
    }
    
    if (status) {
      query = query.eq('status', status.toUpperCase());
    } else if (!includeHistory) {
      // By default, don't include cancelled bookings unless explicitly requested
      query = query.not('status', 'eq', 'CANCELLED');
    }
    
    // Execute the query
    const { data: bookings, error: bookingsError } = await query
      .order('startTime', { ascending: true });
    
    if (bookingsError) {
      console.error('[GET_BOOKINGS_ERROR] Database error:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }
    
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('[GET_BOOKINGS_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 