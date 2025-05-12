import { createAuthClient } from '@/utils/auth';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/organizations/[organizationUlid]/context
 * 
 * Get detailed information about an organization and the user's role within it
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
    
    const organizationId = params.organizationUlid;
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
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
      .select(`
        *,
        organization:organizationUlid (
          ulid,
          name,
          description,
          type,
          status,
          tier,
          industry,
          level,
          specializations,
          createdAt,
          updatedAt,
          metadata
        )
      `)
      .eq('userUlid', user.ulid)
      .eq('organizationUlid', organizationId)
      .eq('status', 'ACTIVE')
      .single();
    
    if (membershipError || !membership) {
      console.error('User is not a member of the organization:', membershipError);
      return NextResponse.json({ error: 'Not a member of the organization' }, { status: 403 });
    }

    // Get the role permissions
    const { data: rolePermissions, error: permissionsError } = await supabase
      .from('RolePermission')
      .select('permissions')
      .eq('organizationUlid', organizationId)
      .eq('role', membership.role)
      .single();
    
    // If there are no explicit permissions for the role, default to an empty object
    const permissions = rolePermissions?.permissions || {};

    // Return the organization context
    return NextResponse.json({
      organizationUlid: membership.organizationUlid,
      role: membership.role,
      scope: membership.scope,
      customPermissions: membership.customPermissions,
      permissions,
      organization: membership.organization
    });
  } catch (error) {
    console.error('Unexpected error in organization context API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 