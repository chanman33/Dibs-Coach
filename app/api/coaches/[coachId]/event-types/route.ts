import { NextResponse } from 'next/server';
import { createAuthClient } from '@/utils/auth';
import { CalEventType } from '@/utils/types/coach-availability';

export async function GET(
  request: Request,
  { params }: { params: { coachId: string } }
) {
  try {
    const { coachId } = params;
    
    if (!coachId) {
      return NextResponse.json(
        { error: 'Coach ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAuthClient();
    
    // First, get the calendar integration for this coach
    const { data: calendarIntegration, error: integrationError } = await supabase
      .from('CalendarIntegration')
      .select('ulid')
      .eq('userUlid', coachId)
      .single();
    
    if (integrationError) {
      console.error('[API_EVENT_TYPES_ERROR] Could not find calendar integration', {
        coachId,
        error: integrationError,
        timestamp: new Date().toISOString()
      });
      
      // If the coach doesn't have a calendar integration, return an empty array
      // This is not an error condition - they might not have set up Cal.com yet
      return NextResponse.json({ eventTypes: [] });
    }
    
    // Now fetch the event types associated with this calendar integration
    const { data: eventTypes, error: eventTypesError } = await supabase
      .from('CalEventType')
      .select('*')
      .eq('calendarIntegrationUlid', calendarIntegration.ulid)
      .eq('isActive', true)
      .order('position', { ascending: true });
    
    if (eventTypesError) {
      console.error('[API_EVENT_TYPES_ERROR] Failed to fetch event types', {
        coachId,
        calendarIntegrationUlid: calendarIntegration.ulid,
        error: eventTypesError,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { error: 'Failed to fetch event types' },
        { status: 500 }
      );
    }
    
    // Map database record to CalEventType
    const mappedEventTypes: CalEventType[] = (eventTypes || []).map(et => ({
      id: et.ulid,
      title: et.name,
      description: et.description || null,
      length: et.lengthInMinutes,
      schedulingType: et.scheduling
    }));
    
    return NextResponse.json({ eventTypes: mappedEventTypes });
    
  } catch (error) {
    console.error('[API_EVENT_TYPES_ERROR] Unexpected error', {
      error,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 