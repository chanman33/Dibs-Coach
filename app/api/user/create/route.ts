import { NextResponse } from 'next/server';
import { ApiResponse } from '@/utils/types/api';
import { withApiAuth } from '@/utils/middleware/withApiAuth';
import { createAuthClient } from '@/utils/auth';
import { ROLES, type UserRole } from '@/utils/roles/roles';
import { z } from 'zod';
import { ulidSchema } from '@/utils/types/auth';

// Validation schema for user creation
const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  profileImageUrl: z.string().url().optional().nullable(),
  role: z.enum(['MENTEE', 'COACH', 'ADMIN']).default('MENTEE'),
  status: z.enum(['active', 'inactive', 'suspended']).default('active')
});

interface User {
  ulid: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: UserRole;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// POST /api/user/create - Create a new user
export const POST = withApiAuth<User>(async (req, { userId }) => {
  try {
    const body = await req.json();
    const validatedData = CreateUserSchema.parse(body);
    
    const supabase = await createAuthClient();

    // Create or update user
    const { data: user, error: userError } = await supabase
      .from('User')
      .upsert({
        userId,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        profileImageUrl: validatedData.profileImageUrl,
        role: validatedData.role,
        status: validatedData.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      console.error('[USER_CREATE_ERROR]', { userId, error: userError });
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create user',
          details: userError
        }
      }, { status: 500 });
    }

    // Create role-specific profile if needed
    if (validatedData.role === ROLES.COACH) {
      const { error: profileError } = await supabase
        .from('CoachProfile')
        .upsert({
          userUlid: user.ulid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

      if (profileError) {
        console.error('[USER_CREATE_ERROR] Failed to create coach profile:', { 
          userUlid: user.ulid, 
          error: profileError 
        });
      }
    }

    return NextResponse.json<ApiResponse<User>>({
      data: user,
      error: null
    });
  } catch (error) {
    console.error('[USER_CREATE_ERROR]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user data',
          details: error.flatten()
        }
      }, { status: 400 });
    }
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create user',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 });
  }
});
