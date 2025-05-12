import { createAuthClient } from '@/utils/auth';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/organizations/[organizationUlid]/members
 * 
 * Fetch all members of an organization
 */
export async function GET(
  request: Request,
  { params }: { params: { organizationUlid: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const organizationUlid = params.organizationUlid;
    
    if (!organizationUlid) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const supabase = await createAuthClient();
    
    // First, get the user's ulid from their Clerk ID
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single();
    
    if (userError || !user) {
      console.error('[FETCH_USER_ERROR]', { userId, error: userError });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the user is a member of the organization
    const { data: membership, error: membershipError } = await supabase
      .from('OrganizationMember')
      .select('*')
      .eq('userUlid', user.ulid)
      .eq('organizationUlid', organizationUlid)
      .eq('status', 'ACTIVE')
      .single();
    
    if (membershipError || !membership) {
      console.error('[FETCH_MEMBERSHIP_ERROR]', { 
        userUlid: user.ulid, 
        organizationUlid, 
        error: membershipError 
      });
      return NextResponse.json({ error: 'Not a member of the organization' }, { status: 403 });
    }

    // Fetch all members of the organization
    const { data: members, error: membersError } = await supabase
      .from('OrganizationMember')
      .select(`
        ulid,
        role,
        status,
        createdAt,
        user:userUlid (
          ulid,
          firstName,
          lastName,
          email,
          displayName,
          profileImageUrl
        )
      `)
      .eq('organizationUlid', organizationUlid)
      .eq('status', 'ACTIVE')
      .order('createdAt', { ascending: false });
    
    if (membersError) {
      console.error('[FETCH_MEMBERS_ERROR]', { 
        organizationUlid, 
        error: membersError 
      });
      return NextResponse.json({ error: 'Failed to fetch organization members' }, { status: 500 });
    }

    // Log the result for debugging
    console.log('[ORGANIZATION_MEMBERS_FETCHED]', {
      organizationUlid,
      memberCount: members?.length || 0
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('[FETCH_ORGANIZATION_MEMBERS_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 