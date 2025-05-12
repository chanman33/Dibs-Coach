import { NextResponse } from 'next/server';
import { ApiResponse } from '@/utils/types/api';
import { CoachConfigSchema, type CoachConfig } from '@/utils/types/coach';
import { CAPABILITIES } from '@/utils/permissions';
import { withApiAuth } from '@/utils/middleware/withApiAuth';
import { createAuthClient } from '@/utils/auth';
import { generateUlid } from '@/utils/ulid';

export const GET = withApiAuth<CoachConfig>(async (req, { userUlid }) => {
  try {
    const supabase = await createAuthClient();

    const { data, error } = await supabase
      .from("CoachConfig" as any)
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
      data: data as unknown as CoachConfig,
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
}, { requiredCapabilities: [CAPABILITIES.COACH] });

export const POST = withApiAuth<CoachConfig>(async (req, { userUlid }) => {
  const supabase = await createAuthClient();
  
  try {
    const body = await req.json();
    const validatedData = CoachConfigSchema.parse(body);

    // Check if config already exists
    const { data: existingConfig, error: checkError } = await supabase
      .from("CoachConfig" as any)
      .select("ulid")
      .eq("userUlid", userUlid)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("[COACH_CONFIG_ERROR] Failed to check existing config:", { userUlid, error: checkError });
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to check existing configuration'
        }
      }, { status: 500 });
    }

    if (existingConfig) {
      // Update existing config
      const { data: updatedConfig, error: updateError } = await supabase
        .from("CoachConfig" as any)
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
        data: updatedConfig as unknown as CoachConfig,
        error: null
      });
    } else {
      // Create new config
      const newUlid = generateUlid();
      const insertPayload = {
        ulid: newUlid,
        userUlid,
        ...validatedData,
        updatedAt: new Date().toISOString()
        // createdAt will be handled by DB default or should be added if not
      };
      
      const { data: newConfig, error: createError } = await supabase
        .from("CoachConfig" as any)
        .insert(insertPayload as any) // Cast payload to any if complex type issues persist
        .select()
        .single();

      if (createError) {
        console.error("[COACH_CONFIG_ERROR] Failed to create config:", { userUlid, error: createError, payload: insertPayload });
        return NextResponse.json<ApiResponse<never>>({ 
          data: null,
          error: {
            code: 'CREATE_ERROR',
            message: 'Failed to create coach configuration'
          }
        }, { status: 500 });
      }

      return NextResponse.json<ApiResponse<CoachConfig>>({ 
        data: newConfig as unknown as CoachConfig,
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
}, { requiredCapabilities: [CAPABILITIES.COACH] }); 
