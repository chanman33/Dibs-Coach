'use server'

import { z } from "zod"
import { createAuthClient } from "../auth"
import { withServerAction } from "@/utils/middleware/withServerAction"
import type { ApiResponse } from "@/utils/types/api"
import { revalidatePath } from "next/cache"
import { ProfessionalRecognition, ProfessionalRecognitionSchema } from "@/utils/types/recognition"

interface UpdateRecognitionsResponse {
  success: boolean;
  recognitions: ProfessionalRecognition[];
}

export const updateRecognitions = withServerAction<UpdateRecognitionsResponse, ProfessionalRecognition[]>(
  async (recognitions, { userUlid }) => {
    try {
      // Validate all recognitions
      const validationResults = recognitions.map(recognition => 
        ProfessionalRecognitionSchema.safeParse(recognition)
      );

      const validationErrors = validationResults
        .filter(result => !result.success)
        .map(result => (result as { error: z.ZodError }).error);

      if (validationErrors.length > 0) {
        console.error("[RECOGNITION_VALIDATION_ERROR]", {
          userUlid,
          errors: validationErrors,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid recognition data",
            details: validationErrors
          }
        };
      }

      const supabase = createAuthClient();

      // Get existing recognitions to determine which to update/delete
      const { data: existingRecognitions, error: fetchError } = await supabase
        .from("ProfessionalRecognition")
        .select("ulid")
        .eq("userUlid", userUlid);

      if (fetchError) {
        console.error("[FETCH_RECOGNITIONS_ERROR]", {
          userUlid,
          error: fetchError,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to fetch existing recognitions",
            details: fetchError
          }
        };
      }

      const existingUlids = new Set(existingRecognitions?.map(r => r.ulid) || []);
      const updatedUlids = new Set(recognitions.filter(r => r.ulid).map(r => r.ulid));

      // Delete recognitions that are no longer present
      const toDelete = Array.from(existingUlids).filter(ulid => !updatedUlids.has(ulid));
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("ProfessionalRecognition")
          .delete()
          .in("ulid", toDelete);

        if (deleteError) {
          console.error("[DELETE_RECOGNITIONS_ERROR]", {
            userUlid,
            error: deleteError,
            timestamp: new Date().toISOString()
          });
          return {
            data: null,
            error: {
              code: "DATABASE_ERROR",
              message: "Failed to delete recognitions",
              details: deleteError
            }
          };
        }
      }

      // Update existing and insert new recognitions
      const timestamp = new Date().toISOString();
      const upsertData = recognitions.map(recognition => ({
        ...recognition,
        userUlid,
        updatedAt: timestamp
      }));

      const { error: upsertError } = await supabase
        .from("ProfessionalRecognition")
        .upsert(upsertData, {
          onConflict: 'ulid'
        });

      if (upsertError) {
        console.error("[UPDATE_RECOGNITIONS_ERROR]", {
          userUlid,
          error: upsertError,
          timestamp
        });
        return {
          data: null,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to update recognitions",
            details: upsertError
          }
        };
      }

      // Fetch updated recognitions
      const { data: updatedRecognitions, error: refetchError } = await supabase
        .from("ProfessionalRecognition")
        .select("*")
        .eq("userUlid", userUlid)
        .order("year", { ascending: false });

      if (refetchError) {
        console.error("[REFETCH_RECOGNITIONS_ERROR]", {
          userUlid,
          error: refetchError,
          timestamp
        });
        return {
          data: null,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to fetch updated recognitions",
            details: refetchError
          }
        };
      }

      revalidatePath('/dashboard/coach/profile');
      revalidatePath('/dashboard/profile/recognitions');

      return {
        data: {
          success: true,
          recognitions: updatedRecognitions
        },
        error: null
      };
    } catch (error) {
      console.error("[RECOGNITION_UPDATE_ERROR]", {
        userUlid,
        error,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
);

export const fetchRecognitions = withServerAction<ProfessionalRecognition[], void>(
  async (_, { userUlid }) => {
    try {
      const supabase = createAuthClient();

      const { data: recognitions, error } = await supabase
        .from("ProfessionalRecognition")
        .select("*")
        .eq("userUlid", userUlid)
        .order("year", { ascending: false });

      if (error) {
        console.error("[FETCH_RECOGNITIONS_ERROR]", {
          userUlid,
          error,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to fetch recognitions",
            details: error
          }
        };
      }

      return {
        data: recognitions,
        error: null
      };
    } catch (error) {
      console.error("[RECOGNITION_FETCH_ERROR]", {
        userUlid,
        error,
        timestamp: new Date().toISOString()
      });
      return {
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
); 