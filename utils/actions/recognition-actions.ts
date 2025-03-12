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

// Helper function to prepare recognition data for Supabase
const prepareForDatabase = (recognition: ProfessionalRecognition, userUlid: string, timestamp: string) => {
  // Ensure ulid is always a string
  if (!recognition.ulid) {
    console.error("[PREPARE_DATABASE_ERROR]", {
      error: "Missing ulid",
      recognition: JSON.stringify(recognition, null, 2),
      timestamp: new Date().toISOString()
    });
    throw new Error("Recognition must have a ulid");
  }
  
  console.log("[PREPARE_DATABASE_RECOGNITION]", {
    ulid: recognition.ulid,
    title: recognition.title,
    type: recognition.type,
    issueDate: recognition.issueDate instanceof Date 
      ? recognition.issueDate.toISOString() 
      : recognition.issueDate,
    isVisible: recognition.isVisible,
    industryType: recognition.industryType,
    hasMetadata: !!recognition.metadata,
    timestamp: new Date().toISOString()
  });
  
  return {
    ulid: recognition.ulid,
    userUlid,
    coachUlid: recognition.coachUlid || null,
    title: recognition.title,
    type: recognition.type,
    description: recognition.description || null,
    issuer: recognition.issuer || null,
    issueDate: recognition.issueDate instanceof Date 
      ? recognition.issueDate.toISOString() 
      : recognition.issueDate,
    expiryDate: recognition.expiryDate instanceof Date 
      ? recognition.expiryDate.toISOString() 
      : recognition.expiryDate,
    verificationUrl: recognition.verificationUrl || null,
    isVisible: recognition.isVisible !== false,
    industryType: recognition.industryType || null,
    metadata: recognition.metadata || {},
    updatedAt: timestamp
  };
};

// Helper function to convert database records to ProfessionalRecognition objects
const convertFromDatabase = (record: any): ProfessionalRecognition => {
  return {
    ulid: record.ulid,
    userUlid: record.userUlid,
    coachUlid: record.coachUlid,
    title: record.title,
    type: record.type,
    description: record.description,
    issuer: record.issuer,
    issueDate: new Date(record.issueDate),
    expiryDate: record.expiryDate ? new Date(record.expiryDate) : null,
    verificationUrl: record.verificationUrl,
    isVisible: record.isVisible !== false,
    industryType: record.industryType || null,
    metadata: record.metadata || {},
    createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
    updatedAt: record.updatedAt ? new Date(record.updatedAt) : undefined
  };
};

