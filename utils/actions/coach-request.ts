'use server'

import { z } from 'zod'
import { auth } from '@clerk/nextjs'
import { createServerAuthClient } from '@/utils/auth/auth-client'
import { generateUlid } from '@/utils/ulid'
import { RealEstateDomain } from '@prisma/client'
import { NextResponse } from 'next/server'
import { CoachRequestStatusEnum, type CoachRequestStatus } from '@/utils/types/coach-request-types';
import { UserRole } from '@/utils/types/user'; // Assuming UserRole enum is here or adjust path

const CoachRequestSchema = z.object({
  requestDetails: z.string().min(1, "Request details are required."),
  preferredDomain: z.nativeEnum(RealEstateDomain).optional(),
  preferredSkills: z.array(z.string()).optional(),
})

// Helper function to check admin authorization
async function checkAdminAuth(supabase: ReturnType<typeof createServerAuthClient>, userId: string) {
  const { data: adminDbUser, error: dbUserError } = await supabase
    .from('User')
    .select('systemRole')
    .eq('userId', userId)
    .single();

  if (dbUserError || !adminDbUser) {
    return { authorized: false, error: { code: 'USER_NOT_FOUND', message: 'Admin user not found in database.' } };
  }

  if (adminDbUser.systemRole !== UserRole.SYSTEM_OWNER && adminDbUser.systemRole !== UserRole.SYSTEM_MODERATOR) {
    return { authorized: false, error: { code: 'UNAUTHORIZED', message: 'User does not have admin privileges.' } };
  }
  return { authorized: true, error: null };
}

export async function createCoachRequest(formData: FormData) {
  const { userId } = auth()
  
  if (!userId) {
    return {
      data: null,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'User is not authenticated.',
      },
    }
  }

  const supabase = createServerAuthClient()
  
  const { data: userData, error: userError } = await supabase
    .from('User')
    .select('ulid')
    .eq('userId', userId)
    .single()

  if (userError || !userData) {
    console.error('[USER_LOOKUP_ERROR]', {
      error: userError,
      userId,
      timestamp: new Date().toISOString()
    })
    return {
      data: null,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found in database.',
      },
    }
  }

  const rawFormData = {
    requestDetails: formData.get('requestDetails'),
    preferredDomain: formData.get('preferredDomain'),
    preferredSkills: formData.getAll('preferredSkills').filter(skill => skill !== ''),
  }

  const validation = CoachRequestSchema.safeParse(rawFormData)

  if (!validation.success) {
    console.error('[VALIDATION_ERROR]', {
      error: validation.error,
      stack: validation.error.stack,
      timestamp: new Date().toISOString(),
    })
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid form data',
        details: validation.error.flatten(),
      },
    }
  }

  const { requestDetails, preferredDomain, preferredSkills } = validation.data
  const ulid = generateUlid()

  try {
    const { data, error } = await supabase
      .from('CoachRequest')
      .insert([
        {
          ulid,
          userUlid: userData.ulid,
          requestDetails,
          preferredDomain: preferredDomain || null,
          preferredSkills: preferredSkills || [],
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(), 
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[DB_INSERT_ERROR]', { error, timestamp: new Date().toISOString() })
      return {
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message || 'Failed to create coach request.',
        },
      }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('[CREATE_COACH_REQUEST_ERROR]', {
      error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred.',
      },
    }
  }
}

export async function fetchCoachRequests() {
  const { userId: adminClerkId } = auth();
  if (!adminClerkId) {
    return { data: [], error: { code: 'UNAUTHENTICATED', message: 'Admin user is not authenticated.' } };
  }

  const supabase = createServerAuthClient();
  const authCheck = await checkAdminAuth(supabase, adminClerkId);
  if (!authCheck.authorized) {
    return { data: [], error: authCheck.error };
  }

  try {
    const { data, error } = await supabase
      .from('CoachRequest')
      .select(`
        *,
        user:User!CoachRequest_userUlid_fkey (firstName, lastName, email)
      `)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[FETCH_COACH_REQUESTS_ERROR]', { error, timestamp: new Date().toISOString() });
      return {
        data: [],
        error: {
          code: 'DATABASE_ERROR',
          message: error.message || 'Failed to fetch coach requests.',
        },
      };
    }
    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('[FETCH_COACH_REQUESTS_UNEXPECTED_ERROR]', {
      error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return {
      data: [],
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred while fetching requests.',
      },
    };
  }
}

const UpdateCoachRequestStatusSchema = z.object({
  ulid: z.string().length(26, 'Invalid ULID'),
  status: CoachRequestStatusEnum 
});

export async function updateCoachRequestStatus(params: { ulid: string; status: CoachRequestStatus }) {
  const { userId: adminClerkId } = auth();
  if (!adminClerkId) {
    return { data: null, error: { code: 'UNAUTHENTICATED', message: 'Admin user is not authenticated.' } };
  }

  const supabase = createServerAuthClient();
  const authCheck = await checkAdminAuth(supabase, adminClerkId);
  if (!authCheck.authorized) {
    return { data: null, error: authCheck.error };
  }

  const validation = UpdateCoachRequestStatusSchema.safeParse(params);
  if (!validation.success) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input for status update.',
        details: validation.error.flatten(),
      },
    };
  }

  const { ulid, status } = validation.data;

  try {
    const { data, error } = await supabase
      .from('CoachRequest')
      .update({ status, updatedAt: new Date().toISOString() })
      .eq('ulid', ulid)
      .select()
      .single();

    if (error) {
      console.error('[UPDATE_COACH_REQUEST_STATUS_ERROR]', { error, ulid, status, timestamp: new Date().toISOString() });
      return {
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message || 'Failed to update coach request status.',
        },
      };
    }
    return { data, error: null };
  } catch (error: any) {
    console.error('[UPDATE_COACH_REQUEST_STATUS_UNEXPECTED_ERROR]', {
      error,
      stack: error.stack,
      ulid,
      status,
      timestamp: new Date().toISOString(),
    });
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred while updating status.',
      },
    };
  }
}

const AddCoachRequestReviewNotesSchema = z.object({
  ulid: z.string().length(26, 'Invalid ULID'),
  notes: z.string().optional(),
});

export async function addCoachRequestReviewNotes(params: { ulid: string; notes: string }) {
  const { userId: adminClerkId } = auth();
  if (!adminClerkId) {
    return { data: null, error: { code: 'UNAUTHENTICATED', message: 'Admin user is not authenticated.' } };
  }

  const supabase = createServerAuthClient();
  const authCheck = await checkAdminAuth(supabase, adminClerkId);
  if (!authCheck.authorized) {
    return { data: null, error: authCheck.error };
  }
  
  const validation = AddCoachRequestReviewNotesSchema.safeParse(params);
  if (!validation.success) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input for review notes.',
        details: validation.error.flatten(),
      },
    };
  }

  const { ulid, notes } = validation.data;

  try {
    const { data, error } = await supabase
      .from('CoachRequest')
      .update({ reviewNotes: notes, updatedAt: new Date().toISOString() })
      .eq('ulid', ulid)
      .select()
      .single();

    if (error) {
      console.error('[ADD_COACH_REQUEST_REVIEW_NOTES_ERROR]', { error, ulid, timestamp: new Date().toISOString() });
      return {
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message || 'Failed to save review notes.',
        },
      };
    }
    return { data, error: null };
  } catch (error: any) {
    console.error('[ADD_COACH_REQUEST_REVIEW_NOTES_UNEXPECTED_ERROR]', {
      error,
      stack: error.stack,
      ulid,
      timestamp: new Date().toISOString(),
    });
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred while saving notes.',
      },
    };
  }
} 