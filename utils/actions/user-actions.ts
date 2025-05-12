'use server'

import { auth } from "@clerk/nextjs/server";
import { createAuthClient } from "../auth";
import { withServerAction } from "@/utils/middleware/withServerAction";
import { SYSTEM_ROLES, USER_CAPABILITIES } from "@/utils/roles/roles";
import { getUserRoleContext } from "@/utils/roles/checkUserRole";

interface UserCapabilitiesResult {
  capabilities: string[];
  specialties: string[];
}

interface GetUserRolesResult {
  exists: boolean;
  roleData?: {
    systemRole: string;
    capabilities: string[];
  };
}

interface UpdateUserRolesParams {
  systemRole: keyof typeof SYSTEM_ROLES;
  capabilities: (keyof typeof USER_CAPABILITIES)[];
}

interface UpdateUserRolesResult {
  systemRole: string;
  capabilities: string[];
}

/**
 * Fetches the user's capabilities and specialties from the database
 */
export const fetchUserCapabilities = withServerAction<UserCapabilitiesResult, void>(
  async (_, { userUlid }) => {
    try {
      // Validate that userUlid is defined
      if (!userUlid) {
        return {
          data: null,
          error: {
            code: 'AUTH_ERROR',
            message: 'User ID is required'
          }
        };
      }
      
      const supabase = await createAuthClient();
      
      // Get user capabilities
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select(`
          capabilities,
          isCoach,
          isMentee
        `)
        .eq("ulid", userUlid)
        .single();

      if (userError) {
        console.error("[USER_CAPABILITIES_ERROR]", { userUlid, error: userError });
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch user capabilities',
            details: userError
          }
        };
      }

      // Get user specialties if they are a coach
      let specialties: string[] = [];
      
      if (userData.isCoach) {
        const { data: coachData, error: coachError } = await supabase
          .from("CoachProfile")
          .select(`
            coachRealEstateDomains
          `)
          .eq("userUlid", userUlid)
          .single();

        if (!coachError && coachData) {
          specialties = coachData.coachRealEstateDomains || [];
        }
      }

      // Ensure COACH capability is included if isCoach is true
      let capabilities = userData.capabilities || [];
      if (userData.isCoach && !capabilities.includes("COACH")) {
        capabilities.push("COACH");
      }
      
      // Ensure MENTEE capability is included if isMentee is true
      if (userData.isMentee && !capabilities.includes("MENTEE")) {
        capabilities.push("MENTEE");
      }

      // For development purposes, if no capabilities are found but we're on the coach profile page,
      // we'll assume the user is a coach
      if (capabilities.length === 0) {
        capabilities = ["COACH"];
        specialties = ["REALTOR", "INVESTOR"]; // Default specialties for testing
      }

      return {
        data: {
          capabilities,
          specialties
        },
        error: null
      };
    } catch (error) {
      console.error("[USER_CAPABILITIES_ERROR]", error);
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        }
      };
    }
  }
);

/**
 * Fetches the user's role context including system role and capabilities
 */
export const getUserRoles = withServerAction<GetUserRolesResult, { isInitialSignup?: boolean }>(
  async ({ isInitialSignup = false }, { userUlid }) => {
    try {
      // Validate that userUlid is defined
      if (!userUlid) {
        return {
          data: null,
          error: {
            code: 'AUTH_ERROR',
            message: 'User ID is required'
          }
        };
      }
      
      const { userId } = await auth();
      
      if (!userId) {
        return {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          }
        };
      }

      const roleContext = await getUserRoleContext(userId, { isInitialSignup });
      
      if (!roleContext) {
        return {
          data: { exists: false },
          error: null
        };
      }
      
      return { 
        data: {
          exists: true, 
          roleData: {
            systemRole: roleContext.systemRole,
            capabilities: roleContext.capabilities
          }
        },
        error: null
      };
    } catch (error) {
      console.error("[GET_USER_ROLES_ERROR]", error);
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        }
      };
    }
  }
);

/**
 * Updates the user's system role and capabilities
 */
export const updateUserRoles = withServerAction<UpdateUserRolesResult, UpdateUserRolesParams>(
  async ({ systemRole, capabilities }, { userUlid }) => {
    try {
      // Validate that userUlid is defined
      if (!userUlid) {
        return {
          data: null,
          error: {
            code: 'AUTH_ERROR',
            message: 'User ID is required'
          }
        };
      }
      
      const { userId } = await auth();
      
      if (!userId) {
        return {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          }
        };
      }

      // Validate system role
      if (!Object.values(SYSTEM_ROLES).includes(systemRole)) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid system role provided'
          }
        };
      }

      // Validate capabilities
      if (!Array.isArray(capabilities) || 
          !capabilities.every(c => Object.values(USER_CAPABILITIES).includes(c))) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid capabilities provided'
          }
        };
      }

      const supabase = await createAuthClient();

      // Update user roles using ULID
      const { data, error: updateError } = await supabase
        .from("User")
        .update({ 
          systemRole,
          capabilities,
          updatedAt: new Date().toISOString()
        })
        .eq("ulid", userUlid)
        .select()
        .single();

      if (updateError) {
        console.error("[UPDATE_USER_ROLES_ERROR]", updateError);
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update user roles',
            details: updateError
          }
        };
      }

      return { 
        data: {
          systemRole: data.systemRole,
          capabilities: data.capabilities || []
        },
        error: null
      };
    } catch (error) {
      console.error("[UPDATE_USER_ROLES_ERROR]", error);
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        }
      };
    }
  }
); 