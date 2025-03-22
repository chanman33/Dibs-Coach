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
import { withServerAction, ServerActionContext } from "@/utils/middleware/withServerAction";
import { ApiResponse, ApiErrorCode } from "@/utils/types/api";
import { generateUlid } from "@/utils/ulid";
import { createAuthClient } from "@/utils/auth";

/**
 * Fetch organization goals with filtering options
 */
export const fetchOrganizationGoals = withServerAction<GoalWithRelations[], string>(
  async (organizationUlid: string, context: ServerActionContext): Promise<ApiResponse<GoalWithRelations[]>> => {
    console.log("[FETCH_ORG_GOALS_START]", { organizationUlid, userUlid: context.userUlid });
    
    try {
      const supabase = await createAuthClient();
      
      // First query to check if any goals exist for debugging
      const { count: totalGoalCount, error: countError } = await supabase
        .from("Goal")
        .select('*', { count: 'exact', head: true });
        
      console.log("[FETCH_ORG_GOALS_TOTAL_COUNT]", { 
        totalCount: totalGoalCount || 0,
        hasError: !!countError,
        errorMessage: countError?.message
      });
      
      // Optimized query to fetch organization goals
      const { data: orgGoals, error: goalsError } = await supabase
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
        `)
        .eq("organizationUlid", organizationUlid);
      
      if (goalsError) {
        console.error("[FETCH_ORG_GOALS_ERROR]", { 
          error: goalsError, 
          message: goalsError.message,
          organizationUlid
        });
        throw new Error(`Failed to fetch organization goals: ${goalsError.message}`);
      }
      
      // Get organization members for filtering
      const { data: orgMembers, error: membersError } = await supabase
        .from("OrganizationMember")
        .select("userUlid")
        .eq("organizationUlid", organizationUlid)
        .eq("status", "ACTIVE");
      
      if (membersError) {
        console.error("[FETCH_ORG_MEMBERS_ERROR]", {
          error: membersError,
          message: membersError.message,
          organizationUlid
        });
      }
        
      const memberUlids = orgMembers?.map(m => m.userUlid) || [];
      
      // Get personal goals of organization members
      const { data: memberGoals, error: memberGoalsError } = memberUlids.length > 0 ? await supabase
        .from("Goal")
        .select(`
          *,
          user:userUlid (
            firstName,
            lastName,
            email,
            displayName,
            profileImageUrl
          )
        `)
        .in("userUlid", memberUlids)
        .is("organizationUlid", null) : { data: null, error: null };
      
      if (memberGoalsError) {
        console.error("[FETCH_MEMBER_GOALS_ERROR]", {
          error: memberGoalsError,
          message: memberGoalsError.message,
          memberCount: memberUlids.length
        });
      }
      
      // Combine organization goals and personal goals of members
      const allGoals = [
        ...(orgGoals || []),
        ...(memberGoals || [])
      ];
      
      // Check for overdue goals and update their status
      const updatedGoals = await updateOverdueGoals(allGoals);
      
      console.log("[FETCH_ORG_GOALS_SUCCESS]", { 
        orgGoals: orgGoals?.length || 0,
        memberGoals: memberGoals?.length || 0,
        totalGoals: updatedGoals.length,
        organizationUlid
      });
      
      return { data: updatedGoals, error: null };
    } catch (error) {
      console.error("[FETCH_ORGANIZATION_GOALS_ERROR]", {
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
          message: error instanceof Error ? error.message : "Failed to fetch organization goals",
        },
      };
    }
  }
);

/**
 * Create a new goal for an organization or organization member
 */
export const createOrganizationGoal = withServerAction<any, any>(
  async (data, context): Promise<ApiResponse<any>> => {
    console.log("[CREATE_ORG_GOAL_START]", { 
      data, 
      contextUser: context.userUlid,
      assignTo: data?.assignTo,
      organizationUlid: data?.organizationUlid,
      userUlid: data?.userUlid,
      target: data?.target,
      targetType: typeof data?.target,
      targetValue: data?.target?.value,
      targetValueType: typeof data?.target?.value
    });
    
    try {
      // Log raw data before validation
      console.log("[CREATE_ORG_GOAL_PRE_VALIDATION]", {
        targetStructure: JSON.stringify(data?.target),
        hasTargetProperty: 'target' in data,
        targetFieldType: typeof data?.target,
        targetValueType: typeof data?.target?.value,
        targetValidation: data?.target && typeof data?.target.value === 'number' ? 'valid' : 'invalid'
      });
      
      // Add validation handling test before zod validate
      if (data?.target && typeof data?.target === 'object') {
        console.log("[TARGET_VALIDATION_CHECK]", {
          isObject: true,
          hasValueProperty: 'value' in data.target,
          valueType: typeof data.target.value,
          valueIsNumeric: !isNaN(Number(data.target.value)),
          valueAsNumber: Number(data.target.value)
        });
        
        // Ensure target.value is a number before validation
        if ('value' in data.target && typeof data.target.value !== 'number') {
          if (!isNaN(Number(data.target.value))) {
            data.target.value = Number(data.target.value);
            console.log("[TARGET_VALUE_CONVERTED]", {
              original: data.target.value,
              converted: Number(data.target.value),
              type: typeof data.target.value
            });
          }
        }
      }
      
      // Validate input
      try {
        const validatedData = createGoalSchema.parse(data);
        console.log("[CREATE_ORG_GOAL_VALIDATION_SUCCESS]", {
          startDate: validatedData.startDate,
          dueDate: validatedData.dueDate,
          title: validatedData.title,
          type: validatedData.type,
          organizationUlid: validatedData.organizationUlid,
          target: validatedData.target,
          targetType: typeof validatedData.target
        });
      } catch (validationError) {
        console.error("[CREATE_ORG_GOAL_VALIDATION_ERROR]", {
          error: validationError,
          isZodError: validationError instanceof z.ZodError,
          errorDetails: validationError instanceof z.ZodError ? 
            validationError.format() : 'Not a Zod error'
        });
        throw validationError;
      }
      
      const validatedData = createGoalSchema.parse(data);
      const supabase = await createAuthClient();
      
      console.log("[CREATE_ORG_GOAL_VALIDATED]", { 
        startDate: validatedData.startDate,
        dueDate: validatedData.dueDate,
        title: validatedData.title,
        type: validatedData.type,
        organizationUlid: validatedData.organizationUlid,
        target: validatedData.target,
        targetType: typeof validatedData.target,
        targetValue: validatedData.target?.value,
        targetValueType: typeof validatedData.target?.value
      });
      
      // Generate ULID
      const ulid = generateUlid();
      
      // Get the snake_case value for the type
      const typeValue = validatedData.type.toString();

      // Prepare goal data
      const goalData: any = {
        ulid,
        userUlid: data.userUlid || context.userUlid, // Use provided userUlid or default to creator
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
        console.log("[TARGET_BEFORE_ASSIGNMENT]", {
          validatedTarget: validatedData.target,
          targetType: typeof validatedData.target,
          isObject: typeof validatedData.target === 'object',
          hasValue: 'value' in (validatedData.target || {})
        });
        
        goalData.target = validatedData.target;
      } else {
        goalData.target = { value: 0 };
      }

      if (validatedData.progress) {
        goalData.progress = validatedData.progress;
      } else {
        goalData.progress = { value: 0 };
      }

      // Handle organization ID
      if (validatedData.organizationUlid) {
        goalData.organizationUlid = validatedData.organizationUlid;
      } else if (data.assignTo === 'organization' && data.organizationUlid) {
        goalData.organizationUlid = data.organizationUlid;
      }

      // Set completedAt explicitly to null
      goalData.completedAt = null;
      
      console.log("[CREATE_ORG_GOAL_DATA_PREPARED]", { 
        goalData,
        targetFinal: goalData.target,
        targetFinalType: typeof goalData.target,
        progressFinal: goalData.progress,
        assignedTo: data.userUlid ? 'specific user' : 'organization'
      });
      
      // Insert goal
      const { data: goal, error } = await supabase
        .from("Goal")
        .insert(goalData)
        .select("*")
        .single();
        
      if (error) {
        console.error("[CREATE_ORG_GOAL_DB_ERROR]", { error });
        throw new Error(`Failed to create organization goal: ${error.message}`);
      }
      
      console.log("[CREATE_ORG_GOAL_SUCCESS]", { goalId: goal.ulid });
      return { data: goal, error: null };
    } catch (error) {
      console.error("[CREATE_ORGANIZATION_GOAL_ERROR]", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        validationError: error instanceof z.ZodError,
        stack: error instanceof Error ? error.stack : undefined
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
          message: error instanceof Error ? error.message : "Failed to create organization goal",
        },
      };
    }
  }
);

/**
 * Update an existing organization goal
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
        throw new Error(`Failed to update organization goal: ${error.message}`);
      }
      
      return { data: updatedGoal, error: null };
    } catch (error) {
      console.error("[UPDATE_ORGANIZATION_GOAL_ERROR]", error);
      
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
          message: error instanceof Error ? error.message : "Failed to update organization goal",
        },
      };
    }
  }
);

/**
 * Update organization goal progress
 */
export const updateOrganizationGoalProgress = withServerAction<any, {goalUlid: string, progress: any}>(
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
        throw new Error(`Failed to update organization goal progress: ${error.message}`);
      }
      
      return { data: updatedGoal, error: null };
    } catch (error) {
      console.error("[UPDATE_ORG_GOAL_PROGRESS_ERROR]", error);
      return {
        data: null,
        error: {
          code: "UPDATE_ERROR" as ApiErrorCode,
          message: error instanceof Error ? error.message : "Failed to update organization goal progress",
        },
      };
    }
  }
);

/**
 * Delete an organization goal
 */
export const deleteOrganizationGoal = withServerAction<boolean, string>(
  async (goalUlid, context): Promise<ApiResponse<boolean>> => {
    try {
      const supabase = await createAuthClient();
      
      // Delete goal
      const { error } = await supabase
        .from("Goal")
        .delete()
        .eq("ulid", goalUlid);
        
      if (error) {
        throw new Error(`Failed to delete organization goal: ${error.message}`);
      }
      
      return { data: true, error: null };
    } catch (error) {
      console.error("[DELETE_ORG_GOAL_ERROR]", error);
      return {
        data: null,
        error: {
          code: "DATABASE_ERROR" as ApiErrorCode,
          message: error instanceof Error ? error.message : "Failed to delete organization goal",
        },
      };
    }
  }
);

/**
 * Helper function to update overdue goals
 * (Shared between organization and personal goals)
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
  
  console.log("[UPDATE_OVERDUE_ORG_GOALS_START]", { 
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
      console.error("[OVERDUE_ORG_UPDATE_ERROR]", {
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
    
    console.log("[UPDATE_OVERDUE_ORG_GOALS_COMPLETE]", {
      requestId,
      updatedCount: overdueGoals.length,
      totalGoals: goals.length,
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error("[UPDATE_OVERDUE_ORG_GOALS_ERROR]", {
      requestId,
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: now.toISOString()
    });
  }
  
  return goals;
} 