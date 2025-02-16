"use server";

import { auth } from "@clerk/nextjs/server";
import { createAuthClient } from "@/utils/auth";
import { ApiResponse } from "@/utils/types/api";
import { withServerAction } from "@/utils/middleware/withServerAction";
import { z } from "zod";

// Example schema for action parameters
const ActionParamsSchema = z.object({
  // Define your parameters here
  param1: z.string(),
  param2: z.number().optional()
});

// Example response type
interface ActionResponse {
  // Define your response type here
  success: boolean;
  data: any;
}

// Define the action with type safety
export const actionTemplate = withServerAction<ActionResponse, z.infer<typeof ActionParamsSchema>>(
  async (params, { userUlid, role }) => {
    try {
      // Validate parameters
      const validatedParams = ActionParamsSchema.parse(params);
      
      // Get Supabase client
      const supabase = await createAuthClient();
      
      // Perform your action here
      const { data, error } = await supabase
        .from("YourTable")
        .select("*")
        .eq("userUlid", userUlid)
        .single();
        
      if (error) {
        console.error("[ACTION_ERROR]", { userUlid, error });
        return {
          data: null,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to fetch data"
          }
        };
      }
      
      return {
        data: {
          success: true,
          data
        },
        error: null
      };
    } catch (error) {
      console.error("[ACTION_ERROR]", error);
      return {
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
          details: error instanceof Error ? { message: error.message } : undefined
        }
      };
    }
  }
);
