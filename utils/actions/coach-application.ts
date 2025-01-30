'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { auth, currentUser } from '@clerk/nextjs/server';
import { COACH_APPLICATION_STATUS } from '../types';
import { revalidatePath } from 'next/cache';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

export async function submitCoachApplication(formData: {
  experience: string;
  specialties: string[];
}) {
  const { userId: clerkUserId } = await auth();
  const clerkUser = await currentUser();
  
  if (!clerkUserId || !clerkUser) {
    throw new Error('Unauthorized');
  }

  try {
    const supabase = await getSupabaseClient();

    // First check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('User')
      .select('id, role')
      .eq('userId', clerkUserId)
      .single();

    let userData;

    if (existingUser) {
      // Update user while preserving their role
      const { data: updatedUser, error: updateError } = await supabase
        .from('User')
        .update({
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          status: 'active',
          updatedAt: new Date().toISOString()
        })
        .eq('userId', clerkUserId)
        .select('id')
        .single();

      if (updateError) {
        console.error('[SUBMIT_COACH_APPLICATION_ERROR] User update:', updateError);
        throw new Error('Failed to update user');
      }
      userData = updatedUser;
    } else {
      // Create new user with default realtor role
      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert({
          userId: clerkUserId,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          role: 'realtor', // Only set realtor role for new users
          status: 'active',
          updatedAt: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createError) {
        console.error('[SUBMIT_COACH_APPLICATION_ERROR] User creation:', createError);
        throw new Error('Failed to create user');
      }
      userData = newUser;
    }

    if (!userData) {
      throw new Error('Failed to create/update user record');
    }

    // Create coach application
    const { data: application, error: applicationError } = await supabase
      .from('CoachApplication')
      .insert({
        applicantDbId: userData.id,
        status: COACH_APPLICATION_STATUS.PENDING,
        experience: formData.experience,
        specialties: formData.specialties,
        applicationDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (applicationError) {
      console.error('[SUBMIT_COACH_APPLICATION_ERROR] Application creation:', applicationError);
      throw new Error('Failed to create application');
    }

    revalidatePath('/dashboard/profile');
    return application;
  } catch (error) {
    console.error('[SUBMIT_COACH_APPLICATION_ERROR]', error);
    throw error instanceof Error ? error : new Error('Failed to submit application');
  }
}

export async function getCoachApplication() {
  const { userId: clerkUserId } = await auth();
  const clerkUser = await currentUser();
  
  if (!clerkUserId || !clerkUser) {
    throw new Error('Unauthorized');
  }

  try {
    const supabase = await getSupabaseClient();

    // First get the existing user
    let { data: userData, error: existingUserError } = await supabase
      .from('User')
      .select('id, role')
      .eq('userId', clerkUserId)
      .single();

    if (existingUserError) {
      console.error('[GET_COACH_APPLICATION_ERROR] User fetch:', existingUserError);
      return [];
    }

    // If user doesn't exist, create them
    if (!userData) {
      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert({
          userId: clerkUserId,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          role: 'realtor', // Default role for new users
          status: 'active',
          updatedAt: new Date().toISOString()
        })
        .select('id, role')
        .single();

      if (createError || !newUser) {
        console.error('[GET_COACH_APPLICATION_ERROR] User creation:', createError);
        return [];
      }

      userData = newUser;
    }

    console.log('[DEBUG] User role check in getCoachApplication:', {
      userId: userData.id,
      role: userData.role,
      isAdmin: userData.role === 'admin'
    });

    // If admin, return all applications, otherwise return only user's applications
    const query = supabase
      .from('CoachApplication')
      .select(`
        *,
        applicant:User!CoachApplication_applicantDbId_fkey (
          email,
          firstName,
          lastName
        ),
        reviewer:User!CoachApplication_reviewerDbId_fkey (
          email,
          firstName,
          lastName
        )
      `);

    if (userData.role !== 'admin') {
      query.eq('applicantDbId', userData.id);
    }

    const { data: applications, error: applicationsError } = await query;

    if (applicationsError) {
      console.error('[GET_COACH_APPLICATION_ERROR] Query error:', applicationsError);
      return [];
    }

    console.log('[DEBUG] Applications query result:', {
      userRole: userData.role,
      isAdmin: userData.role === 'admin',
      applicationCount: applications?.length,
      applications
    });

    return applications || [];
  } catch (error) {
    console.error('[GET_COACH_APPLICATION_ERROR]', error);
    return [];
  }
}

export async function reviewCoachApplication(data: {
  applicationId: number;
  status: typeof COACH_APPLICATION_STATUS[keyof typeof COACH_APPLICATION_STATUS];
  notes?: string;
}) {
  const { userId: clerkUserId } = await auth();
  const clerkUser = await currentUser();
  
  if (!clerkUserId || !clerkUser) {
    throw new Error('Unauthorized');
  }

  try {
    const supabase = await getSupabaseClient();

    // First ensure admin user exists
    const { data: userData, error: userError } = await supabase
      .from('User')
      .upsert(
        {
          userId: clerkUserId,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          role: 'admin', // Note: This won't override existing role
          status: 'active',
          updatedAt: new Date().toISOString()
        },
        {
          onConflict: 'userId',
          ignoreDuplicates: false
        }
      )
      .select('id, role')
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    // Update application status
    const { data: application, error: applicationError } = await supabase
      .from('CoachApplication')
      .update({
        status: data.status,
        notes: data.notes,
        reviewerDbId: userData.id,
        reviewDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', data.applicationId)
      .select(`
        *,
        applicant:User!CoachApplication_applicantDbId_fkey (*)
      `)
      .single();

    if (applicationError) {
      throw new Error('Failed to update application');
    }

    // If approved, update user role to coach
    if (data.status === COACH_APPLICATION_STATUS.APPROVED) {
      const { error: updateError } = await supabase
        .from('User')
        .update({
          role: 'realtor_coach',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', application.applicantDbId);

      if (updateError) {
        throw new Error('Failed to update user role');
      }
    }

    revalidatePath('/dashboard/profile');
    return application;
  } catch (error) {
    console.error('[REVIEW_COACH_APPLICATION_ERROR]', error);
    throw new Error('Failed to review application');
  }
} 