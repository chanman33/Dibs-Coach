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
  GetGoals,
  Milestone
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
    
    // Validate that userUlid is defined
    if (!context.userUlid) {
      return {
        data: null,
        error: {
          code: 'AUTH_ERROR',
          message: 'User ID is required'
        }
      };
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
        status: formData.status,
        milestones: formData.milestones || [],
        growthPlan: formData.growthPlan || ""
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
      hasMilestones: !!data?.milestones,
      milestonesCount: Array.isArray(data?.milestones) ? data.milestones.length : 0,
      hasGrowthPlan: !!data?.growthPlan,
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
      
      // Handle milestones
      if (Array.isArray(validatedData.milestones) && validatedData.milestones.length > 0) {
        goalData.milestones = validatedData.milestones;
      } else if (validatedData.milestones) {
        // Ensure milestones is always stored as an array
        goalData.milestones = Array.isArray(validatedData.milestones) 
          ? validatedData.milestones 
          : [validatedData.milestones];
      }
      
      // Handle growth plan
      if (validatedData.growthPlan) {
        goalData.growthPlan = validatedData.growthPlan;
      }

      // Set completedAt explicitly to null
      goalData.completedAt = null;
      
      // Log the complete goal data before insertion
      console.log("[GOAL_DATA_BEFORE_INSERT]", {
        goalData,
        hasMilestones: !!goalData.milestones,
        milestonesCount: Array.isArray(goalData.milestones) ? goalData.milestones.length : 0,
        hasGrowthPlan: !!goalData.growthPlan,
        timestamp: new Date().toISOString()
      });
      
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
        milestones: goal.milestones,
        growthPlan: goal.growthPlan,
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
      
      console.log("[UPDATE_GOAL_START]", {
        goalUlid,
        updateFields: Object.keys(validatedData),
        hasMilestones: 'milestones' in validatedData,
        hasGrowthPlan: 'growthPlan' in validatedData,
        timestamp: new Date().toISOString()
      });
      
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
      
      // Handle milestones properly
      if (validatedData.milestones !== undefined) {
        // Ensure milestones is always stored as an array
        if (Array.isArray(validatedData.milestones)) {
          updateData.milestones = validatedData.milestones;
        } else if (validatedData.milestones) {
          updateData.milestones = [validatedData.milestones];
        } else {
          updateData.milestones = [];
        }
        
        console.log("[UPDATE_GOAL_MILESTONES]", {
          milestones: updateData.milestones,
          count: Array.isArray(updateData.milestones) ? updateData.milestones.length : 0,
          timestamp: new Date().toISOString()
        });
      }
      
      // Handle growthPlan
      if (validatedData.growthPlan !== undefined) {
        updateData.growthPlan = validatedData.growthPlan;
      }
      
      console.log("[UPDATE_GOAL_DATA]", {
        updateData,
        hasMilestones: 'milestones' in updateData,
        hasGrowthPlan: 'growthPlan' in updateData,
        timestamp: new Date().toISOString()
      });
      
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
      
      // Handle automatic goal status changes based on progress vs target
      if (validatedData.progress && 
          validatedData.target && 
          'value' in validatedData.progress &&
          'value' in validatedData.target &&
          typeof validatedData.progress.value === 'number' && 
          typeof validatedData.target.value === 'number') {
          
        // Scenario 1: Auto-complete when progress >= target
        if (validatedData.progress.value >= validatedData.target.value &&
            validatedData.status !== GOAL_STATUS.COMPLETED) {
          
          console.log('[SERVER_AUTO_COMPLETING_GOAL]', {
            goalId: goalUlid,
            progress: validatedData.progress.value,
            target: validatedData.target.value,
            timestamp: new Date().toISOString()
          });
          
          // Set to COMPLETED
          validatedData.status = GOAL_STATUS.COMPLETED;
          validatedData.completedAt = new Date();
        } 
        // Scenario 2: Revert to in-progress when progress < target for completed goals
        else if (validatedData.progress.value < validatedData.target.value &&
                validatedData.status === GOAL_STATUS.COMPLETED) {
          
          console.log('[REVERTING_GOAL_TO_IN_PROGRESS]', {
            goalId: goalUlid,
            progress: validatedData.progress.value,
            target: validatedData.target.value,
            timestamp: new Date().toISOString()
          });
          
          // Revert to IN_PROGRESS
          validatedData.status = GOAL_STATUS.IN_PROGRESS;
          validatedData.completedAt = null;
        }
      }
      
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
      
      // Add support for milestones and growthPlan
      if (validatedData.milestones !== undefined) {
        // Log milestone data for debugging
        console.log('[ORG_GOAL_MILESTONES]', {
          milestones: validatedData.milestones,
          type: typeof validatedData.milestones,
          timestamp: new Date().toISOString()
        });
        
        // Ensure milestones is properly formatted
        updateData.milestones = validatedData.milestones;
      }
      
      if (validatedData.growthPlan !== undefined) {
        updateData.growthPlan = validatedData.growthPlan;
      }
      
      // Log the update data before sending to database
      console.log('[ORG_GOAL_UPDATE_DATA]', {
        updateData,
        hasMilestones: 'milestones' in updateData,
        hasGrowthPlan: 'growthPlan' in updateData,
        statusChanged: validatedData.status !== data.status,
        autoCompleted: validatedData.status === GOAL_STATUS.COMPLETED && data.status !== GOAL_STATUS.COMPLETED,
        autoReverted: validatedData.status === GOAL_STATUS.IN_PROGRESS && data.status === GOAL_STATUS.COMPLETED,
        timestamp: new Date().toISOString()
      });
      
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

/**
 * Update a specific milestone for a goal
 */
export const updateGoalMilestone = withServerAction<any, {goalUlid: string, milestoneIndex: number, completed: boolean}>(
  async (params, context): Promise<ApiResponse<any>> => {
    try {
      const { goalUlid, milestoneIndex, completed } = params;
      const supabase = await createAuthClient();
      
      // First get the current goal to access its milestones
      const { data: goal, error: fetchError } = await supabase
        .from("Goal")
        .select("*")
        .eq("ulid", goalUlid)
        .single();
        
      if (fetchError) {
        throw new Error(`Failed to fetch goal: ${fetchError.message}`);
      }
      
      // Parse milestones from the database (could be string or object)
      let milestonesArray: any[] = [];
      
      // Use type assertion to avoid type errors
      const goalData = goal as any;
      
      if (goalData.milestones) {
        try {
          // If milestones is a string, parse it
          if (typeof goalData.milestones === 'string') {
            milestonesArray = JSON.parse(goalData.milestones);
          } 
          // If milestones is already an object, use it directly
          else if (Array.isArray(goalData.milestones)) {
            milestonesArray = goalData.milestones;
          }
          // If it's an object but not an array, wrap it
          else if (typeof goalData.milestones === 'object') {
            milestonesArray = [goalData.milestones];
          }
        } catch (e) {
          console.error('[MILESTONE_PARSE_ERROR]', {
            error: e,
            milestones: goalData.milestones,
            goalId: goalUlid,
            timestamp: new Date().toISOString()
          });
          milestonesArray = [];
        }
      }
      
      // Check if the milestone index is valid
      if (milestoneIndex < 0 || milestoneIndex >= milestonesArray.length) {
        throw new Error(`Invalid milestone index: ${milestoneIndex}`);
      }
      
      // Update the milestone completed status
      milestonesArray[milestoneIndex].completed = completed;
      
      // Update the goal with the modified milestones
      const { data: updatedGoal, error: updateError } = await supabase
        .from("Goal")
        .update({
          milestones: milestonesArray,
          updatedAt: new Date().toISOString(),
        })
        .eq("ulid", goalUlid)
        .select("*")
        .single();
        
      if (updateError) {
        throw new Error(`Failed to update milestone: ${updateError.message}`);
      }
      
      return { data: updatedGoal, error: null };
    } catch (error) {
      console.error("[UPDATE_MILESTONE_ERROR]", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined, 
        timestamp: new Date().toISOString()
      });
      
      return {
        data: null,
        error: {
          code: "UPDATE_ERROR" as ApiErrorCode,
          message: error instanceof Error ? error.message : "Failed to update milestone",
        },
      };
    }
  }
); 