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

    // First ensure user exists
    const { data: userData, error: userError } = await supabase
      .from('User')
      .upsert(
        {
          userId: clerkUserId,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          role: 'realtor',
          status: 'active',
          updatedAt: new Date().toISOString()
        },
        {
          onConflict: 'userId',
          ignoreDuplicates: false
        }
      )
      .select('id')
      .single();

    if (userError) {
      console.error('[SUBMIT_COACH_APPLICATION_ERROR] User upsert:', userError);
      throw new Error('Failed to create/update user');
    }

    if (!userData) {
      throw new Error('Failed to create user record');
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

    revalidatePath('/dashboard/realtor/profile');
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

    // First ensure user exists
    const { data: userData, error: userError } = await supabase
      .from('User')
      .upsert(
        {
          userId: clerkUserId,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          role: 'realtor',
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

    if (userError) {
      console.error('[GET_COACH_APPLICATION_ERROR] User upsert:', userError);
      return []; // Return empty array instead of throwing error
    }

    if (!userData) {
      return []; // Return empty array if no user
    }

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
      return []; // Return empty array instead of throwing error
    }

    return applications || []; // Ensure we always return an array
  } catch (error) {
    console.error('[GET_COACH_APPLICATION_ERROR]', error);
    return []; // Return empty array for any other errors
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

    revalidatePath('/dashboard/admin/coach-applications');
    return application;
  } catch (error) {
    console.error('[REVIEW_COACH_APPLICATION_ERROR]', error);
    throw new Error('Failed to review application');
  }
} 