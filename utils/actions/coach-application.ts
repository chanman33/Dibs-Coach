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

interface CoachApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  resume: File;
  linkedIn?: string;
  primarySocialMedia?: string;
  yearsOfExperience: string;
  expertise: string;
  additionalInfo: string;
}

async function createCoachApplication(data: CoachApplicationData & { status?: string, applicationId?: string }) {
  const { userId: clerkUserId } = await auth();
  const clerkUser = await currentUser();
  
  if (!clerkUserId || !clerkUser) {
    throw new Error('Unauthorized');
  }

  const supabase = await getSupabaseClient();

  // Get or create user
  const { data: userData } = await supabase
    .from('User')
    .select('id')
    .eq('userId', clerkUserId)
    .single();

  // Update user information
  await supabase
    .from('User')
    .update({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      updatedAt: new Date().toISOString()
    })
    .eq('id', userData?.id);

  // Upload resume to Supabase Storage if provided
  let resumePath = null;
  if (data.resume) {
    const fileExt = data.resume.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'pdf') {
      throw new Error('Only PDF files are allowed');
    }

    // Create a unique file path that includes user ID for better organization and security
    const fileName = `${userData?.id}/${Date.now()}-${data.resume.name}`;
    
    try {
      const { error: uploadError } = await supabase
        .storage
        .from('resumes')
        .upload(fileName, data.resume, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[RESUME_UPLOAD_ERROR]', uploadError);
        throw new Error('Failed to upload resume');
      }

      resumePath = fileName;
    } catch (error) {
      console.error('[RESUME_UPLOAD_ERROR]', error);
      throw new Error('Failed to upload resume');
    }
  }

  const applicationData = {
    applicantDbId: userData?.id,
    experience: data.yearsOfExperience,
    specialties: data.expertise.split(',').map(s => s.trim()),
    resumeUrl: resumePath,
    linkedIn: data.linkedIn,
    primarySocialMedia: data.primarySocialMedia,
    additionalInfo: data.additionalInfo,
    isDraft: data.status === 'draft',
    lastSavedAt: data.status === 'draft' ? new Date().toISOString() : null,
    status: data.status === 'draft' ? 'pending' : data.status || 'pending',
    draftData: data.status === 'draft' ? {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      resumePath,
      linkedIn: data.linkedIn,
      primarySocialMedia: data.primarySocialMedia,
      yearsOfExperience: data.yearsOfExperience,
      expertise: data.expertise,
      additionalInfo: data.additionalInfo,
      version: 1
    } : null,
    updatedAt: new Date().toISOString()
  };

  // If updating existing application
  if (data.applicationId) {
    const { data: existingApp } = await supabase
      .from('CoachApplication')
      .select('draftVersion')
      .eq('id', data.applicationId)
      .single();

    const { data: application, error } = await supabase
      .from('CoachApplication')
      .update({
        ...applicationData,
        draftVersion: data.status === 'draft' ? (existingApp?.draftVersion || 1) + 1 : 1
      })
      .eq('id', data.applicationId)
      .select()
      .single();

    if (error) throw error;
    return application;
  }

  // Create new application
  const { data: application, error } = await supabase
    .from('CoachApplication')
    .insert(applicationData)
    .select()
    .single();

  if (error) throw error;
  return application;
}

// Helper function to get a signed URL for resume access
export async function getSignedResumeUrl(filePath: string) {
  const supabase = await getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .storage
      .from('resumes')
      .createSignedUrl(filePath, 60);

    if (error || !data) {
      console.error('[SIGNED_URL_ERROR]', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('[SIGNED_URL_ERROR]', error);
    return null;
  }
}

export async function submitCoachApplication(formData: FormData) {
  const resume = formData.get('resume') as File;
  const status = formData.get('status') as string;
  const applicationId = formData.get('applicationId') as string;

  // Only require resume for final submission
  if (!resume && status !== 'draft') {
    throw new Error('Resume is required');
  }

  const applicationData = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    email: formData.get('email') as string,
    phoneNumber: formData.get('phoneNumber') as string,
    resume,
    linkedIn: formData.get('linkedIn') as string,
    primarySocialMedia: formData.get('primarySocialMedia') as string,
    yearsOfExperience: formData.get('yearsOfExperience') as string,
    expertise: formData.get('expertise') as string,
    additionalInfo: formData.get('additionalInfo') as string,
    status,
    applicationId
  };

  return await createCoachApplication(applicationData);
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
      isAdmin: userData.role === 'ADMIN'
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

    if (userData.role?.toUpperCase() !== 'ADMIN') {
      query.eq('applicantDbId', userData.id);
    }

    const { data: applications, error: applicationsError } = await query;

    if (applicationsError) {
      console.error('[GET_COACH_APPLICATION_ERROR] Query error:', applicationsError);
      return [];
    }

    console.log('[DEBUG] Applications query result:', {
      userRole: userData.role,
      isAdmin: userData.role === 'ADMIN',
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
  status: 'pending' | 'approved' | 'rejected';
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
          role: 'ADMIN', // Note: This won't override existing role
          status: 'active',
          memberStatus: 'active', // Required field
          designations: [], // Required field
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
      console.error('[REVIEW_COACH_APPLICATION_ERROR] Admin user error:', userError);
      throw new Error('Failed to verify admin user');
    }

    if (!userData || userData.role?.toUpperCase() !== 'ADMIN') {
      throw new Error('Unauthorized: User is not an admin');
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
      console.error('[REVIEW_COACH_APPLICATION_ERROR] Application update error:', applicationError);
      throw new Error('Failed to update application status');
    }

    if (!application) {
      throw new Error('Application not found');
    }

    // If approved, update user role to coach and ensure realtor profile exists
    if (data.status === COACH_APPLICATION_STATUS.APPROVED) {
      // Update user role
      const { error: updateError } = await supabase
        .from('User')
        .update({
          role: 'COACH',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', application.applicantDbId);

      if (updateError) {
        console.error('[REVIEW_COACH_APPLICATION_ERROR] User role update error:', updateError);
        throw new Error('Failed to update user role');
      }

      // Check if realtor profile exists
      const { data: existingProfile } = await supabase
        .from('RealtorProfile')
        .select('id')
        .eq('userDbId', application.applicantDbId)
        .single();

      // If no realtor profile exists, create one
      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('RealtorProfile')
          .insert({
            userDbId: application.applicantDbId,
            bio: application.experience || '',
            yearsExperience: 0,
            propertyTypes: [],
            specializations: [],
            certifications: [],
            languages: [],
            geographicFocus: {},
            marketingAreas: [],
            testimonials: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

        if (profileError) {
          console.error('[REVIEW_COACH_APPLICATION_ERROR] Realtor profile creation error:', profileError);
          throw new Error('Failed to create realtor profile');
        }
      }
    }

    revalidatePath('/dashboard/profile');
    return application;
  } catch (error) {
    console.error('[REVIEW_COACH_APPLICATION_ERROR]', error);
    throw error; // Throw the original error to preserve the error message
  }
} 