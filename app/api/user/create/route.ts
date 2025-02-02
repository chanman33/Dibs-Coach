import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userCreate } from '@/utils/data/user/userCreate';
import { ROLES } from '@/utils/roles/roles';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Ensure the userId from the request matches the authenticated user
    if (body.userId !== userId) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const result = await userCreate({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      profileImageUrl: body.profileImageUrl,
      userId: body.userId,
      role: body.role || ROLES.MENTEE,
      memberStatus: body.memberStatus || 'active'
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[USER_CREATE_API_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
