import { createAuthClient } from '@/utils/auth';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const setActiveSchema = z.object({
  organizationUlid: z.string().length(26)
});

/**
 * POST /api/user/organizations/setActive
 * 
 * Sets the user's active organization context
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    let validatedData: z.infer<typeof setActiveSchema>;
    
    try {
      validatedData = setActiveSchema.parse(body);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const supabase = createAuthClient();
    
    // First, get the user's ulid from their Clerk ID
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single();
    
    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the user is a member of the organization
    const { data: membership, error: membershipError } = await supabase
      .from('OrganizationMember')
      .select('*')
      .eq('userUlid', user.ulid)
      .eq('organizationUlid', validatedData.organizationUlid)
      .eq('status', 'ACTIVE')
      .single();
    
    if (membershipError || !membership) {
      console.error('User is not a member of the organization:', membershipError);
      return NextResponse.json({ error: 'Not a member of the organization' }, { status: 403 });
    }

    // The client handles storing the active organization in localStorage
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in setActive API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 