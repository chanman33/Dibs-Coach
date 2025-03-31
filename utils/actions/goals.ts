"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { 
  createGoalSchema, 
  updateGoalSchema, 
  getGoalsSchema, 
  GOAL_STATUS,
  GOAL_TYPE,
  GoalWithRelations,
  UpdateGoal,
  GoalStatus,
  GoalType,
  GetGoals
} from "@/utils/types/goal";
import { GoalFormValues } from "@/utils/types/goals";
import { withServerAction, ServerActionContext } from "@/utils/middleware/withServerAction";
import { ApiResponse, ApiErrorCode } from "@/utils/types/api";
import { generateUlid } from "@/utils/ulid";
import { createAuthClient } from "@/utils/auth";

/**
 * Fetch user's personal goals
 * This function will also fetch organization goals that are visible to the user
 * Includes retry logic to handle occasional failures
 */
export const fetchGoals = withServerAction<GoalWithRelations[], GetGoals>(
  async (params = {}, context): Promise<ApiResponse<GoalWithRelations[]>> => {
    const requestId = generateUlid();
    
    // Only log start if we're in development or if it's the first attempt
    if (process.env.NODE_ENV === 'development') {
      console.log("[FETCH_GOALS_START]", { 
        requestId,
        params, 
        userUlid: context.userUlid,
        timestamp: new Date().toISOString()
      });
    }
    
    // Retry configuration
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 500; // ms
    
    // Helper function to create a delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Retry loop
    let lastError = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const supabase = await createAuthClient();
        
        // Get user's organization memberships in a single query
        const { data: userOrgs, error: orgsError } = await supabase
          .from("OrganizationMember")
          .select("organizationUlid, organization:organizationUlid(name, type, industry)")
          .eq("userUlid", context.userUlid)
          .eq("status", "ACTIVE");
        
        if (orgsError) {
          // Only log org errors on final attempt
          if (attempt === MAX_RETRIES) {
            console.error("[FETCH_USER_ORGS_ERROR]", { 
              requestId,
              error: orgsError, 
              message: orgsError.message, 
              timestamp: new Date().toISOString(),
              attempt
            });
          }
          lastError = orgsError;
          if (attempt < MAX_RETRIES) {
            await delay(RETRY_DELAY * attempt);
            continue;
          }
          throw orgsError;
        }
        
        const userOrgIds = userOrgs?.map(org => org.organizationUlid) || [];
        
        // Build an optimized query to fetch all goals in one go
        let query = supabase
          .from("Goal")
          .select(`
            *,
            user:userUlid (
              firstName,
              lastName,
              email,
              displayName,
              profileImageUrl
            ),
            organization:organizationUlid (
              name,
              type,
              industry
            )
          `);

        // Build filter conditions
        const conditions = [];
        
        // Always include user's personal goals
        conditions.push(`userUlid.eq.${context.userUlid}`);
        
        // Include organization goals if user belongs to any orgs
        if (userOrgIds.length > 0) {
          conditions.push(`organizationUlid.in.(${userOrgIds.join(',')})`);
        }
        
        // Add optional filters
        if (params.status) {
          const validStatus = Object.values(GOAL_STATUS).find(s => s === params.status);
          if (validStatus) {
            query = query.eq("status", validStatus);
          }
        }
        if (params.type) {
          const validType = Object.values(GOAL_TYPE).find(t => t === params.type);
          if (validType) {
            query = query.eq("type", validType);
          }
        }
        if (params.userUlid) {
          query = query.eq("userUlid", params.userUlid);
        }
        if (params.organizationUlid) {
          query = query.eq("organizationUlid", params.organizationUlid);
        }
        
        // Combine all conditions with OR
        query = query.or(conditions.join(','));
        
        // Execute query
        const { data: goals, error: goalsError } = await query;
        
        if (goalsError) {
          // Only log goal errors on final attempt
          if (attempt === MAX_RETRIES) {
            console.error("[FETCH_GOALS_ERROR]", { 
              requestId,
              error: goalsError, 
              message: goalsError.message,
              timestamp: new Date().toISOString(),
              attempt
            });
          }
          lastError = goalsError;
          if (attempt < MAX_RETRIES) {
            await delay(RETRY_DELAY * attempt);
            continue;
          }
          throw goalsError;
        }
        
        // Check for overdue goals and update their status
        const updatedGoals = await updateOverdueGoals(goals || []);
        
        // Only log success in development or if it's the final attempt
        if (process.env.NODE_ENV === 'development' || attempt === MAX_RETRIES) {
          console.log("[FETCH_GOALS_SUCCESS]", { 
            requestId,
            totalGoals: updatedGoals.length,
            personalGoals: updatedGoals.filter(g => g.userUlid === context.userUlid && !g.organizationUlid).length,
            orgGoals: updatedGoals.filter(g => g.organizationUlid).length,
            timestamp: new Date().toISOString(),
            attempt
          });
        }
        
        return { data: updatedGoals, error: null };
      } catch (error) {
        lastError = error;
        
        // Only log errors on final attempt
        if (attempt === MAX_RETRIES) {
          console.error("[FETCH_GOALS_ERROR_AFTER_RETRIES]", {
            requestId,
            error,
            message: error instanceof Error ? error.message : "Unknown error",
            userUlid: context.userUlid,
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
            attempts: attempt
          });
        }
        
        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY * attempt);
        }
      }
    }
    
    // If all retries failed
    return {
      data: null,
      error: {
        code: "FETCH_ERROR" as ApiErrorCode,
        message: lastError instanceof Error ? lastError.message : "Failed to fetch goals after multiple retries",
      },
    };
  }
);

