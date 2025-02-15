import { NextResponse } from "next/server";
import { createAuthClient } from "@/utils/auth";
import { ApiResponse } from "@/utils/types/api";
import { ROLES } from "@/utils/roles/roles";
import { withApiAuth } from "@/utils/middleware/withApiAuth";
import { CoachingScheduleSchema } from "@/utils/types/coaching";
import { z } from "zod";

// Response type for availability schedules
interface AvailabilitySchedule {
  ulid: string;
  userUlid: string;
  name: string;
  timezone: string;
  rules: {
    type: 'wday' | 'date';
    wday?: number;
    date?: string;
    intervals: Array<{ from: string; to: string }>;
  }[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const GET = withApiAuth<AvailabilitySchedule[]>(async (req, { userUlid }) => {
  try {
    const supabase = await createAuthClient();

    const { data, error } = await supabase
      .from("CoachingAvailabilitySchedule")
      .select("*")
      .eq("userUlid", userUlid)
      .order("isDefault", { ascending: false });

    if (error) {
      console.error("[AVAILABILITY_ERROR] Failed to fetch schedules:", { 
        userUlid, 
        error 
      });
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch availability schedules'
        }
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<AvailabilitySchedule[]>>({ 
      data,
      error: null
    });
  } catch (error) {
    console.error("[AVAILABILITY_ERROR] Unexpected error:", { userUlid, error });
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 });
  }
}, { requiredRoles: [ROLES.COACH] });

export const POST = withApiAuth<AvailabilitySchedule>(async (req, { userUlid }) => {
  try {
    const body = await req.json();
    const validatedData = CoachingScheduleSchema.parse(body);
    const supabase = await createAuthClient();

    // If this is set as default, unset any existing default
    if (validatedData.isDefault) {
      const { error: updateError } = await supabase
        .from("CoachingAvailabilitySchedule")
        .update({ 
          isDefault: false,
          updatedAt: new Date().toISOString()
        })
        .eq("userUlid", userUlid)
        .eq("isDefault", true);

      if (updateError) {
        console.error("[AVAILABILITY_ERROR] Failed to update existing default:", { 
          userUlid, 
          error: updateError 
        });
        return NextResponse.json<ApiResponse<never>>({ 
          data: null, 
          error: {
            code: 'UPDATE_ERROR',
            message: 'Failed to update existing default schedule'
          }
        }, { status: 500 });
      }
    }

    // Create new schedule
    const { data, error } = await supabase
      .from("CoachingAvailabilitySchedule")
      .insert({
        ...validatedData,
        userUlid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("[AVAILABILITY_ERROR] Failed to create schedule:", { 
        userUlid, 
        error 
      });
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create availability schedule'
        }
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<AvailabilitySchedule>>({
      data,
      error: null
    });
  } catch (error) {
    console.error("[AVAILABILITY_ERROR] Unexpected error:", { userUlid, error });
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid schedule data',
          details: error.flatten()
        }
      }, { status: 400 });
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 });
  }
}, { requiredRoles: [ROLES.COACH] });

export const PUT = withApiAuth<AvailabilitySchedule>(async (req, { userUlid }) => {
  try {
    const body = await req.json();
    const { ulid, ...updateData } = body;
    
    if (!ulid) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: {
          code: 'MISSING_ID',
          message: 'Schedule ID is required'
        }
      }, { status: 400 });
    }

    const validatedData = CoachingScheduleSchema.parse(updateData);
    const supabase = await createAuthClient();

    // Verify ownership
    const { data: existing, error: checkError } = await supabase
      .from("CoachingAvailabilitySchedule")
      .select("ulid")
      .eq("ulid", ulid)
      .eq("userUlid", userUlid)
      .single();

    if (checkError || !existing) {
      console.error("[AVAILABILITY_ERROR] Schedule not found or unauthorized:", { 
        userUlid, 
        scheduleUlid: ulid,
        error: checkError 
      });
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: {
          code: 'NOT_FOUND',
          message: 'Schedule not found or unauthorized'
        }
      }, { status: 404 });
    }

    // If this is set as default, unset any existing default
    if (validatedData.isDefault) {
      const { error: updateError } = await supabase
        .from("CoachingAvailabilitySchedule")
        .update({ 
          isDefault: false,
          updatedAt: new Date().toISOString()
        })
        .eq("userUlid", userUlid)
        .eq("isDefault", true)
        .neq("ulid", ulid);

      if (updateError) {
        console.error("[AVAILABILITY_ERROR] Failed to update existing default:", { 
          userUlid, 
          scheduleUlid: ulid,
          error: updateError 
        });
        return NextResponse.json<ApiResponse<never>>({ 
          data: null, 
          error: {
            code: 'UPDATE_ERROR',
            message: 'Failed to update existing default schedule'
          }
        }, { status: 500 });
      }
    }

    // Update schedule
    const { data, error } = await supabase
      .from("CoachingAvailabilitySchedule")
      .update({
        ...validatedData,
        updatedAt: new Date().toISOString()
      })
      .eq("ulid", ulid)
      .eq("userUlid", userUlid)
      .select()
      .single();

    if (error) {
      console.error("[AVAILABILITY_ERROR] Failed to update schedule:", { 
        userUlid, 
        scheduleUlid: ulid,
        error 
      });
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update availability schedule'
        }
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<AvailabilitySchedule>>({
      data,
      error: null
    });
  } catch (error) {
    console.error("[AVAILABILITY_ERROR] Unexpected error:", { userUlid, error });
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid schedule data',
          details: error.flatten()
        }
      }, { status: 400 });
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 });
  }
}, { requiredRoles: [ROLES.COACH] }); 