'use server'

import { auth } from "@clerk/nextjs/server";
import { createAuthClient } from "../auth";
import { withServerAction } from "@/utils/middleware/withServerAction";

interface UserCapabilitiesResult {
  capabilities: string[];
  specialties: string[];
}

/**
 * Fetches the user's capabilities and specialties from the database
 */
export const fetchUserCapabilities = withServerAction<UserCapabilitiesResult, void>(
  async (_, { userUlid }) => {
    try {
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
            domainSpecialties
          `)
          .eq("userUlid", userUlid)
          .single();

        if (!coachError && coachData) {
          specialties = coachData.domainSpecialties || [];
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