/**
 * Create a new personal goal
 * This is the function used by mentee profile page
 */
export const createGoal = withServerAction<any, GoalFormValues>(
  async (formData, context): Promise<ApiResponse<any>> => {
    console.log("[CREATE_PERSONAL_GOAL_START]", { 
      formData, 
      userUlid: context.userUlid,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Convert from GoalFormValues format to the format expected by the API
      const goalData = {
        title: formData.title,
        description: formData.description || "",
        startDate: new Date(),
        dueDate: new Date(formData.deadline),
        type: formData.type,
        target: { value: formData.target }, 
        progress: { value: formData.current },
        status: formData.status
      };
      
      // Use the createPersonalGoal function to actually create the goal
      return await createPersonalGoal(goalData);
    } catch (error) {
      console.error("[CREATE_GOAL_ERROR]", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: null,
        error: {
          code: "CREATE_ERROR" as ApiErrorCode,
          message: error instanceof Error ? error.message : "Failed to create goal",
        },
      };
    }
  }
);

/**
 * Create a new personal goal with raw data
 * This is the internal implementation used by createGoal 
 */
export const createPersonalGoal = withServerAction<any, any>(
  async (data, context): Promise<ApiResponse<any>> => {
    console.log("[CREATE_PERSONAL_GOAL_INTERNAL]", { 
      data, 
      contextUser: context.userUlid,
      target: data?.target,
      targetType: typeof data?.target,
      targetValue: data?.target?.value,
      targetValueType: typeof data?.target?.value,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Add validation handling test before zod validate
      if (data?.target && typeof data?.target === 'object') {
        // Ensure target.value is a number before validation
        if ('value' in data.target && typeof data.target.value !== 'number') {
          if (!isNaN(Number(data.target.value))) {
            data.target.value = Number(data.target.value);
          }
        }
      }
      
      // Validate input
      const validatedData = createGoalSchema.parse(data);
      const supabase = await createAuthClient();
      
      // Generate ULID
      const ulid = generateUlid();
      
      // Get the snake_case value for the type
      const typeValue = validatedData.type.toString();

      // Prepare goal data
      const goalData: any = {
        ulid,
        userUlid: context.userUlid,
        status: GOAL_STATUS.IN_PROGRESS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startDate: validatedData.startDate.toISOString(),
        dueDate: validatedData.dueDate.toISOString(),
        type: typeValue,
        title: validatedData.title,
        description: validatedData.description
      };

      // Handle optional JSON fields
      if (validatedData.target) {
        goalData.target = validatedData.target;
      } else {
        goalData.target = { value: 0 };
      }

      if (validatedData.progress) {
        goalData.progress = validatedData.progress;
      } else {
        goalData.progress = { value: 0 };
      }

      // Set completedAt explicitly to null
      goalData.completedAt = null;
      
      // Insert goal
      const { data: goal, error } = await supabase
        .from("Goal")
        .insert(goalData)
        .select("*")
        .single();
        
      if (error) {
        console.error("[CREATE_PERSONAL_GOAL_DB_ERROR]", { 
          error,
          timestamp: new Date().toISOString() 
        });
        throw new Error(`Failed to create goal: ${error.message}`);
      }
      
      console.log("[CREATE_PERSONAL_GOAL_SUCCESS]", { 
        goalId: goal.ulid,
        timestamp: new Date().toISOString() 
      });
      return { data: goal, error: null };
    } catch (error) {
      console.error("[CREATE_PERSONAL_GOAL_ERROR]", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        validationError: error instanceof z.ZodError,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid goal data",
            details: error.flatten(),
          },
        };
      }
      
      return {
        data: null,
        error: {
          code: "CREATE_ERROR" as ApiErrorCode,
          message: error instanceof Error ? error.message : "Failed to create goal",
        },
      };
    }
  }
);

