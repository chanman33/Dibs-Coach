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

    // First ensure user exists
    const { data: userData, error: userError } = await supabase
      .from('User')
      .upsert({
        userId: authResult.userId,
        role: 'realtor',
        status: 'active',
        updatedAt: new Date().toISOString()
      })
      .select('id')
      .single();

    if (userError) {
      console.error('[COACH_APPLICATION_ERROR] User upsert:', userError);
      return new NextResponse('Failed to create/update user', { status: 500 });
    }

    if (!userData) {
      return new NextResponse('Failed to create user record', { status: 500 });
    }

    // Create coach application
    const { data: application, error: applicationError } = await supabase
      .from('CoachApplication')
      .insert({
        applicantDbId: userData.id,
        status: COACH_APPLICATION_STATUS.PENDING,
        experience,
        specialties,
        applicationDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (applicationError) {
      console.error('[COACH_APPLICATION_ERROR] Application creation:', applicationError);
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
      .from('user')
      .select('id, role')
      .eq('userId', authResult.userId)
      .single();

    console.log('[DEBUG] Auth check:', {
      clerkUserId: authResult.userId,
      userData,
      userError
    });

    if (userError || !userData) {
      console.error('[COACH_APPLICATION_ERROR] User fetch:', userError);
      return new NextResponse('User not found', { status: 404 });
    }

    console.log('[DEBUG] Detailed role check:', {
      userRole: userData.role,
      roleType: typeof userData.role,
      expectedAdminRole: ROLES.ADMIN,
      expectedRoleType: typeof ROLES.ADMIN,
      isExactMatch: userData.role === ROLES.ADMIN,
      allRoles: ROLES,
      userData
    });

    // Let's verify the data exists in the table first
    const { data: countCheck, error: countError } = await supabase
      .from('coach_application')
      .select('*', { count: 'exact' });

    console.log('[DEBUG] Table count check:', {
      count: countCheck?.length,
      error: countError
    });

    // For admin, we want to fetch ALL applications
    console.log('[DEBUG] Starting query construction');
    
    // Try the query without the join first
    const { data: rawApplications, error: rawError } = await supabase
      .from('coach_application')
      .select('*');

    console.log('[DEBUG] Raw applications (no join):', {
      data: rawApplications,
      error: rawError
    });

    // Now try with the join
    const { data: applications, error: applicationsError } = await supabase
      .from('coach_application')
      .select(`
        *,
        applicant:user (
          id,
          email,
          firstName,
          lastName,
          role
        )
      `);

    console.log('[DEBUG] Full query result:', { 
      data: applications, 
      error: applicationsError,
      firstApplication: applications?.[0]
    });

    if (applicationsError) {
      console.error('[COACH_APPLICATION_ERROR] Fetch applications:', applicationsError);
      return new NextResponse('Failed to fetch applications', { status: 500 });
    }

    // Log the final response
    console.log('[DEBUG] Returning applications:', {
      count: applications?.length,
      applications: applications
    });

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
      .from('User')
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
      .from('CoachApplication')
      .update({
        status,
        notes,
        reviewerDbId: userData.id,
        reviewDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select(`
        *,
        applicant:User!CoachApplication_applicantDbId_fkey (*)
      `)
      .single();

    if (applicationError) {
      console.error('[COACH_APPLICATION_ERROR] Update application:', applicationError);
      return new NextResponse('Failed to update application', { status: 500 });
    }

    // If approved, update user role and create/update coach profile
    if (status === COACH_APPLICATION_STATUS.APPROVED) {
      // Begin a transaction for all the updates
      const updates = [];

      // 1. Update user role
      updates.push(
        supabase
          .from('User')
          .update({ 
            role: ROLES.REALTOR_COACH,
            updatedAt: new Date().toISOString()
          })
          .eq('id', application.applicantDbId)
      );

      // 2. Create or update RealtorCoachProfile
      const { data: existingProfile } = await supabase
        .from('RealtorCoachProfile')
        .select()
        .eq('userDbId', application.applicantDbId)
        .single();

      if (!existingProfile) {
        // Create new profile
        updates.push(
          supabase
            .from('RealtorCoachProfile')
            .insert({
              userDbId: application.applicantDbId,
              experience: application.experience,
              specialties: application.specialties,
              hourlyRate: 0, // Default value, coach can update later
              bio: application.experience, // Use application experience as initial bio
              updatedAt: new Date().toISOString()
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