import { NextResponse } from 'next/server';
import { ApiResponse } from '@/utils/types/api';
import { CoachConfigSchema, type CoachConfig } from '@/utils/types/coach';
import { ROLES } from '@/utils/roles/roles';
import { withApiAuth } from '@/utils/middleware/withApiAuth';
import { createAuthClient } from '@/utils/auth';

export const GET = withApiAuth<CoachConfig>(async (req, { userUlid }) => {
  try {
    const supabase = await createAuthClient();

    const { data, error } = await supabase
      .from("CoachConfig")
      .select("*")
      .eq("userUlid", userUlid)
      .single();

    if (error) {
      console.error("[COACH_CONFIG_ERROR] Failed to fetch config:", { userUlid, error });
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch coach configuration'
        }
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Coach configuration not found'
        }
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<CoachConfig>>({ 
      data,
      error: null
    });
  } catch (error) {
    console.error("[COACH_CONFIG_ERROR] Unexpected error:", { userUlid, error });
    return NextResponse.json<ApiResponse<never>>({ 
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 });
  }
}, { requiredRoles: [ROLES.COACH] });

export const POST = withApiAuth<CoachConfig>(async (req, { userUlid }) => {
  const supabase = await createAuthClient();
  
  try {
    const body = await req.json();
    const validatedData = CoachConfigSchema.parse(body);

    // Check if config already exists
    const { data: existingConfig, error: checkError } = await supabase
      .from("CoachConfig")
      .select("ulid")
      .eq("userUlid", userUlid)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("[COACH_CONFIG_ERROR] Failed to check existing config:", { userUlid, error: checkError });
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'DB_ERROR',
          message: 'Failed to check existing configuration'
        }
      }, { status: 500 });
    }

    if (existingConfig) {
      // Update existing config
      const { data: updatedConfig, error: updateError } = await supabase
        .from("CoachConfig")
        .update({
          ...validatedData,
          updatedAt: new Date().toISOString()
        })
        .eq("userUlid", userUlid)
        .select()
        .single();

      if (updateError) {
        console.error("[COACH_CONFIG_ERROR] Failed to update config:", { userUlid, error: updateError });
        return NextResponse.json<ApiResponse<never>>({ 
          data: null,
          error: {
            code: 'UPDATE_ERROR',
            message: 'Failed to update coach configuration'
          }
        }, { status: 500 });
      }

      return NextResponse.json<ApiResponse<CoachConfig>>({ 
        data: updatedConfig,
        error: null
      });
    } else {
      // Create new config
      const { data: newConfig, error: createError } = await supabase
        .from("CoachConfig")
        .insert({
          ...validatedData,
          userUlid,
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error("[COACH_CONFIG_ERROR] Failed to create config:", { userUlid, error: createError });
        return NextResponse.json<ApiResponse<never>>({ 
          data: null,
          error: {
            code: 'CREATE_ERROR',
            message: 'Failed to create coach configuration'
          }
        }, { status: 500 });
      }

      return NextResponse.json<ApiResponse<CoachConfig>>({ 
        data: newConfig,
        error: null
      });
    }
  } catch (error) {
    console.error("[COACH_CONFIG_ERROR] Unexpected error:", { userUlid, error });
    if (error instanceof Error) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      }, { status: 400 });
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 });
  }
}, { requiredRoles: [ROLES.COACH] }); 