/**
 * Update an existing personal goal
 */
export const updateGoal = withServerAction<any, {goalUlid: string, data: UpdateGoal}>(
  async (params, context): Promise<ApiResponse<any>> => {
    try {
      const { goalUlid, data } = params;
      
      // Validate input
      const validatedData = updateGoalSchema.parse(data);
      const supabase = await createAuthClient();
      
      // Prepare update data with only changed fields
      const updateData: any = {
        updatedAt: new Date().toISOString()
      };

      // Only include fields that are defined
      if (validatedData.startDate) {
        updateData.startDate = validatedData.startDate.toISOString();
      }

      if (validatedData.dueDate) {
        updateData.dueDate = validatedData.dueDate.toISOString();
      }

      if (validatedData.completedAt) {
        updateData.completedAt = validatedData.completedAt.toISOString();
      } else if (validatedData.completedAt === null) {
        updateData.completedAt = null;
      }

      if (validatedData.status) {
        updateData.status = validatedData.status;
      }

      if (validatedData.type) {
        updateData.type = validatedData.type;
      }

      if (validatedData.target) {
        updateData.target = validatedData.target;
      }

      if (validatedData.progress) {
        updateData.progress = validatedData.progress;
      }

      if (validatedData.title) {
        updateData.title = validatedData.title;
      }

      if (validatedData.description !== undefined) {
        updateData.description = validatedData.description;
      }
      
      // Update goal
      const { data: updatedGoal, error } = await supabase
        .from("Goal")
        .update(updateData)
        .eq("ulid", goalUlid)
        .select("*")
        .single();
        
      if (error) {
        throw new Error(`Failed to update goal: ${error.message}`);
      }
      
      return { data: updatedGoal, error: null };
    } catch (error) {
      console.error("[UPDATE_GOAL_ERROR]", error);
      
      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid goal data",
            details: error.flatten(),
          },
        };
      }
      
      return {
        data: null,
        error: {
          code: "UPDATE_ERROR" as ApiErrorCode,
          message: error instanceof Error ? error.message : "Failed to update goal",
        },
      };
    }
  }
);

/**
 * Legacy function to update organization goals for backward compatibility
 * This duplicates updateGoal functionality but with a different name
 */
export const updateOrganizationGoal = withServerAction<any, {goalUlid: string, data: UpdateGoal}>(
  async (params, context): Promise<ApiResponse<any>> => {
    try {
      const { goalUlid, data } = params;
      
      // Validate input
      const validatedData = updateGoalSchema.parse(data);
      const supabase = await createAuthClient();
      
      // Prepare update data with only changed fields
      const updateData: any = {
        updatedAt: new Date().toISOString()
      };

      // Only include fields that are defined
      if (validatedData.startDate) {
        updateData.startDate = validatedData.startDate.toISOString();
      }

      if (validatedData.dueDate) {
        updateData.dueDate = validatedData.dueDate.toISOString();
      }

      if (validatedData.completedAt) {
        updateData.completedAt = validatedData.completedAt.toISOString();
      } else if (validatedData.completedAt === null) {
        updateData.completedAt = null;
      }

      if (validatedData.status) {
        updateData.status = validatedData.status;
      }

      if (validatedData.type) {
        updateData.type = validatedData.type;
      }

      if (validatedData.target) {
        updateData.target = validatedData.target;
      }

      if (validatedData.progress) {
        updateData.progress = validatedData.progress;
      }

      if (validatedData.title) {
        updateData.title = validatedData.title;
      }

      if (validatedData.description !== undefined) {
        updateData.description = validatedData.description;
      }
      
      // Update goal
      const { data: updatedGoal, error } = await supabase
        .from("Goal")
        .update(updateData)
        .eq("ulid", goalUlid)
        .select("*")
        .single();
        
      if (error) {
        throw new Error(`Failed to update goal: ${error.message}`);
      }
      
      return { data: updatedGoal, error: null };
    } catch (error) {
      console.error("[UPDATE_ORG_GOAL_ERROR]", error);
      
      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid goal data",
            details: error.flatten(),
          },
        };
      }
      
      return {
        data: null,
        error: {
          code: "UPDATE_ERROR" as ApiErrorCode,
          message: error instanceof Error ? error.message : "Failed to update goal",
        },
      };
    }
  }
);