export const updateRecognitions = withServerAction<UpdateRecognitionsResponse, ProfessionalRecognition[]>(
  async (recognitions, { userUlid }) => {
    try {
      // Debug authentication context
      console.log("[SERVER_ACTION_AUTH_CONTEXT]", {
        userUlid,
        hasUserUlid: !!userUlid,
        timestamp: new Date().toISOString()
      });
      
      if (!userUlid) {
        console.error("[SERVER_ACTION_AUTH_ERROR]", {
          error: "Missing userUlid",
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: "INTERNAL_ERROR",
            message: "User authentication failed",
            details: "Missing user ID"
          }
        };
      }
      
      console.log("[SERVER_ACTION_UPDATE_RECOGNITIONS]", {
        userUlid,
        recognitionsCount: recognitions?.length || 0,
        recognitionsData: JSON.stringify(recognitions, null, 2),
        timestamp: new Date().toISOString()
      });
      
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
          errors: validationErrors.map(err => err.format()),
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

      console.log("[SERVER_ACTION_VALIDATION_SUCCESS]", {
        userUlid,
        timestamp: new Date().toISOString()
      });

      const supabase = createAuthClient();

      // Get existing recognitions to determine which to update/delete
      console.log("[SERVER_ACTION_FETCHING_EXISTING]", {
        userUlid,
        timestamp: new Date().toISOString()
      });
      
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

      console.log("[SERVER_ACTION_EXISTING_RECOGNITIONS]", {
        userUlid,
        existingCount: existingRecognitions?.length || 0,
        existingUlids: existingRecognitions?.map(r => r.ulid),
        timestamp: new Date().toISOString()
      });

      const existingUlids = new Set(existingRecognitions?.map(r => r.ulid) || []);
      const updatedUlids = new Set(recognitions.filter(r => r.ulid).map(r => r.ulid));

      // Delete recognitions that are no longer present
      const toDelete = Array.from(existingUlids).filter(ulid => !updatedUlids.has(ulid));
      
      console.log("[SERVER_ACTION_TO_DELETE]", {
        userUlid,
        toDeleteCount: toDelete.length,
        toDeleteUlids: toDelete,
        timestamp: new Date().toISOString()
      });
      
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
        
        console.log("[SERVER_ACTION_DELETE_SUCCESS]", {
          userUlid,
          deletedCount: toDelete.length,
          timestamp: new Date().toISOString()
        });
      }

      // Update existing and insert new recognitions
      const timestamp = new Date().toISOString();
      
      // Prepare data for Supabase
      const upsertData = recognitions.map(recognition => 
        prepareForDatabase(recognition, userUlid, timestamp)
      );
      
      console.log("[SERVER_ACTION_UPSERT_DATA]", {
        userUlid,
        upsertCount: upsertData.length,
        upsertData: JSON.stringify(upsertData, null, 2),
        timestamp
      });

      // Use type assertion to help TypeScript understand the structure
      const { error: upsertError } = await supabase
        .from("ProfessionalRecognition")
        .upsert(upsertData as any, {
          onConflict: 'ulid'
        });

      if (upsertError) {
        console.error("[UPDATE_RECOGNITIONS_ERROR]", {
          userUlid,
          error: upsertError,
          upsertData: JSON.stringify(upsertData, null, 2),
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
      
      console.log("[SERVER_ACTION_UPSERT_SUCCESS]", {
        userUlid,
        timestamp
      });

      // Fetch updated recognitions
      console.log("[SERVER_ACTION_FETCHING_UPDATED]", {
        userUlid,
        timestamp
      });
      
      const { data: updatedRecognitions, error: refetchError } = await supabase
        .from("ProfessionalRecognition")
        .select("*")
        .eq("userUlid", userUlid)
        .order("issueDate", { ascending: false });

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
      
      console.log("[SERVER_ACTION_UPDATED_RECOGNITIONS]", {
        userUlid,
        updatedCount: updatedRecognitions?.length || 0,
        timestamp
      });

      // Convert the database response to the expected ProfessionalRecognition type
      const typedRecognitions: ProfessionalRecognition[] = updatedRecognitions.map(convertFromDatabase);

      revalidatePath('/dashboard/coach/profile');
      revalidatePath('/dashboard/profile/recognitions');
      
      console.log("[SERVER_ACTION_COMPLETE]", {
        userUlid,
        success: true,
        recognitionsCount: typedRecognitions.length,
        timestamp
      });

      return {
        data: {
          success: true,
          recognitions: typedRecognitions
        },
        error: null
      };
    } catch (error) {
      console.error("[RECOGNITION_UPDATE_ERROR]", {
        userUlid,
        error,
        stack: error instanceof Error ? error.stack : undefined,
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
        .order("issueDate", { ascending: false });

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

      // Convert the database response to the expected ProfessionalRecognition type
      const typedRecognitions: ProfessionalRecognition[] = recognitions.map(convertFromDatabase);

      return {
        data: typedRecognitions,
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

// Direct test function to check if the server action is properly configured
export const testDirectDatabaseAccess = withServerAction<{ success: boolean, message: string }, void>(
  async (_, { userUlid }) => {
    try {
      console.log("[TEST_DIRECT_DB_ACCESS_START]", {
        userUlid,
        timestamp: new Date().toISOString()
      });
      
      if (!userUlid) {
        console.error("[TEST_DIRECT_DB_ACCESS_ERROR]", {
          error: "Missing userUlid",
          timestamp: new Date().toISOString()
        });
        return {
          data: {
            success: false,
            message: "Missing userUlid"
          },
          error: null
        };
      }
      
      const supabase = createAuthClient();
      
      // Test database connection with a simple query
      const { data, error } = await supabase
        .from("ProfessionalRecognition")
        .select("count")
        .eq("userUlid", userUlid)
        .single();
      
      if (error) {
        console.error("[TEST_DIRECT_DB_ACCESS_ERROR]", {
          userUlid,
          error,
          timestamp: new Date().toISOString()
        });
        return {
          data: {
            success: false,
            message: `Database error: ${error.message}`
          },
          error: null
        };
      }
      
      console.log("[TEST_DIRECT_DB_ACCESS_SUCCESS]", {
        userUlid,
        data,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: {
          success: true,
          message: `Database connection successful. Count: ${data?.count || 0}`
        },
        error: null
      };
    } catch (error) {
      console.error("[TEST_DIRECT_DB_ACCESS_ERROR]", {
        userUlid,
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      return {
        data: {
          success: false,
          message: `Exception: ${error instanceof Error ? error.message : String(error)}`
        },
        error: null
      };
    }
  }
); 