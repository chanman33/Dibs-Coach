import { NextResponse } from 'next/server';
import { ApiResponse } from '@/utils/types/api';
import { withApiAuth } from '@/utils/middleware/withApiAuth';
import { createAuthClient } from '@/utils/auth';
import { z } from 'zod';

// Validation schema for session config
const SessionConfigSchema = z.object({
  durations: z.array(z.number().min(15).max(240)),  // durations in minutes
  rates: z.record(z.string(), z.number().min(0)),   // mapping of duration to rate
  currency: z.enum(['USD', 'EUR', 'GBP']),
  isActive: z.boolean().optional().default(true),
  defaultDuration: z.number().min(15).max(240),
  allowCustomDuration: z.boolean(),
  minimumDuration: z.number().min(15),
  maximumDuration: z.number().max(240)
});

type SessionConfig = z.infer<typeof SessionConfigSchema>;

export const GET = withApiAuth<SessionConfig>(async (req, { userUlid }) => {
  try {
    const supabase = await createAuthClient();

    // Get coach's session config
    const { data: config, error: configError } = await supabase
      .from('CoachSessionConfig')
      .select('*')
      .eq('userUlid', userUlid)
      .single();

    if (configError && configError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('[CONFIG_GET_ERROR] Error fetching config:', configError);
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error fetching config'
        }
      }, { status: 500 });
    }

    // Get coach profile settings
    const { data: profile, error: profileError } = await supabase
      .from('CoachProfile')
      .select('defaultDuration, allowCustomDuration, minimumDuration, maximumDuration')
      .eq('userUlid', userUlid)
      .single();

    if (profileError) {
      console.error('[CONFIG_GET_ERROR] Error fetching profile:', profileError);
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error fetching profile'
        }
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<SessionConfig>>({
      data: {
        ...config,
        ...profile
      },
      error: null
    });

  } catch (error) {
    console.error('[CONFIG_GET_ERROR]', error);
    return NextResponse.json<ApiResponse<never>>({ 
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal Server Error'
      }
    }, { status: 500 });
  }
});

export const POST = withApiAuth<SessionConfig>(async (req, { userUlid }) => {
  try {
    const body = await req.json();
    const validatedData = SessionConfigSchema.parse(body);
    const supabase = await createAuthClient();

    // Update coach profile settings
    const { error: profileError } = await supabase
      .from('CoachProfile')
      .update({
        defaultDuration: validatedData.defaultDuration,
        allowCustomDuration: validatedData.allowCustomDuration,
        minimumDuration: validatedData.minimumDuration,
        maximumDuration: validatedData.maximumDuration,
        updatedAt: new Date().toISOString()
      })
      .eq('userUlid', userUlid);

    if (profileError) {
      console.error('[CONFIG_POST_ERROR] Error updating profile:', profileError);
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Error updating profile'
        }
      }, { status: 500 });
    }

    // Upsert session config
    const { data: config, error: configError } = await supabase
      .from('CoachSessionConfig')
      .upsert({
        userUlid,
        durations: validatedData.durations,
        rates: validatedData.rates,
        currency: validatedData.currency,
        isActive: validatedData.isActive,
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (configError) {
      console.error('[CONFIG_POST_ERROR] Error updating config:', configError);
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Error updating config'
        }
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<SessionConfig>>({
      data: {
        ...config,
        defaultDuration: validatedData.defaultDuration,
        allowCustomDuration: validatedData.allowCustomDuration,
        minimumDuration: validatedData.minimumDuration,
        maximumDuration: validatedData.maximumDuration
      },
      error: null
    });

  } catch (error) {
    console.error('[CONFIG_POST_ERROR]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        }
      }, { status: 400 });
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal Server Error'
      }
    }, { status: 500 });
  }
}); 
