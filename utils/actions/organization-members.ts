'use server';

import { z } from 'zod';
import { createAuthClient } from '@/utils/auth';
import { withServerAction } from '@/utils/middleware/withServerAction';
import { ApiResponse, ApiErrorCode } from '@/utils/types/api';

/**
 * Type definition for organization member with user information
 */
export type OrganizationMemberWithUser = {
  ulid: string;
  role: string;
  status: string;
  createdAt: string;
  userUlid: string;
  organizationUlid: string;
  user: {
    ulid: string;
    firstName: string;
    lastName: string;
    email: string;
    displayName?: string;
    profileImageUrl?: string;
  };
};

/**
 * Fetch all members of an organization using the authenticated user context
 */
export const fetchOrganizationMembers = withServerAction<OrganizationMemberWithUser[], string>(
  async (organizationUlid: string, context): Promise<ApiResponse<OrganizationMemberWithUser[]>> => {
    console.log("[FETCH_ORG_MEMBERS_START]", { 
      organizationUlid, 
      contextUser: context.userUlid 
    });
    
    try {
      if (!organizationUlid) {
        throw new Error("Organization ID is required");
      }
      
      const supabase = await createAuthClient();
      
      // Check if the user is a member of the organization
      const { data: membership, error: membershipError } = await supabase
        .from('OrganizationMember')
        .select('*')
        .eq('userUlid', context.userUlid)
        .eq('organizationUlid', organizationUlid)
        .eq('status', 'ACTIVE')
        .maybeSingle();
      
      if (membershipError) {
        console.error("[MEMBERSHIP_CHECK_ERROR]", { 
          error: membershipError, 
          userUlid: context.userUlid,
          organizationUlid
        });
      }
      
      // Fetch all active members of the organization
      const { data: members, error: membersError } = await supabase
        .from('OrganizationMember')
        .select(`
          ulid,
          role,
          status,
          createdAt,
          userUlid,
          organizationUlid,
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
        console.error("[FETCH_MEMBERS_ERROR]", { 
          error: membersError, 
          organizationUlid 
        });
        throw new Error(`Failed to fetch organization members: ${membersError.message}`);
      }
      
      console.log("[FETCH_ORG_MEMBERS_SUCCESS]", {
        organizationUlid,
        memberCount: members?.length || 0
      });
      
      return { data: members as OrganizationMemberWithUser[], error: null };
    } catch (error) {
      console.error("[FETCH_ORG_MEMBERS_ERROR]", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        organizationUlid,
        userUlid: context.userUlid,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        data: null,
        error: {
          code: "FETCH_ERROR" as ApiErrorCode,
          message: error instanceof Error ? error.message : "Failed to fetch organization members",
        },
      };
    }
  },
  { requireOrganization: true }
); 