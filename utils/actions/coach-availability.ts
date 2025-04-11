'use server';

import { createAuthClient } from '@/utils/auth';
import { withServerAction, type ServerActionContext } from '@/utils/middleware/withServerAction';
import { ApiResponse, ApiError } from '@/utils/types/api';
import { 
  type AvailabilitySlot,
  type CoachSchedule,
  type CoachInfo,
  type CoachAvailabilityResponse,
  type GetCoachAvailabilityParams,
  AvailabilitySlotSchema,
  CoachScheduleSchema
} from '@/utils/types/coach-availability';

/**
 * Get coach availability by coach ID or slug
 * 
 * This server action retrieves the coach's info and availability schedule.
 * It can look up the coach by either their ULID or profile slug.
 */
export const getCoachAvailability = withServerAction<CoachAvailabilityResponse, GetCoachAvailabilityParams>(
  async (params: GetCoachAvailabilityParams, context: ServerActionContext) => {
    try {
      const { coachId, slug } = params;
      
      if (!coachId && !slug) {
        console.error('[GET_COACH_AVAILABILITY_ERROR] No coach identifier provided');
        return {
          data: { coach: null, schedule: null },
          error: { 
            code: 'MISSING_PARAMETERS', 
            message: 'Either coachId or slug is required' 
          }
        };
      }
      
      const supabase = createAuthClient();
      let coachUlid: string;
      
      // Resolve coach ULID from slug if needed
      if (slug && !coachId) {
        console.log('[GET_COACH_AVAILABILITY] Looking up coach by slug', { slug });
        const { data: profileData, error: profileError } = await supabase
          .from("CoachProfile")
          .select("userUlid")
          .eq("profileSlug", slug)
          .single();
          
        if (profileError || !profileData) {
          console.error('[GET_COACH_AVAILABILITY_ERROR] Coach not found by slug', {
            slug,
            error: profileError,
            timestamp: new Date().toISOString()
          });
          
          return {
            data: { coach: null, schedule: null },
            error: { 
              code: 'NOT_FOUND', 
              message: 'Coach not found with the provided slug' 
            }
          };
        }
        
        coachUlid = profileData.userUlid;
      } else {
        // Use provided coachId directly
        coachUlid = coachId!;
      }
      
      // Get coach basic info
      console.log('[GET_COACH_AVAILABILITY] Fetching coach data', { coachUlid });
      const { data: coachData, error: coachError } = await supabase
        .from("User")
        .select("ulid, firstName, lastName")
        .eq("ulid", coachUlid)
        .single();
      
      if (coachError || !coachData) {
        console.error('[GET_COACH_AVAILABILITY_ERROR] Coach not found', {
          coachUlid,
          error: coachError,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: { coach: null, schedule: null },
          error: { 
            code: 'NOT_FOUND', 
            message: 'Coach not found' 
          }
        };
      }
      
      // Get coach availability schedule
      console.log('[GET_COACH_AVAILABILITY] Fetching coach schedule', { coachUlid });
      const { data: scheduleData, error: scheduleError } = await supabase
        .from("CoachingAvailabilitySchedule")
        .select("*")
        .eq("userUlid", coachUlid)
        .eq("isDefault", true)
        .eq("active", true)
        .single();
        
      if (scheduleError) {
        console.error('[GET_COACH_AVAILABILITY_ERROR] Failed to fetch coach schedule', {
          coachUlid,
          error: scheduleError,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: { 
            coach: {
              ulid: coachData.ulid,
              firstName: coachData.firstName || '',
              lastName: coachData.lastName || ''
            }, 
            schedule: null 
          },
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to fetch coach availability schedule' 
          }
        };
      }
      
      if (!scheduleData) {
        console.warn('[GET_COACH_AVAILABILITY_WARNING] No schedule found for coach', {
          coachUlid,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: { 
            coach: {
              ulid: coachData.ulid,
              firstName: coachData.firstName || '',
              lastName: coachData.lastName || ''
            }, 
            schedule: null 
          },
          error: { 
            code: 'NOT_FOUND', 
            message: 'Coach has no availability schedule' 
          }
        };
      }
      
      // Parse availability data if needed
      const availabilityData = typeof scheduleData.availability === 'string' 
        ? JSON.parse(scheduleData.availability) 
        : scheduleData.availability;
      
      // Enhanced logging for debugging timezone and availability issues
      console.log('[DEBUG][COACH_AVAILABILITY] Coach schedule details', {
        coachUlid,
        coachName: `${coachData.firstName || ''} ${coachData.lastName || ''}`,
        timeZone: scheduleData.timeZone,
        availabilityCount: availabilityData.length,
        availabilityDetails: availabilityData.map((slot: { days: string[], startTime: string, endTime: string }) => ({
          days: slot.days,
          startTime: slot.startTime,
          endTime: slot.endTime
        })),
        rawAvailability: availabilityData,
        defaultDuration: scheduleData.defaultDuration || 60,
        timestamp: new Date().toISOString()
      });
      
      // Return coach data and schedule
      return {
        data: {
          coach: {
            ulid: coachData.ulid,
            firstName: coachData.firstName || '',
            lastName: coachData.lastName || ''
          },
          schedule: {
            ulid: scheduleData.ulid,
            userUlid: scheduleData.userUlid,
            name: scheduleData.name,
            timeZone: scheduleData.timeZone,
            availability: availabilityData,
            isDefault: scheduleData.isDefault,
            active: scheduleData.active,
            defaultDuration: scheduleData.defaultDuration || 60
          }
        },
        error: null
      };
    } catch (error) {
      console.error('[GET_COACH_AVAILABILITY_ERROR] Unexpected error', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: { coach: null, schedule: null },
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An unexpected error occurred' 
        }
      };
    }
  }
);

/**
 * Get coach calendar busy times
 * 
 * This is a placeholder for the Cal.com integration.
 * In a real implementation, this would fetch busy times from Cal.com.
 */
export const getCoachBusyTimes = withServerAction<any, { coachId: string, date: string }>(
  async (params: { coachId: string, date: string }, context: ServerActionContext) => {
    try {
      console.log('[GET_COACH_BUSY_TIMES] This is a placeholder', params);
      
      // This is a placeholder function for Cal.com integration
      // In a real implementation, this would fetch busy times from Cal.com
      
      return {
        data: [],
        error: null
      };
    } catch (error) {
      console.error('[GET_COACH_BUSY_TIMES_ERROR] Unexpected error', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: [],
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An unexpected error occurred' 
        }
      };
    }
  }
); 