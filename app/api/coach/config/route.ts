import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get user's database ID
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single();

    if (userError || !user) {
      return new NextResponse(userError ? 'Error fetching user' : 'User not found', {
        status: userError ? 500 : 404
      });
    }

    // Get coach's session config
    const { data: config, error: configError } = await supabase
      .from('CoachSessionConfig')
      .select('*')
      .eq('userDbId', user.id)
      .single();

    if (configError && configError.code !== 'PGRST116') { // PGRST116 is "not found"
      return new NextResponse('Error fetching config', { status: 500 });
    }

    // Get coach profile settings
    const { data: profile, error: profileError } = await supabase
      .from('RealtorCoachProfile')
      .select('defaultDuration, allowCustomDuration, minimumDuration, maximumDuration')
      .eq('userDbId', user.id)
      .single();

    if (profileError) {
      return new NextResponse('Error fetching profile', { status: 500 });
    }

    return NextResponse.json({
      data: {
        ...config,
        ...profile
      }
    });

  } catch (error) {
    console.error('[CONFIG_GET_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const validatedData = SessionConfigSchema.parse(body);

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get user's database ID
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single();

    if (userError || !user) {
      return new NextResponse(userError ? 'Error fetching user' : 'User not found', {
        status: userError ? 500 : 404
      });
    }

    // Update coach profile settings
    const { error: profileError } = await supabase
      .from('RealtorCoachProfile')
      .update({
        defaultDuration: validatedData.defaultDuration,
        allowCustomDuration: validatedData.allowCustomDuration,
        minimumDuration: validatedData.minimumDuration,
        maximumDuration: validatedData.maximumDuration,
        updatedAt: new Date().toISOString()
      })
      .eq('userDbId', user.id);

    if (profileError) {
      return new NextResponse('Error updating profile', { status: 500 });
    }

    // Upsert session config
    const { data: config, error: configError } = await supabase
      .from('CoachSessionConfig')
      .upsert({
        userDbId: user.id,
        durations: validatedData.durations,
        rates: validatedData.rates,
        currency: validatedData.currency,
        isActive: validatedData.isActive,
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (configError) {
      return new NextResponse('Error updating config', { status: 500 });
    }

    return NextResponse.json({
      data: {
        ...config,
        defaultDuration: validatedData.defaultDuration,
        allowCustomDuration: validatedData.allowCustomDuration,
        minimumDuration: validatedData.minimumDuration,
        maximumDuration: validatedData.maximumDuration
      }
    });

  } catch (error) {
    console.error('[CONFIG_POST_ERROR]', error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
