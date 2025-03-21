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
  GoalType
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
    console.log("[FETCH_GOALS_START]", { organizationUlid, userUlid: context.userUlid });
    
    try {
      const supabase = await createAuthClient();
      
      // First query to check if any goals exist for debugging
      const { count: totalGoalCount, error: countError } = await supabase
        .from("Goal")
        .select('*', { count: 'exact', head: true });
        
      console.log("[FETCH_GOALS_TOTAL_COUNT]", { 
        totalCount: totalGoalCount || 0,
        hasError: !!countError,
        errorMessage: countError?.message
      });
      
      // Simplified approach for debugging - get all goals without complex filters
      const { data: allGoals, error: allGoalsError } = await supabase
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
        `);
      
      if (allGoalsError) {
        console.error("[FETCH_ALL_GOALS_ERROR]", { 
          error: allGoalsError, 
          message: allGoalsError.message 
        });
        throw new Error(`Failed to fetch goals: ${allGoalsError.message}`);
      }
      
      console.log("[ALL_GOALS_FETCHED]", {
        count: allGoals?.length || 0,
        sample: allGoals && allGoals.length > 0 ? {
          ulid: allGoals[0].ulid,
          title: allGoals[0].title,
          orgId: allGoals[0].organizationUlid,
          userId: allGoals[0].userUlid
        } : null
      });
      
      // Now manually filter for the requested organization
      let filteredGoals = [];
      if (organizationUlid && allGoals) {
        // Get organization members for filtering
        const { data: orgMembers, error: membersError } = await supabase
          .from("OrganizationMember")
          .select("userUlid")
          .eq("organizationUlid", organizationUlid)
          .eq("status", "ACTIVE");
        
        console.log("[ORG_MEMBERS_FETCHED]", {
          count: orgMembers?.length || 0,
          error: membersError?.message,
          orgId: organizationUlid
        });
        
        const memberUlids = orgMembers?.map(m => m.userUlid) || [];
        
        // Manual filtering based on organization ID or user membership
        filteredGoals = allGoals.filter(goal => 
          goal.organizationUlid === organizationUlid || 
          (memberUlids.includes(goal.userUlid))
        );
        
        console.log("[GOALS_MANUALLY_FILTERED]", {
          orgId: organizationUlid,
          memberCount: memberUlids.length,
          beforeCount: allGoals.length,
          afterCount: filteredGoals.length
        });
      } else {
        filteredGoals = allGoals || [];
      }
      
      // Check for overdue goals and update their status
      const updatedGoals = await updateOverdueGoals(filteredGoals);
      
      console.log("[FETCH_GOALS_SUCCESS]", { 
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
          message: error instanceof Error ? error.message : "Failed to fetch goals",
        },
      };
    }
  }
);

/**
 * Create a new goal for an organization or individual
 */
export const createOrganizationGoal = withServerAction<any, any>(
  async (data, context): Promise<ApiResponse<any>> => {
    console.log("[CREATE_GOAL_START]", { 
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
      console.log("[CREATE_GOAL_PRE_VALIDATION]", {
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
        console.log("[CREATE_GOAL_VALIDATION_SUCCESS]", {
          startDate: validatedData.startDate,
          dueDate: validatedData.dueDate,
          title: validatedData.title,
          type: validatedData.type,
          organizationUlid: validatedData.organizationUlid,
          target: validatedData.target,
          targetType: typeof validatedData.target
        });
      } catch (validationError) {
        console.error("[CREATE_GOAL_VALIDATION_ERROR]", {
          error: validationError,
          isZodError: validationError instanceof z.ZodError,
          errorDetails: validationError instanceof z.ZodError ? 
            validationError.format() : 'Not a Zod error'
        });
        throw validationError;
      }
      
      const validatedData = createGoalSchema.parse(data);
      const supabase = await createAuthClient();
      
      console.log("[CREATE_GOAL_VALIDATED]", { 
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
      }

      // Set completedAt explicitly to null
      goalData.completedAt = null;
      
      console.log("[CREATE_GOAL_DATA_PREPARED]", { 
        goalData,
        targetFinal: goalData.target,
        targetFinalType: typeof goalData.target,
        progressFinal: goalData.progress,
        assignedTo: validatedData.userUlid || 'organization'
      });
      
      // Insert goal
      const { data: goal, error } = await supabase
        .from("Goal")
        .insert(goalData)
        .select("*")
        .single();
        
      if (error) {
        console.error("[CREATE_GOAL_DB_ERROR]", { error });
        throw new Error(`Failed to create goal: ${error.message}`);
      }
      
      console.log("[CREATE_GOAL_SUCCESS]", { goalId: goal.ulid });
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
          message: error instanceof Error ? error.message : "Failed to create goal",
        },
      };
    }
  }
);

/**
 * Update an existing goal
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
  console.log("[UPDATE_OVERDUE_GOALS_START]", { 
    totalGoals: goals.length,
    currentDate: now.toISOString()
  });
  
  const overdueGoals = goals.filter(
    (goal) => 
      goal.status === GOAL_STATUS.IN_PROGRESS && 
      new Date(goal.dueDate) < now
  );
  
  console.log("[OVERDUE_GOALS_IDENTIFIED]", {
    overdueCount: overdueGoals.length,
    overdueIds: overdueGoals.map(g => g.ulid)
  });
  
  if (overdueGoals.length === 0) {
    return goals;
  }
  
  const supabase = await createAuthClient();
  
  // Update overdue goals
  for (const goal of overdueGoals) {
    console.log("[UPDATING_OVERDUE_GOAL]", {
      goalId: goal.ulid,
      title: goal.title,
      oldStatus: goal.status,
      dueDate: goal.dueDate
    });
    
    const { error } = await supabase
      .from("Goal")
      .update({
        status: GOAL_STATUS.OVERDUE,
        updatedAt: new Date().toISOString(),
      })
      .eq("ulid", goal.ulid);
      
    if (error) {
      console.error("[OVERDUE_UPDATE_ERROR]", {
        goalId: goal.ulid,
        error: error.message
      });
    }
      
    // Update status in the original goal object
    const index = goals.findIndex((g) => g.ulid === goal.ulid);
    if (index !== -1) {
      goals[index].status = GOAL_STATUS.OVERDUE;
      console.log("[GOAL_STATUS_UPDATED]", {
        goalId: goal.ulid,
        newStatus: GOAL_STATUS.OVERDUE
      });
    }
  }
  
  console.log("[UPDATE_OVERDUE_GOALS_COMPLETE]", {
    updatedCount: overdueGoals.length,
    totalGoals: goals.length
  });
  
  return goals;
}

/**
 * Helper function to generate SQL for getting organization members
 */
function getOrgMembersSql(organizationUlid: string) {
  return `
    SELECT "userUlid" FROM "OrganizationMember" 
    WHERE "organizationUlid" = '${organizationUlid}' 
    AND "status" = 'ACTIVE'
  `;
} 