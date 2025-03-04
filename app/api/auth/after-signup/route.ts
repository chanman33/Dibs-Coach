import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { ensureUserExists } from '@/utils/auth';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Try to get existing user
      const user = await ensureUserExists(userId);
      return NextResponse.json({ 
        user: {
          userId: user.userId,
          systemRole: user.systemRole,
          capabilities: user.capabilities
        } 
      });
    } catch (error: any) {
      if (error.message?.includes('User not found')) {
        // User doesn't exist yet - this is expected right after signup
        // The webhook will create the user
        return NextResponse.json({ 
          status: 'pending',
          message: 'User creation in progress'
        });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('[AFTER_SIGNUP_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process signup' },
      { status: 500 }
    );
  }
} 