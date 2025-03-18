import { createAuthClient } from '@/utils/auth';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * GET /api/user/organizations
 * 
 * Fetch all organizations the current user is a member of
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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

    // Then, fetch their organization memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('OrganizationMember')
      .select(`
        *,
        organization:organizationUlid (
          ulid,
          name,
          type,
          status,
          tier,
          industry,
          level
        )
      `)
      .eq('userUlid', user.ulid)
      .eq('status', 'ACTIVE')
      .order('createdAt', { ascending: false });
    
    if (membershipError) {
      console.error('Error fetching organization memberships:', membershipError);
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }

    return NextResponse.json({ organizations: memberships });
  } catch (error) {
    console.error('Unexpected error in organizations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 