/**
 * Update goal progress
 */
export const updateGoalProgress = withServerAction<any, {goalUlid: string, progress: any}>(
  async (params, context): Promise<ApiResponse<any>> => {
    try {
      const { goalUlid, progress } = params;
      const supabase = await createAuthClient();
      
      // Update goal progress
      const { data: updatedGoal, error } = await supabase
        .from("Goal")
        .update({
          progress,
          updatedAt: new Date().toISOString(),
        })
        .eq("ulid", goalUlid)
        .select("*")
        .single();
        
      if (error) {
        throw new Error(`Failed to update goal progress: ${error.message}`);
      }
      
      return { data: updatedGoal, error: null };
    } catch (error) {
      console.error("[UPDATE_GOAL_PROGRESS_ERROR]", error);
      return {
        data: null,
        error: {
          code: "UPDATE_ERROR" as ApiErrorCode,
          message: error instanceof Error ? error.message : "Failed to update goal progress",
        },
      };
    }
  }
);

/**
 * Delete a goal
 */
export const deleteGoal = withServerAction<boolean, string>(
  async (goalUlid, context): Promise<ApiResponse<boolean>> => {
    try {
      const supabase = await createAuthClient();
      
      // Delete goal
      const { error } = await supabase
        .from("Goal")
        .delete()
        .eq("ulid", goalUlid);
        
      if (error) {
        throw new Error(`Failed to delete goal: ${error.message}`);
      }
      
      return { data: true, error: null };
    } catch (error) {
      console.error("[DELETE_GOAL_ERROR]", error);
      return {
        data: null,
        error: {
          code: "DATABASE_ERROR" as ApiErrorCode,
          message: error instanceof Error ? error.message : "Failed to delete goal",
        },
      };
    }
  }
);

/**
 * Helper function to update overdue goals
 */
async function updateOverdueGoals(goals: any[]) {
  const now = new Date();
  const requestId = generateUlid();
  
  // Filter overdue goals in memory to avoid unnecessary DB queries
  const overdueGoals = goals.filter(
    (goal) => 
      goal.status === GOAL_STATUS.IN_PROGRESS && 
      new Date(goal.dueDate) < now
  );
  
  if (overdueGoals.length === 0) {
    return goals;
  }
  
  console.log("[UPDATE_OVERDUE_GOALS_START]", { 
    requestId,
    overdueCount: overdueGoals.length,
    totalGoals: goals.length,
    timestamp: now.toISOString()
  });
  
  try {
    const supabase = await createAuthClient();
    
    // Update all overdue goals in a single query
    const { error } = await supabase
      .from("Goal")
      .update({
        status: GOAL_STATUS.OVERDUE,
        updatedAt: now.toISOString(),
      })
      .in("ulid", overdueGoals.map(g => g.ulid));
      
    if (error) {
      console.error("[OVERDUE_UPDATE_ERROR]", {
        requestId,
        error: error.message,
        goalsAffected: overdueGoals.length,
        timestamp: now.toISOString()
      });
      throw error;
    }
    
    // Update status in memory
    overdueGoals.forEach(goal => {
      const index = goals.findIndex((g) => g.ulid === goal.ulid);
      if (index !== -1) {
        goals[index].status = GOAL_STATUS.OVERDUE;
      }
    });
    
    console.log("[UPDATE_OVERDUE_GOALS_COMPLETE]", {
      requestId,
      updatedCount: overdueGoals.length,
      totalGoals: goals.length,
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error("[UPDATE_OVERDUE_GOALS_ERROR]", {
      requestId,
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: now.toISOString()
    });
  }
  
  return goals;
} 