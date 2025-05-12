import { NextResponse } from 'next/server';
import { ApiResponse } from '@/utils/types/api';
import { withApiAuth } from '@/utils/middleware/withApiAuth';
import { createAuthClient } from '@/utils/auth';
import { SYSTEM_ROLES, USER_CAPABILITIES, type SystemRole, type UserCapability } from '@/utils/roles/roles';
import { z } from 'zod';
import { generateUlid } from '@/utils/ulid';

export const dynamic = 'force-dynamic';

// Validation schema for user creation
const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  profileImageUrl: z.string().url().optional().nullable(),
  role: z.enum([USER_CAPABILITIES.MENTEE, USER_CAPABILITIES.COACH, 'ADMIN']).default(USER_CAPABILITIES.MENTEE),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE')
});

interface User {
  ulid: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  systemRole: SystemRole;
  capabilities: UserCapability[];
  isCoach: boolean;
  isMentee: boolean;
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
    const newUserUlid = generateUlid();

    let systemRole: SystemRole = SYSTEM_ROLES.USER;
    let capabilities: UserCapability[] = [];
    let isCoach = false;
    let isMentee = false;

    if (validatedData.role === 'ADMIN') {
      systemRole = SYSTEM_ROLES.SYSTEM_MODERATOR;
    } else if (validatedData.role === USER_CAPABILITIES.COACH) {
      capabilities = [USER_CAPABILITIES.COACH];
      isCoach = true;
    } else if (validatedData.role === USER_CAPABILITIES.MENTEE) {
      capabilities = [USER_CAPABILITIES.MENTEE];
      isMentee = true;
    }

    // Create or update user
    const { data: user, error: userError } = await supabase
      .from('User')
      .upsert({
        ulid: newUserUlid,
        userId,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        profileImageUrl: validatedData.profileImageUrl,
        systemRole,
        capabilities,
        isCoach,
        isMentee,
        status: validatedData.status,
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      console.error('[USER_CREATE_ERROR]', { userId, userUlid: newUserUlid, error: userError });
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create user',
          details: userError
        }
      }, { status: 500 });
    }

    if (!user) {
      // This case should ideally not be reached if userError is not thrown,
      // but as a safeguard if upsert returns no error and no data.
      console.error('[USER_CREATE_ERROR] User data not returned after upsert', { userId, userUlid: newUserUlid });
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to retrieve user data after creation'
        }
      }, { status: 500 });
    }

    // Create role-specific profile if needed
    if (validatedData.role === USER_CAPABILITIES.COACH) {
      const profileUlid = generateUlid();
      const { error: profileError } = await supabase
        .from('CoachProfile')
        .upsert({
          ulid: profileUlid,
          userUlid: user.ulid,
          updatedAt: new Date().toISOString()
        });

      if (profileError) {
        console.error('[USER_CREATE_ERROR] Failed to create coach profile:', { 
          userUlid: user.ulid, 
          profileUlid,
          error: profileError 
        });
      }
    }

    // Ensure capabilities is an array for the response
    const responseUser: User = {
      ...user,
      capabilities: user.capabilities ?? [] 
    };

    return NextResponse.json<ApiResponse<User>>({
      data: responseUser,
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
