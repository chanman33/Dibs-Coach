import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { COACH_APPLICATION_STATUS } from '../../../../utils/types';
import { ROLES } from '../../../../utils/roles/roles';

export async function POST(req: NextRequest) {
  const authResult = await auth();
  if (!authResult?.userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
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

    const body = await req.json();
    const { experience, specialties } = body;

    // Get user's database ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('userId', authResult.userId)
      .single();

    if (userError || !userData) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Create coach application
    const { data: application, error: applicationError } = await supabase
      .from('coach_applications')
      .insert({
        userId: userData.id,
        status: COACH_APPLICATION_STATUS.PENDING,
        experience,
        specialties,
        applicationDate: new Date().toISOString(),
      })
      .select()
      .single();

    if (applicationError) {
      return new NextResponse('Failed to create application', { status: 500 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('[COACH_APPLICATION_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const authResult = await auth();
  if (!authResult?.userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
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

    // Check if admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('userId', authResult.userId)
      .single();

    if (userError || !userData) {
      return new NextResponse('User not found', { status: 404 });
    }

    // If admin, return all applications, otherwise return only user's applications
    const query = supabase
      .from('coach_applications')
      .select('*, users(email, firstName, lastName)');

    if (userData.role !== ROLES.ADMIN) {
      query.eq('userId', userData.id);
    }

    const { data: applications, error: applicationsError } = await query;

    if (applicationsError) {
      return new NextResponse('Failed to fetch applications', { status: 500 });
    }

    return NextResponse.json(applications);
  } catch (error) {
    console.error('[COACH_APPLICATION_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authResult = await auth();
  if (!authResult?.userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
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

    // Verify admin status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('userId', authResult.userId)
      .single();

    if (userError || !userData || userData.role !== ROLES.ADMIN) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { applicationId, status, notes } = body;

    // Update application status
    const { data: application, error: applicationError } = await supabase
      .from('coach_applications')
      .update({
        status,
        notes,
        reviewedBy: userData.id,
        reviewDate: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select('*, users!inner(*)')
      .single();

    if (applicationError) {
      return new NextResponse('Failed to update application', { status: 500 });
    }

    // If approved, update user role and create/update coach profile
    if (status === COACH_APPLICATION_STATUS.APPROVED) {
      // Begin a transaction for all the updates
      const updates = [];

      // 1. Update user role
      updates.push(
        supabase
          .from('users')
          .update({ role: ROLES.REALTOR_COACH })
          .eq('id', application.userId)
      );

      // 2. Create or update RealtorCoachProfile
      const { data: existingProfile } = await supabase
        .from('realtor_coach_profiles')
        .select()
        .eq('userId', application.userId)
        .single();

      if (!existingProfile) {
        // Create new profile
        updates.push(
          supabase
            .from('realtor_coach_profiles')
            .insert({
              userId: application.userId,
              experience: application.experience,
              specialties: application.specialties,
              hourlyRate: 0, // Default value, coach can update later
              bio: application.experience, // Use application experience as initial bio
            })
        );
      }

      // Execute all updates
      const results = await Promise.all(updates);
      const errors = results.filter(result => result.error);

      if (errors.length > 0) {
        console.error('[COACH_APPROVAL_ERRORS]', errors);
        return new NextResponse('Failed to update user role or create coach profile', { status: 500 });
      }
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('[COACH_APPLICATION_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 