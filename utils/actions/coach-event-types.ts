'use server';

import { createAuthClient } from '@/utils/auth';
import { withServerAction } from '@/utils/middleware/withServerAction';
import { generateUlid } from '@/utils/ulid';
import { ApiResponse } from '@/utils/types/api';
import { CalEventType } from '@/utils/types/coach-availability';

/**
 * Fetch event types for a specific coach
 * This action retrieves all CalEventType records associated with a coach's
 * calendar integration.
 */
export const getCoachEventTypes = withServerAction<CalEventType[], { coachUlid: string }>(
  async ({ coachUlid }) => {
    try {
      if (!coachUlid) {
        console.error('[GET_COACH_EVENT_TYPES_ERROR] Missing coachUlid', {
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Coach ID is required'
          }
        };
      }

      const supabase = createAuthClient();
      
      // First, get the calendar integration for this coach
      const { data: calendarIntegration, error: integrationError } = await supabase
        .from('CalendarIntegration')
        .select('ulid')
        .eq('userUlid', coachUlid)
        .single();
      
      if (integrationError || !calendarIntegration) {
        console.error('[GET_COACH_EVENT_TYPES_ERROR] Could not find calendar integration', {
          coachUlid,
          error: integrationError,
          timestamp: new Date().toISOString()
        });
        
        // If the coach doesn't have a calendar integration, return an empty array
        // This is not an error condition - they might not have set up Cal.com yet
        return {
          data: [],
          error: null
        };
      }
      
      // Now fetch the event types associated with this calendar integration
      const { data: eventTypes, error: eventTypesError } = await supabase
        .from('CalEventType')
        .select('*')
        .eq('calendarIntegrationUlid', calendarIntegration.ulid)
        .eq('isActive', true)
        .order('position', { ascending: true });
      
      if (eventTypesError) {
        console.error('[GET_COACH_EVENT_TYPES_ERROR] Failed to fetch event types', {
          coachUlid,
          calendarIntegrationUlid: calendarIntegration.ulid,
          error: eventTypesError,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch event types'
          }
        };
      }
      
      // Map database record to CalEventType
      const mappedEventTypes: CalEventType[] = (eventTypes || []).map(et => ({
        id: et.ulid,
        title: et.name,
        description: et.description || null,
        length: et.lengthInMinutes,
        schedulingType: et.scheduling
      }));
      
      return {
        data: mappedEventTypes,
        error: null
      };
      
    } catch (error) {
      console.error('[GET_COACH_EVENT_TYPES_ERROR] Unexpected error', {
        coachUlid,
        error,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      };
    }
  }
); 