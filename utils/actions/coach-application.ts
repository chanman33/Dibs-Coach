'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { auth } from '@clerk/nextjs/server';
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
  const authResult = await auth();
  if (!authResult?.userId) {
    throw new Error('Unauthorized');
  }

  try {
    const supabase = await getSupabaseClient();

    // Get user's database ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', authResult.userId)
      .single();

    if (userError) {
      console.error('[SUBMIT_COACH_APPLICATION_ERROR] User lookup:', userError);
      throw new Error('Failed to find user');
    }

    if (!userData) {
      throw new Error('User not found');
    }

    // Create coach application
    const { data: application, error: applicationError } = await supabase
      .from('CoachApplication')
      .insert({
        userId: userData.id,
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
  const authResult = await auth();
  if (!authResult?.userId) {
    throw new Error('Unauthorized');
  }

  try {
    const supabase = await getSupabaseClient();

    // Get user's database ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('id, role')
      .eq('userId', authResult.userId)
      .single();

    if (userError || !userData) {
      throw new Error('User not found');
    }

    // If admin, return all applications, otherwise return only user's applications
    const query = supabase
      .from('CoachApplication')
      .select(`
        *,
        user:User!CoachApplication_userId_fkey (
          email,
          firstName,
          lastName
        ),
        reviewer:User!CoachApplication_reviewedBy_fkey (
          email,
          firstName,
          lastName
        )
      `);

    if (userData.role !== 'admin') {
      query.eq('userId', userData.id);
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
  const authResult = await auth();
  if (!authResult?.userId) {
    throw new Error('Unauthorized');
  }

  try {
    const supabase = await getSupabaseClient();

    // Verify admin status
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('id, role')
      .eq('userId', authResult.userId)
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
        reviewedBy: userData.id,
        reviewDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', data.applicationId)
      .select()
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
        .eq('id', application.userId);

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