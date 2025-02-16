import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAuthClient } from '@/utils/auth';
import { withApiAuth } from '@/utils/middleware/withApiAuth';
import { generateZoomSignature } from '@/utils/zoom-token';
import { z } from 'zod';
import { ApiResponse } from '@/utils/types/api';

// Response type definition
const ZoomConfigSchema = z.object({
  sessionName: z.string(),
  sessionPasscode: z.string(),
  userName: z.string(),
  token: z.string()
});

type ZoomConfig = z.infer<typeof ZoomConfigSchema>;

export const GET = withApiAuth<ZoomConfig>(async (req: Request, { userUlid }) => {
  try {
    if (!process.env.ZOOM_SDK_KEY || !process.env.ZOOM_SDK_SECRET) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Zoom SDK credentials are not configured'
        }
      }, { status: 500 });
    }

    const supabase = await createAuthClient();

    // Get user details for the userName
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('firstName, lastName')
      .eq('ulid', userUlid)
      .single();

    if (userError || !user) {
      console.error('[ZOOM_CONFIG_ERROR] User fetch error:', { userUlid, error: userError });
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'USER_ERROR',
          message: 'Failed to fetch user details'
        }
      }, { status: 500 });
    }

    // Generate a unique session name using ULID and timestamp
    const sessionName = `session_${userUlid}_${Date.now()}`;
    const sessionPasscode = Math.random().toString(36).slice(-8);

    // Generate the token
    const token = await generateZoomSignature(sessionName, 1); // 1 for host role

    // Construct user's display name
    const userName = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(' ') || 'User';

    const config = {
      sessionName,
      sessionPasscode,
      userName,
      token
    };

    // Validate the config
    const validatedConfig = ZoomConfigSchema.parse(config);

    return NextResponse.json<ApiResponse<ZoomConfig>>({
      data: validatedConfig,
      error: null
    });
  } catch (error) {
    console.error('[ZOOM_CONFIG_ERROR]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid config data',
          details: error.flatten()
        }
      }, { status: 400 });
    }
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate Zoom configuration',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 });
  }
}); 