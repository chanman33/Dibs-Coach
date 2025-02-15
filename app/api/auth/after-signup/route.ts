import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { ensureUserExists } from '@/utils/auth';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ensureUserExists will handle both creation and updates
    const user = await ensureUserExists();
    
    return NextResponse.json({ 
      user: {
        ulid: user.ulid,
        userId: user.userId,
        email: user.email,
        role: user.role
      } 
    });
  } catch (error: any) {
    console.error('[AFTER_SIGNUP_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
} 